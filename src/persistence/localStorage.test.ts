import { beforeEach, expect, it } from "vitest";
import type { GlobalCheckpoint } from "../state/globalHistory";
import {
  loadGlobalCheckpoints,
  resetTemplate,
  saveGlobalCheckpoints,
} from "./localStorage";

const checkpoint: GlobalCheckpoint = {
  schemaVersion: 1,
  checkpointId: "checkpoint-3-1000",
  savedAt: 1000,
  reason: "manual",
  fromTemplateVersion: 1,
  toTemplateVersion: 3,
  commandCount: 2,
  entries: [
    {
      elementId: "headline",
      revisionIds: ["revision-2", "revision-3"],
      fields: ["fontSize", "color"],
    },
  ],
};

beforeEach(() => localStorage.clear());

it("round-trips saved checkpoints independently from template autosave", () => {
  saveGlobalCheckpoints([checkpoint]);
  expect(loadGlobalCheckpoints()).toEqual([checkpoint]);
});

it("clears checkpoints with a deliberate template reset", () => {
  saveGlobalCheckpoints([checkpoint]);
  resetTemplate();
  expect(loadGlobalCheckpoints()).toEqual([]);
});
