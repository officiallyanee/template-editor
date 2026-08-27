import type { PendingProposal, StrategyGroup } from "./types";

export function allProposals(groups: StrategyGroup[]): PendingProposal[] {
  return groups.flatMap((group) => group.proposals);
}

export function findProposal(
  groups: StrategyGroup[],
  id: string | null,
): PendingProposal | undefined {
  return id
    ? groups.flatMap((group) => group.proposals).find((item) => item.id === id)
    : undefined;
}

export function settleAcceptedGroups(
  groups: StrategyGroup[],
  id: string,
  templateVersion: number,
  targetIds: string[],
): StrategyGroup[] {
  return groups.map((group) => ({
    ...group,
    proposals: group.proposals.map((item) => {
      if (item.id === id) return { ...item, status: "accepted" };
      if (item.status !== "pending") return item;
      const sameTarget = item.command.targetIds.some((target) =>
        targetIds.includes(target),
      );
      return sameTarget
        ? {
            ...item,
            status: "invalid",
            error: "This element changed when another strategy was accepted.",
          }
        : {
            ...item,
            command: { ...item.command, baseRevision: templateVersion },
          };
    }),
  }));
}
