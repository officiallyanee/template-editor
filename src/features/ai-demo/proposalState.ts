import type { PendingProposal } from "../../state/types";
export function updateProposalStatus(
  items: PendingProposal[],
  id: string,
  status: PendingProposal["status"],
): PendingProposal[] {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}
