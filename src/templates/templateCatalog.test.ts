import { expect, it } from "vitest";
import { contrastRatio, meetsContrast } from "../features/ai-demo/contrast";
import { resolved } from "../state/resolver";
import { TEMPLATE_OPTIONS, freshTemplate } from "./templateCatalog";

it("registers unique, structurally complete template documents", () => {
  expect(new Set(TEMPLATE_OPTIONS.map((option) => option.id)).size).toBe(
    TEMPLATE_OPTIONS.length,
  );

  for (const option of TEMPLATE_OPTIONS) {
    const template = freshTemplate(option.id);
    expect(template.elements[template.rootId]?.parentId).toBeNull();
    for (const element of Object.values(template.elements)) {
      if (element.parentId)
        expect(template.elements[element.parentId]).toBeDefined();
      expect(element.history).toEqual([]);
    }
  }
});

it("uses the dashboard fixture to exercise responsive layout and sizing", () => {
  const template = freshTemplate("launch-dashboard");
  const statusRow = template.elements.services;
  const action = template.elements.cta;

  expect(resolved(statusRow, "desktop").direction).toBe("row");
  expect(resolved(statusRow, "mobile").direction).toBe("column");
  expect(resolved(action, "desktop").alignSelf).toBe("start");
  expect(resolved(action, "mobile").alignSelf).toBe("center");
  expect(resolved(action, "desktop").width).not.toBe(
    resolved(action, "mobile").width,
  );
});

it("keeps dashboard text and actions above WCAG contrast thresholds", () => {
  const template = freshTemplate("launch-dashboard");
  const pageBackground = template.elements.page.base.backgroundColor!;
  const headingColor = template.elements.headline.base.color!;
  const action = template.elements.cta.base;

  expect(meetsContrast(contrastRatio(headingColor, pageBackground), 3)).toBe(
    true,
  );
  expect(
    meetsContrast(contrastRatio(action.color!, action.backgroundColor!), 4.5),
  ).toBe(true);
});
