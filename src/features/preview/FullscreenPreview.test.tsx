import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../../app/App";
import { AppProviders } from "../../app/AppProviders";

beforeEach(() => localStorage.clear());

it("enters fullscreen preview and exits via Exit Preview button", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("button", { name: /Full Screen/i }));
  expect(
    screen.getByRole("heading", { name: "Full Screen Preview" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Exit Preview/i }));
  expect(
    screen.queryByRole("heading", { name: "Full Screen Preview" }),
  ).not.toBeInTheDocument();
});

it("exits fullscreen preview when Escape key is pressed", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("button", { name: /Full Screen/i }));
  expect(
    screen.getByRole("heading", { name: "Full Screen Preview" }),
  ).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(
    screen.queryByRole("heading", { name: "Full Screen Preview" }),
  ).not.toBeInTheDocument();
});

it("shows proposal preview status subtitle when a proposal is previewed", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "AI" }));
  await user.click(screen.getByRole("button", { name: "Run AI Demo" }));
  await user.click(screen.getAllByRole("button", { name: "Preview on Canvas" })[0]);

  await user.click(screen.getByRole("button", { name: /Full Screen/i }));
  expect(
    screen.getAllByText("Proposal Preview · Not Applied").length,
  ).toBeGreaterThanOrEqual(1);
});
