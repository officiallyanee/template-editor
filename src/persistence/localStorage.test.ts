import { beforeEach, expect, it } from "vitest";
import type { GlobalCheckpoint } from "../state/globalHistory";
import {
  loadActiveTemplateId,
  loadGlobalCheckpoints,
  loadTemplate,
  resetTemplate,
  saveGlobalCheckpoints,
  saveTemplate,
} from "./localStorage";
import { dashboardTemplate } from "../templates/dashboardTemplate";
import { starterTemplate } from "../templates/starterTemplate";

const checkpoint: GlobalCheckpoint = {
  schemaVersion: 2,
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
  templateSnapshot: {
    templateId: "example-studio",
    rootId: "headline",
    elements: {
      headline: {
        id: "headline",
        type: "heading",
        label: "Hero heading",
        parentId: null,
        order: 0,
        base: { text: "Saved heading", fontSize: 54 },
        overrides: {},
      },
    },
  },
};

beforeEach(() => localStorage.clear());

it("round-trips saved checkpoints independently from template autosave", () => {
  saveGlobalCheckpoints("example-studio", [checkpoint]);
  expect(loadGlobalCheckpoints("example-studio")).toEqual([checkpoint]);
});

it("keeps legacy summary saves reviewable after snapshot migration", () => {
  const legacy: GlobalCheckpoint = {
    ...checkpoint,
    schemaVersion: 1,
    templateSnapshot: undefined,
  };
  saveGlobalCheckpoints("example-studio", [legacy]);
  expect(loadGlobalCheckpoints("example-studio")).toEqual([legacy]);
});

it("clears checkpoints with a deliberate template reset", () => {
  saveGlobalCheckpoints("example-studio", [checkpoint]);
  resetTemplate();
  expect(loadGlobalCheckpoints("example-studio")).toEqual([]);
});

it("resets to a selected catalog template and persists that document", () => {
  const reset = resetTemplate(dashboardTemplate);

  expect(reset.templateId).toBe("launch-dashboard");
  expect(
    localStorage.getItem("scoped-template-editor:v2:launch-dashboard"),
  ).toContain('"templateId":"launch-dashboard"');
});

it("keeps template state and checkpoints isolated by template ID", () => {
  const example = structuredClone(starterTemplate);
  example.version = 4;
  example.elements.headline.base.fontSize = 62;
  const dashboard = structuredClone(dashboardTemplate);
  dashboard.version = 2;
  dashboard.elements.headline.base.fontSize = 50;
  const dashboardCheckpoint: GlobalCheckpoint = {
    ...checkpoint,
    checkpointId: "checkpoint-dashboard-2",
    toTemplateVersion: 2,
    templateSnapshot: {
      ...checkpoint.templateSnapshot!,
      templateId: "launch-dashboard",
    },
  };

  saveTemplate(example);
  saveGlobalCheckpoints("example-studio", [checkpoint]);
  saveTemplate(dashboard);
  saveGlobalCheckpoints("launch-dashboard", [dashboardCheckpoint]);

  expect(loadTemplate(starterTemplate).elements.headline.base.fontSize).toBe(
    62,
  );
  expect(loadTemplate(dashboardTemplate).elements.headline.base.fontSize).toBe(
    50,
  );
  expect(loadGlobalCheckpoints("example-studio")).toEqual([checkpoint]);
  expect(loadGlobalCheckpoints("launch-dashboard")).toEqual([
    dashboardCheckpoint,
  ]);
  expect(loadActiveTemplateId()).toBe("launch-dashboard");
});

it("resetting one template leaves the other template document intact", () => {
  const dashboard = structuredClone(dashboardTemplate);
  dashboard.version = 3;
  saveTemplate(dashboard);
  saveTemplate(starterTemplate);

  resetTemplate(starterTemplate);

  expect(loadTemplate(dashboardTemplate).version).toBe(3);
  expect(loadTemplate(starterTemplate).version).toBe(1);
});

it("migrates the legacy single-document store into its template namespace", () => {
  const legacyTemplate = structuredClone(starterTemplate);
  legacyTemplate.version = 3;
  legacyTemplate.elements.headline.base.fontSize = 60;
  localStorage.setItem(
    "scoped-template-editor:v1",
    JSON.stringify(legacyTemplate),
  );
  localStorage.setItem(
    "scoped-template-checkpoints:v1",
    JSON.stringify([checkpoint]),
  );

  expect(loadActiveTemplateId()).toBe("example-studio");
  expect(loadTemplate(starterTemplate).elements.headline.base.fontSize).toBe(
    60,
  );
  expect(loadGlobalCheckpoints("example-studio")).toEqual([checkpoint]);
  expect(
    localStorage.getItem("scoped-template-editor:v2:example-studio"),
  ).toContain('"version":3');
});
