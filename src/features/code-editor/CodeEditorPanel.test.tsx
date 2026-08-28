import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../../app/App";
import { AppProviders } from "../../app/AppProviders";
import { CodeEditorPanel } from "./CodeEditorPanel";

beforeEach(() => localStorage.clear());

it("shows a prompt when no element is selected", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const headline = screen.getByTestId("element-headline");
  headline.focus();
  await user.keyboard("{Shift>}{Enter}{/Shift}");

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(
    screen.getByText("Select one element to edit its JSON."),
  ).toBeInTheDocument();
});

it("shows element JSON in the textarea and header label", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getAllByText("Hero heading").length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/Resolved desktop properties/i)).toBeInTheDocument();

  const textarea = screen.getByLabelText("Element JSON") as HTMLTextAreaElement;
  const parsed = JSON.parse(textarea.value);
  expect(parsed.fontSize).toBe(54);
});

it("applies valid JSON changes when Apply JSON is clicked", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "Code" }));
  const textarea = screen.getByLabelText("Element JSON") as HTMLTextAreaElement;
  const current = JSON.parse(textarea.value);
  const updated = JSON.stringify({ ...current, fontSize: 64 }, null, 2);

  fireEvent.change(textarea, { target: { value: updated } });
  await user.click(screen.getByRole("button", { name: "Apply JSON" }));

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText("Autosaved · v2")).toBeInTheDocument();
});

it("shows an error alert for malformed JSON", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "Code" }));
  const textarea = screen.getByLabelText("Element JSON") as HTMLTextAreaElement;

  fireEvent.change(textarea, { target: { value: "{ broken json" } });
  await user.click(screen.getByRole("button", { name: "Apply JSON" }));

  const alert = screen.getByRole("alert");
  expect(alert).toBeInTheDocument();
  expect(alert.textContent).toContain("valid JSON");
});

it("shows an error alert for schema-invalid field values", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "Code" }));
  const textarea = screen.getByLabelText("Element JSON") as HTMLTextAreaElement;
  const current = JSON.parse(textarea.value);
  const invalid = JSON.stringify({ ...current, fontSize: 5 }, null, 2);

  fireEvent.change(textarea, { target: { value: invalid } });
  await user.click(screen.getByRole("button", { name: "Apply JSON" }));

  const alert = screen.getByRole("alert");
  expect(alert).toBeInTheDocument();
});

it("shows multi-selection indicator when multiple elements are selected", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const intro = screen.getByTestId("element-intro");
  intro.focus();
  await user.keyboard("{Shift>}{Enter}{/Shift}");

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByText(/active of 2 selected/i)).toBeInTheDocument();
});
