import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";
import { AppProviders } from "./AppProviders";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.style;
  document.head.innerHTML = '<meta name="theme-color" content="#f6f5f4">';
});

it("switches and persists interface styles without changing template state", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const style = screen.getByLabelText("Interface Style");
  expect(style).toHaveValue("scope");
  expect(
    screen.getAllByRole("option", { name: /Scope|Editorial/ }),
  ).toHaveLength(2);

  await user.selectOptions(style, "editorial");
  expect(document.documentElement.dataset.style).toBe("editorial");
  expect(localStorage.getItem("scope-ui-style")).toBe("editorial");
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#ffffff",
  );
  await user.click(
    screen.getByRole("button", { name: "Switch to Dark Theme" }),
  );
  expect(document.documentElement.dataset.style).toBe("editorial");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#111111",
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
  expect(localStorage.getItem("scope-ui-theme")).toBe("dark");
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#17191c",
  );
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
});
