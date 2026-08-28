import { describe, expect, it } from "vitest";
import {
  allProposals,
  findProposal,
  settleAcceptedGroups,
} from "./proposalStore";
import type { StrategyGroup } from "./types";

describe("proposalStore", () => {
  const groups: StrategyGroup[] = [
    {
      strategyId: "strat-1",
      label: "Strategy 1",
      rationale: "Rationale 1",
      outcomes: [],
      proposals: [
        {
          id: "p1",
          selectionSnapshot: ["headline"],
          before: { fontSize: 54 },
          after: { fontSize: 64 },
          status: "pending",
          command: {
            commandId: "cmd-1",
            source: "ai",
            targetIds: ["headline"],
            viewportScope: "all",
            baseRevision: 1,
            changes: { headline: { op: "set", values: { fontSize: 64 } } },
          },
        },
        {
          id: "p2",
          selectionSnapshot: ["cta"],
          before: { width: 140 },
          after: { width: 180 },
          status: "pending",
          command: {
            commandId: "cmd-2",
            source: "ai",
            targetIds: ["cta"],
            viewportScope: "all",
            baseRevision: 1,
            changes: { cta: { op: "set", values: { width: 180 } } },
          },
        },
      ],
    },
  ];

  it("allProposals flattens all proposals from strategy groups", () => {
    const list = allProposals(groups);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("p1");
    expect(list[1].id).toBe("p2");
  });

  it("findProposal finds proposal by id or returns undefined for null/missing", () => {
    expect(findProposal(groups, "p1")?.id).toBe("p1");
    expect(findProposal(groups, "missing")).toBeUndefined();
    expect(findProposal(groups, null)).toBeUndefined();
  });

  it("settleAcceptedGroups updates accepted item, marks overlapping targets invalid, and bumps baseRevision for non-overlapping", () => {
    const settled = settleAcceptedGroups(groups, "p1", 2, ["headline"]);
    const p1 = settled[0].proposals[0];
    const p2 = settled[0].proposals[1];

    expect(p1.status).toBe("accepted");
    expect(p2.status).toBe("pending");
    expect(p2.command.baseRevision).toBe(2);

    const overlappingGroups: StrategyGroup[] = [
      {
        strategyId: "strat-2",
        label: "Strategy 2",
        rationale: "Rationale 2",
        outcomes: [],
        proposals: [
          {
            ...groups[0].proposals[0],
            id: "p3",
          },
        ],
      },
    ];
    const settledOverlapping = settleAcceptedGroups(
      overlappingGroups,
      "other-id",
      2,
      ["headline"],
    );
    expect(settledOverlapping[0].proposals[0].status).toBe("invalid");
    expect(settledOverlapping[0].proposals[0].error).toContain(
      "another strategy was accepted",
    );
  });
});
