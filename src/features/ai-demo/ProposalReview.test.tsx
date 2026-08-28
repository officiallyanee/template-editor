import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../../app/App";
import { AppProviders } from "../../app/AppProviders";
import { runDemo } from "./runDemo";
import { settleAcceptedGroups } from "../../state/proposalStore";
import { updateProposalStatus } from "./proposalState";
import { freshState } from "../../test/fixtures";

beforeEach(() => localStorage.clear());

it("changes one proposal status without affecting its sibling", () => {
  const result = runDemo(
    "Make selected items compact",
    ["headline", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  const next = updateProposalStatus(
    result.proposals,
    result.proposals[0].id,
    "accepted",
  );
  expect(next[0].status).toBe("accepted");
  expect(next[1].status).toBe("pending");
});

it("rebases a pending sibling while invalidating alternatives for the changed element", () => {
  const result = runDemo(
    "Make it more prominent",
    ["headline", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  const accepted = result.strategyGroups[0].proposals[0];
  const next = settleAcceptedGroups(
    result.strategyGroups,
    accepted.id,
    2,
    accepted.command.targetIds,
  );
  const proposals = next.flatMap((group) => group.proposals);
  expect(proposals.find((item) => item.id === accepted.id)?.status).toBe(
    "accepted",
  );
  expect(
    proposals.find(
      (item) =>
        item.status === "pending" && item.command.targetIds.includes("intro"),
    )?.command.baseRevision,
  ).toBe(2);
  expect(
    proposals.find(
      (item) =>
        item.status === "invalid" &&
        item.command.targetIds.includes("headline"),
    ),
  ).toBeDefined();
});
it("makes proposal acceptance keyboard operable", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("tab", { name: "AI" }));
  await user.click(screen.getByRole("button", { name: /Run AI Demo/i }));
  const accept = screen.getByRole("button", { name: /Accept Change/i });
  accept.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByText("accepted")).toBeInTheDocument();
});

it("previews a pending proposal without committing it", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  const heading = screen.getByTestId("element-headline");

  expect(heading).toHaveStyle({ fontSize: "54px" });
  await user.click(screen.getByRole("tab", { name: "AI" }));
  await user.click(screen.getByRole("button", { name: /Run AI Demo/i }));
  await user.click(screen.getByRole("radio", { name: /Scale & Space/i }));
  await user.click(screen.getByRole("button", { name: "Preview on Canvas" }));

  expect(heading).toHaveStyle({ fontSize: "60px" });
  expect(screen.getByText("Version saved · v1")).toBeInTheDocument();
  expect(screen.getByText("pending")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Stop Preview" }));
  expect(heading).toHaveStyle({ fontSize: "54px" });
});

it("switches strategy choices with native keyboard controls", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("tab", { name: "AI" }));
  await user.click(screen.getByRole("button", { name: /Run AI Demo/i }));
  const typography = screen.getByRole("radio", {
    name: /Typography Hierarchy/i,
  });
  typography.focus();
  await user.keyboard("{ArrowDown}");
  expect(
    screen.getByRole("radio", { name: /Accessible Contrast/i }),
  ).toBeChecked();
  expect(
    screen.getByText(/already matches this strategy/i),
  ).toBeInTheDocument();
});

it("warns without blocking an explicit low-contrast color request", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.click(screen.getByRole("tab", { name: "AI" }));
  const instruction = screen.getByRole("textbox", { name: "AI Instruction" });
  await user.clear(instruction);
  await user.type(instruction, "Change text color from #005bab to #ffffff");
  await user.click(screen.getByRole("button", { name: /Run AI Demo/i }));
  expect(screen.getByText(/Below WCAG threshold/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Accept Change" })).toBeEnabled();
});

it("shows unsupported members without hiding valid mixed-selection proposals", async () => {
  const user = userEvent.setup();
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  await user.keyboard("{Shift>}");
  await user.click(
    screen.getByRole("option", { name: /Primary action button/i }),
  );
  await user.click(
    screen.getByRole("option", { name: /Services grid container/i }),
  );
  await user.keyboard("{/Shift}");
  await user.click(screen.getByRole("tab", { name: "AI" }));
  const instruction = screen.getByRole("textbox", { name: "AI Instruction" });
  await user.clear(instruction);
  await user.type(instruction, "Make it bigger");
  await user.click(screen.getByRole("button", { name: /Run AI Demo/i }));
  expect(screen.getAllByText("Primary action")).not.toHaveLength(0);
  expect(screen.getAllByText("Services grid")).not.toHaveLength(0);
  expect(screen.getAllByText(/does not support this strategy/i)).toHaveLength(
    2,
  );
});
