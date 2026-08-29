import { expect, test, type Page } from "@playwright/test";

const viewportMatrix = [
  { width: 1440, height: 900, rootFontSize: "14px" },
  { width: 1280, height: 800, rootFontSize: "14px" },
  { width: 1024, height: 768, rootFontSize: "14px" },
  { width: 768, height: 900, rootFontSize: "14px" },
  { width: 390, height: 844, rootFontSize: "12px" },
  { width: 375, height: 667, rootFontSize: "12px" },
  { width: 320, height: 568, rootFontSize: "12px" },
] as const;

function watchConsole(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error")
      failures.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  return failures;
}

async function openApp(page: Page) {
  const failures = watchConsole(page);
  await page.goto("/");
  return failures;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("starts light with presentation frames off and renders each hardware variant", async ({
  page,
}) => {
  const failures = await openApp(page);
  const shell = page.locator(".device-frame-shell").first();

  const typography = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing typography target: ${selector}`);
      const computed = getComputedStyle(element);
      return {
        family: computed.fontFamily,
        weight: computed.fontWeight,
      };
    };
    return {
      body: style("body"),
      editorHeading: style("#layer-list-heading h2"),
      previewHeading: style('[data-testid="element-headline"]'),
      previewBody: style('[data-testid="element-intro"]'),
    };
  });
  expect(typography.body.family).toContain("Inter");
  expect(typography.editorHeading.family).toContain("Playfair Display");
  expect(typography.editorHeading.weight).toBe("400");
  expect(
    await page
      .locator("#layer-list-heading h2")
      .evaluate((element) => getComputedStyle(element).fontSize),
  ).toBe("20px");
  expect(typography.previewHeading.family).toContain("Playfair Display");
  expect(typography.previewBody.family).toContain("Lora");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(shell).toHaveAttribute("data-device-frame", "off");
  await expect(page.locator("[data-device-hardware]")).toHaveCount(0);

  await page.getByRole("button", { name: "Show Device Frame" }).click();
  await expect(shell.locator('[data-device-hardware="desktop"]')).toBeVisible();
  await expect(shell.locator(".device-frame-laptop-base")).toBeVisible();

  await page.getByRole("button", { name: "Tablet" }).click();
  await expect(shell.locator('[data-device-hardware="tablet"]')).toBeVisible();
  await expect(shell.locator(".device-frame-camera")).toBeVisible();

  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(shell.locator('[data-device-hardware="mobile"]')).toBeVisible();
  await expect(shell.locator(".device-frame-speaker")).toBeVisible();
  await expect(shell.locator(".device-frame-button-start")).toBeVisible();
  await expect(page.getByText("Version saved · v1")).toBeVisible();

  const lightFrameColor = await shell
    .locator(".device-frame-hardware")
    .evaluate((element) => getComputedStyle(element).borderColor);
  await page.getByRole("button", { name: "Switch to Dark Theme" }).click();
  const darkFrameColor = await shell
    .locator(".device-frame-hardware")
    .evaluate((element) => getComputedStyle(element).borderColor);
  expect(darkFrameColor).not.toBe(lightFrameColor);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(failures).toEqual([]);
});

test("keeps the editor bounded across the submission viewport matrix", async ({
  page,
}) => {
  const failures = await openApp(page);

  for (const viewport of viewportMatrix) {
    await page.setViewportSize(viewport);
    const measurements = await page.evaluate(() => ({
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      rootOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
    }));
    expect(measurements).toEqual({
      rootFontSize: viewport.rootFontSize,
      rootOverflow: 0,
      bodyOverflow: 0,
    });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const rails = await page
    .locator("#editor-shell > *")
    .evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().width)),
    );
  expect(rails).toHaveLength(3);
  expect(rails[0]).toBeGreaterThanOrEqual(210);
  expect(rails[0]).toBeLessThanOrEqual(240);
  expect(rails[2]).toBeGreaterThanOrEqual(320);
  expect(rails[2]).toBeLessThanOrEqual(360);
  expect(failures).toEqual([]);
});

test("centers all full-screen previews at the exact logical widths", async ({
  page,
}) => {
  const failures = await openApp(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Full Screen Preview" }).click();
  const dialog = page.getByRole("dialog", { name: "Full Screen Preview" });

  for (const [label, width, height] of [
    ["Desktop", 920, 650],
    ["Tablet", 768, 720],
    ["Mobile", 375, 667],
  ] as const) {
    await dialog.getByRole("button", { name: label }).click();
    const frame = page.locator("dialog .device-frame-shell");
    const canvas = page.getByLabel("Template preview canvas");
    await expect(frame).toHaveCSS("max-width", `${width}px`);
    await expect(frame).toHaveCSS("height", `${height}px`);
    await expect(canvas).toHaveCSS("height", `${height}px`);
    const position = await frame.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        centerDelta: Math.round(
          Math.abs(rect.left - (window.innerWidth - rect.right)),
        ),
        transitionProperty: getComputedStyle(element).transitionProperty,
      };
    });
    expect(position.width).toBe(width);
    expect(position.centerDelta).toBeLessThanOrEqual(1);
    expect(position.transitionProperty).toContain("max-width");
  }

  await page.getByRole("button", { name: "Exit Preview" }).click();
  await expect(
    page.getByRole("button", { name: "Full Screen Preview" }),
  ).toBeFocused();
  expect(failures).toEqual([]);
});

test("locks scoped previews and contains wide-panel color controls", async ({
  page,
}) => {
  const failures = await openApp(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.getByLabel("Edit Scope").selectOption("mobile");
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Desktop" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tablet" })).toBeDisabled();
  await expect(page.locator(".device-frame-shell").first()).toHaveCSS(
    "max-width",
    "375px",
  );

  await page.getByLabel("Edit Scope").selectOption("all");
  await page.getByRole("button", { name: "Desktop" }).click();
  const input = page.locator('input[name="text-color"]');
  const panel = page.getByRole("complementary", { name: "Editing tools" });
  const containment = await Promise.all(
    [input, panel].map((locator) =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      }),
    ),
  );
  expect(containment[0].left).toBeGreaterThanOrEqual(containment[1].left);
  expect(containment[0].right).toBeLessThanOrEqual(containment[1].right);
  expect(failures).toEqual([]);
});

test("keeps the device frame fixed and scrolls growing page content inside it", async ({
  page,
}) => {
  const failures = await openApp(page);
  await page.getByRole("option", { name: /Page container/i }).click();
  await page.getByRole("button", { name: "Mobile" }).click();
  await page.setViewportSize({ width: 390, height: 844 });

  const frame = page.locator(".device-frame-shell").first();
  const canvas = page.getByLabel("Editable template canvas");
  const heightBefore = await frame.evaluate((element) => element.clientHeight);

  for (let index = 0; index < 24; index += 1)
    await page
      .getByRole("button", { name: "Increase container padding" })
      .click();

  const heightAfter = await frame.evaluate((element) => element.clientHeight);
  const metrics = await canvas.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(heightBefore).toBe(667);
  expect(heightAfter).toBe(heightBefore);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.overflowY).toBe("auto");
  await canvas.evaluate((element) => element.scrollTo({ top: 100 }));
  expect(await canvas.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  expect(failures).toEqual([]);
});

test("keeps saved preview geometry stable and restores a stretched template edit", async ({
  page,
}) => {
  const failures = await openApp(page);
  await page.getByRole("button", { name: "Increase text size" }).click();
  await page.getByRole("tab", { name: "Saves" }).click();
  await page.getByRole("button", { name: "Save Current Version" }).click();
  await page.getByRole("tab", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Increase text size" }).click();
  await page.getByRole("tab", { name: "Saves" }).click();
  await page.getByRole("button", { name: "Preview Restore" }).click();

  const savedCanvas = page.getByLabel("Template preview canvas");
  await expect(savedCanvas).toHaveCSS("height", "650px");
  await expect(savedCanvas.locator('[data-type="heading"]')).toHaveCSS(
    "font-size",
    "56px",
  );
  await page
    .getByRole("button", { name: "Cancel saved version preview" })
    .click();

  await page.getByRole("tab", { name: "Edit" }).click();
  await page.getByLabel("Position in Container").selectOption("stretch");
  const heading = page.getByTestId("element-headline");
  await expect(heading).toHaveCSS("align-self", "stretch");
  await expect(heading).toHaveCSS("max-width", "none");

  await page
    .getByLabel("Template", { exact: true })
    .selectOption("launch-dashboard");
  await page
    .getByLabel("Template", { exact: true })
    .selectOption("example-studio");
  await expect(page.getByLabel("Position in Container")).toHaveValue("stretch");
  expect(failures).toEqual([]);
});
