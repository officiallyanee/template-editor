import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";
import { AppProviders } from "./AppProviders";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.style;
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
});

it("uses Editorial as the only interface design", () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  expect(screen.queryByLabelText("Interface Style")).not.toBeInTheDocument();
  expect(document.documentElement).not.toHaveAttribute("data-style");
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("scope-ui-style")).toBeNull();
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#ffffff",
  );
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
});

it("toggles and persists the editor theme without changing template state", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(
    screen.getByRole("button", { name: "Switch to Dark Theme" }),
  );
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.style.colorScheme).toBe("dark");
  expect(localStorage.getItem("scope-ui-theme:v2")).toBe("dark");
  expect(localStorage.getItem("scope-ui-theme")).toBeNull();
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#111111",
  );
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
});
