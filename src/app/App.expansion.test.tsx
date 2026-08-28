import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";
import { AppProviders } from "./AppProviders";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.layers = "open";
});

it("closes and persists Page Layers without changing the template version", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const toggle = screen.getByRole("button", { name: "Hide Page Layers" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(toggle.closest("aside")).toHaveAttribute("id", "layer-rail");

  await user.click(toggle);

  expect(
    screen.getByRole("complementary", { name: "Template layers" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("listbox", { name: "Page Layers" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Show Page Layers" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(localStorage.getItem("scope-layers-panel")).toBe("closed");
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show Page Layers" })).toBe(toggle);
  expect(toggle).toHaveFocus();
});

it("groups edits into a saved global version and routes to scoped recovery", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Saves" }));

  expect(screen.getByText("No Saved Versions Yet")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Save Current Version" }),
  );
  expect(
    screen.getByRole("heading", { name: "Saved Versions" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Saved Version 2")).toBeInTheDocument();
  expect(screen.getByText("Version saved · v2")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review History" }));

  expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByText(/recoverable revision/i)).toBeInTheDocument();
});

it("opens a read-only full-screen preview and restores focus on exit", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const launch = screen.getByRole("button", { name: "Full Screen Preview" });
  await user.click(launch);

  const dialog = screen.getByRole("dialog", { name: "Full Screen Preview" });
  expect(
    within(dialog).getByLabelText("Template preview canvas"),
  ).toBeInTheDocument();
  expect(within(dialog).getByLabelText("Template preview canvas")).toHaveStyle({
    maxWidth: "none",
  });
  expect(
    within(dialog).getByLabelText("Template preview canvas").parentElement,
  ).toHaveClass("flex", "justify-center");
  expect(within(dialog).queryByRole("option")).toBeNull();
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();

  const exit = within(dialog).getByRole("button", { name: "Exit Preview" });
  expect(exit).toHaveClass("text-preview-chrome-text");
  await user.click(within(dialog).getByRole("button", { name: "Mobile" }));
  expect(within(dialog).getByLabelText("Template preview canvas")).toHaveStyle({
    maxWidth: "375px",
  });
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
  await user.keyboard("{Escape}");

  expect(
    screen.queryByRole("dialog", { name: "Full Screen Preview" }),
  ).toBeNull();
  expect(launch).toHaveFocus();
});

it("writes one session checkpoint when the page closes with unsaved edits", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("button", { name: "Increase text size" }));

  window.dispatchEvent(new Event("pagehide"));

  const saved = JSON.parse(
    localStorage.getItem("scoped-template-checkpoints:v1") ?? "[]",
  );
  expect(saved).toHaveLength(1);
  expect(saved[0]).toEqual(
    expect.objectContaining({ reason: "session-end", toTemplateVersion: 2 }),
  );
});
