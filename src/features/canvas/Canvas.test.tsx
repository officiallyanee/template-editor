import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AppProviders } from "../../app/AppProviders";
import { Canvas } from "./Canvas";
import { App } from "../../app/App";
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
  expect(screen.getByText("Saved · v2")).toBeInTheDocument();
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
