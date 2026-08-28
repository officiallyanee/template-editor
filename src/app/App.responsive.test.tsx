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
  const summary = within(layers).getByText("All views").parentElement
    ?.parentElement;

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
  const style = screen.getByLabelText("Interface Style");
  const scope = screen.getByLabelText("Edit Scope");
  const shell = screen.getByRole("main").parentElement;

  expect(style).toHaveClass("min-w-0", "max-sm:w-full");
  expect(scope).toHaveClass("min-w-0", "max-sm:w-full");
  expect(shell).toHaveClass(
    "min-h-0",
    "overflow-hidden",
    "max-sm:grid-rows-[minmax(0,55fr)_minmax(0,45fr)]",
  );
});
