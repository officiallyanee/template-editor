import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../../app/App";
import { AppProviders } from "../../app/AppProviders";

beforeEach(() => localStorage.clear());

it("switches prompt text when clicking action and negation prompt chips", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "AI" }));
  const textarea = screen.getByLabelText(
    "AI Instruction",
  ) as HTMLTextAreaElement;
  expect(textarea.value).toBe("Make it more prominent");

  await user.click(screen.getByRole("button", { name: "Make it bigger" }));
  expect(textarea.value).toBe("Make it bigger");

  await user.click(screen.getByTitle("Opposite: Make it smaller"));
  expect(textarea.value).toBe("Make it smaller");
});

it("configures color change prompt using inline color builder", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  const cta = screen.getByTestId("element-cta");
  cta.focus();
  await user.keyboard("{Enter}");

  await user.click(screen.getByRole("tab", { name: "AI" }));
  await user.click(screen.getByTitle("Open color change prompt builder"));

  expect(
    screen.getByRole("group", { name: "Color field" }),
  ).toBeInTheDocument();
  const targetColor = screen.getByLabelText("Target color");
  expect(targetColor.parentElement?.parentElement).toHaveClass(
    "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    "overflow-hidden",
  );
  expect(targetColor).toHaveClass("size-10", "max-w-full", "p-0");
  await user.click(screen.getByRole("button", { name: "Background color" }));
  await user.click(screen.getByRole("button", { name: "Text color" }));

  fireEvent.change(targetColor, { target: { value: "#336699" } });

  await user.click(screen.getByRole("button", { name: "Use this prompt" }));
  const textarea = screen.getByLabelText(
    "AI Instruction",
  ) as HTMLTextAreaElement;
  expect(textarea.value).toContain("#336699");
});

it("displays an error when AI Demo runs with unknown instruction", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );

  await user.click(screen.getByRole("tab", { name: "AI" }));
  const textarea = screen.getByLabelText(
    "AI Instruction",
  ) as HTMLTextAreaElement;
  fireEvent.change(textarea, {
    target: { value: "unrecognized instruction xyz" },
  });

  await user.click(screen.getByRole("button", { name: "Run AI Demo" }));
  expect(screen.getByRole("alert")).toBeInTheDocument();
});
