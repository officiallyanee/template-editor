import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AppProviders } from "./AppProviders";
import { App } from "./App";

beforeEach(() => localStorage.clear());

it("keeps the layer summary outside the independently scrolling layer list", () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const layers = screen.getByRole("complementary", {
    name: "Template layers",
  });
  const list = within(layers).getByRole("listbox");
  const summary =
    within(layers).getByText("All views").parentElement?.parentElement;

  expect(layers).toHaveClass("min-h-0", "overflow-hidden");
  expect(list).toHaveClass(
    "min-h-0",
    "flex-1",
    "overflow-x-hidden",
    "overflow-y-auto",
    "py-1",
  );
  expect(summary).toHaveClass("shrink-0");
});

it("uses shrink-safe header controls and fractional mobile workspace rows", () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const scope = screen.getByLabelText("Edit Scope");
  const template = screen.getByLabelText("Template");
  const shell = screen.getByRole("main").parentElement;
  const headerControls = scope.parentElement?.parentElement;

  expect(scope).toHaveClass("min-w-0", "max-sm:w-full");
  expect(template).toHaveClass("w-full", "min-w-0");
  expect(headerControls).toHaveClass(
    "max-sm:grid-cols-[minmax(0,1fr)_auto_auto]",
  );
  expect(shell).toHaveClass(
    "min-h-0",
    "overflow-hidden",
    "grid-cols-[clamp(210px,16vw,240px)_minmax(480px,1fr)_clamp(320px,24vw,360px)]",
    "max-sm:h-[calc(100dvh-84px)]",
    "max-sm:grid-rows-[minmax(0,55fr)_minmax(0,45fr)]",
  );
  expect(
    screen.getByLabelText("Editable template canvas").parentElement,
  ).toHaveClass("items-center", "justify-center");
  expect(screen.getByRole("main")).toHaveClass("min-h-0");
});

it("lists template layers in document order instead of interleaving children", () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const layerList = screen.getByRole("listbox", { name: "Page Layers" });

  expect(
    within(layerList)
      .getAllByRole("option")
      .map((option) => option.textContent?.replace(" · Active", "")),
  ).toEqual([
    "Pagecontainer",
    "Eyebrowparagraph",
    "Hero headingheading",
    "Hero copyparagraph",
    "Primary actionbutton",
    "Services gridcontainer",
    "Strategy cardparagraph",
    "Design cardparagraph",
  ]);
});

it("uses quiet structural groups and clearer interactive controls in Edit", () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const tools = screen.getByRole("complementary", { name: "Editing tools" });
  const textSizeGroup =
    screen.getByText("Text Size").parentElement?.parentElement;
  const content = screen.getByRole("textbox", { name: "Content" });

  expect(tools).toHaveClass("border-hairline");
  expect(textSizeGroup).toHaveClass("border-hairline", "bg-canvas-soft");
  expect(content).toHaveClass("border-border-default", "bg-raised");
  for (const button of [
    screen.getByRole("button", { name: "Decrease text size" }),
    screen.getByRole("button", { name: "Increase text size" }),
  ])
    expect(button).toHaveClass("border-border-default", "bg-raised");
});

it("toggles theme and handles reset confirmation", async () => {
  const user = userEvent.setup();
  const confirmSpy = vi.spyOn(window, "confirm");
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const themeBtn = screen.getByRole("button", {
    name: /Switch to (Dark|Light) Theme/i,
  });
  await user.click(themeBtn);
  expect(document.documentElement).toHaveAttribute("data-theme");

  const resetBtn = screen.getByRole("button", { name: "Reset" });

  confirmSpy.mockReturnValueOnce(false);
  await user.click(resetBtn);

  confirmSpy.mockReturnValueOnce(true);
  await user.click(resetBtn);
  expect(confirmSpy).toHaveBeenCalledTimes(2);
  confirmSpy.mockRestore();
});
