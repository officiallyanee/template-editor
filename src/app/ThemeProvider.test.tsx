import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";
import { AppProviders } from "./AppProviders";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '<meta name="theme-color" content="#f6f5f4">';
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
  expect(localStorage.getItem("scope-ui-theme")).toBe("dark");
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#121211",
  );
  expect(screen.getByText("Saved · v1")).toBeInTheDocument();
});
