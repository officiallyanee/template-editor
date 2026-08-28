import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
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
    "p-1",
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
    "max-sm:grid-rows-[minmax(0,55fr)_minmax(0,45fr)]",
  );
  expect(
    screen.getByLabelText("Editable template canvas").parentElement,
  ).toHaveClass("items-center", "justify-center");
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
      .map((option) => option.textContent?.replace(" · active", "")),
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
