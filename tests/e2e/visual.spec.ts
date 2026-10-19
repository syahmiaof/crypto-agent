import { test, expect } from "@playwright/test";
const routes = [
  "dashboard",
  "markets",
  "agents",
  "signals",
  "portfolio",
  "strategies",
  "risk",
  "assistant",
  "activity",
  "settings",
];
test("all routes render without runtime errors at desktop and mobile", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of routes) {
      await page.goto("/" + route);
      await expect(page.locator("main h1")).toBeVisible();
      if (route === "dashboard" || route === "markets")
        await expect(
          page.locator(".market-chart canvas").first(),
        ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.locator("main").screenshot({
        path: `artifacts/screenshots/${route}-${width}.png`,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflow at ${width}`,
      ).toBe(true);
      const clippedMetrics = await page
        .locator(".metric-value")
        .evaluateAll(
          (elements) =>
            elements.filter(
              (element) => element.scrollWidth > element.clientWidth + 1,
            ).length,
        );
      expect(clippedMetrics, `${route} clipped KPI at ${width}`).toBe(0);
    }
  }
  expect(errors).toEqual([]);
});
test("dashboard at all six target viewports", async ({ page }) => {
  test.setTimeout(120000);
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/dashboard");
    await expect(page.locator(".market-chart canvas").first()).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/dashboard-${width}x${height}.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
