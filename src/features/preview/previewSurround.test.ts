import { expect, it } from "vitest";
import { choosePreviewSurround } from "./previewSurround";

const palette = { light: "#f4f2ed", dark: "#27292c" };

it("chooses the higher-contrast surround deterministically", () => {
  expect(choosePreviewSurround("#ffffff", palette).color).toBe("#27292c");
  expect(choosePreviewSurround("#000000", palette).color).toBe("#f4f2ed");
  expect(choosePreviewSurround("#ffe5e5", palette)).toEqual(
    choosePreviewSurround("#ffe5e5", palette),
  );
});
