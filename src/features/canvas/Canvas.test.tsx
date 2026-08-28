import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { AppProviders } from "../../app/AppProviders";
import { Canvas } from "./Canvas";
import { App } from "../../app/App";

beforeEach(() => localStorage.clear());
it("selects a canvas element with the keyboard", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <Canvas />
    </AppProviders>,
  );
  const intro = screen.getByTestId("element-intro");
  intro.focus();
  await user.keyboard("{Enter}");
  expect(intro).toHaveAttribute("aria-selected", "true");
});

it("lets the root Page background be selected and edited", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("option", { name: /Page container/i }));
  const background = screen.getByLabelText("Background Color");
  fireEvent.change(background, { target: { value: "#112233" } });
  expect(screen.getByLabelText("Editable template canvas")).toHaveStyle({
    backgroundColor: "#112233",
  });
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
});
it("exposes every editable canvas element as a focusable option", () => {
  render(
    <AppProviders>
      <Canvas />
    </AppProviders>,
  );
  for (const element of screen.getAllByRole("option"))
    expect(element).toHaveAttribute("tabindex", "0");
});

it("selects the root Page from the canvas background with the keyboard", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const canvas = screen.getByLabelText("Editable template canvas");
  canvas.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("heading", { name: "Page" })).toBeInTheDocument();
  expect(screen.getByLabelText("Background Color")).toBeInTheDocument();
});

it("makes the latest additive selection active without losing the group", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const headline = screen.getByTestId("element-headline");
  const intro = screen.getByTestId("element-intro");
  intro.focus();
  await user.keyboard("{Shift>}{Enter}{/Shift}");

  expect(headline).toHaveAttribute("aria-selected", "true");
  expect(intro).toHaveAttribute("aria-selected", "true");
  expect(intro).toHaveAttribute("data-active", "true");
  expect(
    screen.getByRole("heading", { name: "Hero copy" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/2 selected · active element/i)).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByText(/active of 2 selected/i)).toBeInTheDocument();
  expect(screen.getAllByText("Hero copy")).not.toHaveLength(0);
});

it("promotes the most recent remaining member when the active item is removed", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const headline = screen.getByTestId("element-headline");
  const intro = screen.getByTestId("element-intro");
  intro.focus();
  await user.keyboard("{Shift>}{Enter}{/Shift}");
  await user.keyboard("{Shift>}{Enter}{/Shift}");

  expect(intro).toHaveAttribute("aria-selected", "false");
  expect(headline).toHaveAttribute("data-active", "true");
  expect(
    screen.getByRole("heading", { name: "Hero heading" }),
  ).toBeInTheDocument();
});

it("edits bounded container spacing and records the revision", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(
    screen.getByRole("option", { name: /Services grid container/i }),
  );
  const services = document.querySelector(".services");

  expect(services).toHaveStyle({ padding: "24px", gap: "16px" });
  await user.click(
    screen.getByRole("button", { name: "Increase container padding" }),
  );
  await user.click(screen.getByRole("button", { name: "Increase item gap" }));

  expect(services).toHaveStyle({ padding: "28px", gap: "20px" });
  expect(screen.getByText("Autosaved · v3")).toBeInTheDocument();
});

it("edits container direction through a constrained control", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(
    screen.getByRole("option", { name: /Services grid container/i }),
  );
  await user.click(screen.getByRole("radio", { name: "column" }));

  expect(document.querySelector(".services")).toHaveStyle({
    flexDirection: "column",
  });
  expect(screen.getByRole("radio", { name: "column" })).toBeChecked();
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
});

it("keeps viewport-only container spacing isolated", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(
    screen.getByRole("option", { name: /Services grid container/i }),
  );
  await user.selectOptions(screen.getByLabelText("Edit Scope"), "mobile");
  await user.click(screen.getByRole("button", { name: "Mobile" }));
  await user.click(screen.getByRole("button", { name: "Increase item gap" }));
  expect(document.querySelector(".services")).toHaveStyle({ gap: "20px" });

  await user.click(screen.getByRole("button", { name: "Desktop" }));
  expect(document.querySelector(".services")).toHaveStyle({ gap: "16px" });
});

it("positions a child through a constrained cross-axis value", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.selectOptions(
    screen.getByLabelText("Position in Container"),
    "end",
  );

  expect(screen.getByTestId("element-headline")).toHaveStyle({
    alignSelf: "end",
  });
  expect(screen.getByLabelText("Position in Container")).toHaveValue("end");
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
});

it("moves one element later without changing its properties", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const headline = screen.getByTestId("element-headline");
  const intro = screen.getByTestId("element-intro");
  const beforeStyle = headline.getAttribute("style");

  await user.click(screen.getByRole("button", { name: "Move Later" }));

  expect(
    headline.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_PRECEDING,
  ).toBeTruthy();
  expect(headline.getAttribute("style")).toBe(beforeStyle);
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
});

it("requires one selection and All Views for manual reorder", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.selectOptions(screen.getByLabelText("Edit Scope"), "mobile");
  expect(screen.getByRole("button", { name: "Move Later" })).toBeDisabled();
  expect(screen.getByText(/Order is shared/i)).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Edit Scope"), "all");
  const intro = screen.getByTestId("element-intro");
  intro.focus();
  await user.keyboard("{Shift>}{Enter}{/Shift}");
  expect(screen.getByRole("button", { name: "Move Later" })).toBeDisabled();
  expect(screen.getByText(/Select only this element/i)).toBeInTheDocument();
});
