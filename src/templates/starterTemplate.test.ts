import { expect, it } from "vitest";
import { contrastRatio, meetsContrast } from "../features/ai-demo/contrast";
import { starterTemplate } from "./starterTemplate";

it("starts with an accessible two-blue hierarchy on the pink Page", () => {
  const background = starterTemplate.elements.page.base.backgroundColor;
  const eyebrow = starterTemplate.elements.eyebrow.base.color;
  const headline = starterTemplate.elements.headline.base.color;

  expect(background).toBe("#ffe5e5");
  expect(starterTemplate.templateId).toBe("example-studio");
  expect(starterTemplate.elements.eyebrow.base.text).toBe("EXAMPLE STUDIO");
  expect(eyebrow).toBe("#0067b9");
  expect(headline).toBe("#005bab");
  expect(meetsContrast(contrastRatio(eyebrow!, background!), 4.5)).toBe(true);
  expect(meetsContrast(contrastRatio(headline!, background!), 3)).toBe(true);
});
