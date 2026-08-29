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

it("switches to the feature-focused template without creating an edit revision", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Template" }),
    "launch-dashboard",
  );

  expect(screen.getByText("Responsive status layout")).toBeInTheDocument();
  expect(screen.getByTestId("element-headline")).toHaveTextContent(
    "Launch work, without losing the thread.",
  );
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
  expect(
    localStorage.getItem("scoped-template-editor:v2:launch-dashboard"),
  ).toContain('"templateId":"launch-dashboard"');
});

it("restores each template's edits when switching between documents", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  const template = screen.getByRole("combobox", { name: "Template" });
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "56px",
  });

  await user.selectOptions(template, "launch-dashboard");
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "48px",
  });
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "50px",
  });

  await user.selectOptions(template, "example-studio");

  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "56px",
  });
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();

  await user.selectOptions(template, "launch-dashboard");

  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "50px",
  });
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
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
  await user.click(screen.getByRole("button", { name: "Preview Restore" }));
  expect(
    screen.getByText(
      "Nothing to restore—current values already match this saved version.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Restore as New Saved Version" }),
  ).toBeNull();
  expect(screen.getByText("Version saved · v2")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Cancel saved version preview" }),
  );
  await user.click(screen.getByRole("button", { name: "Review History" }));

  expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByText(/recoverable revision/i)).toBeInTheDocument();
});

it("previews and atomically restores a saved document as a new saved version", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const heading = screen.getByTestId("element-headline");
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "56px",
  });
  await user.click(screen.getByRole("tab", { name: "Saves" }));
  await user.click(
    screen.getByRole("button", { name: "Save Current Version" }),
  );
  await user.click(screen.getByRole("tab", { name: "Edit" }));
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  expect(heading).toHaveStyle({ fontSize: "58px" });
  await user.click(screen.getByRole("tab", { name: "Saves" }));

  await user.click(screen.getByRole("button", { name: "Preview Restore" }));
  expect(
    screen.getByRole("region", { name: "Restore preview for saved version 2" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/canvas is read-only/i)).toBeInTheDocument();
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "56px",
  });
  expect(screen.getByRole("document")).toHaveClass("h-full", "overflow-y-auto");
  expect(screen.getByRole("document").parentElement).toHaveStyle({
    maxWidth: "920px",
    height: "650px",
  });
  expect(screen.getByText("Autosaved · v3")).toBeInTheDocument();
  expect(screen.getByTestId("element-headline")).not.toHaveAttribute(
    "role",
    "option",
  );

  await user.click(
    screen.getByRole("button", { name: "Restore as New Saved Version" }),
  );
  expect(screen.getByTestId("element-headline")).toHaveStyle({
    fontSize: "56px",
  });
  expect(screen.getByText("Version saved · v4")).toBeInTheDocument();
  expect(screen.getByText("Saved Version 4")).toBeInTheDocument();
  expect(
    screen.getByText("Restored from a saved version", { exact: false }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("region", {
      name: "Restore preview for saved version 2",
    }),
  ).toBeNull();
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
  expect(
    within(dialog).getByLabelText("Template preview canvas").parentElement,
  ).toHaveStyle({ maxWidth: "920px" });
  expect(
    within(dialog).getByLabelText("Template preview canvas").parentElement,
  ).toHaveClass("flex", "justify-center");
  expect(within(dialog).queryByRole("option")).toBeNull();
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();

  const exit = within(dialog).getByRole("button", { name: "Exit Preview" });
  expect(exit).toHaveClass("text-preview-chrome-text");
  await user.click(within(dialog).getByRole("button", { name: "Mobile" }));
  expect(
    within(dialog).getByLabelText("Template preview canvas").parentElement,
  ).toHaveStyle({ maxWidth: "375px" });
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
  await user.keyboard("{Escape}");

  expect(
    screen.queryByRole("dialog", { name: "Full Screen Preview" }),
  ).toBeNull();
  expect(launch).toHaveFocus();
});

it("persists the optional device frame without changing template state", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const canvas = screen.getByLabelText("Editable template canvas");
  expect(canvas.parentElement).toHaveAttribute("data-device-frame", "off");
  expect(
    canvas.parentElement?.querySelector("[data-device-hardware]"),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Show Device Frame" }));

  expect(canvas.parentElement).toHaveAttribute("data-device-frame", "on");
  expect(
    canvas.parentElement?.querySelector('[data-device-hardware="desktop"]'),
  ).toBeInTheDocument();
  expect(localStorage.getItem("scope-device-frame:v2")).toBe("on");
  expect(localStorage.getItem("scope-device-frame")).toBeNull();
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
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
    localStorage.getItem("scoped-template-checkpoints:v2:example-studio") ??
      "[]",
  );
  expect(saved).toHaveLength(1);
  expect(saved[0]).toEqual(
    expect.objectContaining({ reason: "session-end", toTemplateVersion: 2 }),
  );
});

it("handles restoring global checkpoint when current values already match or invalid", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  await user.click(screen.getByRole("tab", { name: "Saves" }));
  await user.click(
    screen.getByRole("button", { name: "Save Current Version" }),
  );

  await user.click(screen.getByRole("button", { name: "Preview Restore" }));
  expect(
    screen.getByText(
      /Nothing to restore—current values already match this saved version/i,
    ),
  ).toBeInTheDocument();
});
