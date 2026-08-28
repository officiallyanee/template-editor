import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../../app/App";
import { AppProviders } from "../../app/AppProviders";

beforeEach(() => localStorage.clear());

it("explains when a revision already matches instead of dispatching a no-op", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  await user.click(screen.getByRole("tab", { name: "History" }));
  await user.click(screen.getAllByRole("button", { name: "Restore" })[0]);

  expect(
    screen.getAllByText("Nothing to restore—current values already match."),
  ).not.toHaveLength(0);
  expect(screen.getAllByRole("button", { name: "Current" })[0]).toBeDisabled();
});

it("allows restoring back to initial baseline after a single edit", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("button", { name: "Increase text size" }));
  await user.click(screen.getByRole("tab", { name: "History" }));

  expect(screen.getByText("Initial version")).toBeInTheDocument();
  const restoreBtn = screen.getByRole("button", { name: "Restore" });
  expect(restoreBtn).not.toBeDisabled();

  await user.click(restoreBtn);

  expect(screen.getByText("Restored revision")).toBeInTheDocument();
});
