import { test, expect, type Page } from "@playwright/test";
async function openSignal(page: Page) {
  await page.goto("/signals");
  await page
    .getByRole("button", { name: "View BTC signal sig-001", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function approve(page: Page) {
  await page
    .getByRole("button", { name: "Approve Paper Trade", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
}
test("scenario snapshots, LINK assistant routing and drawer focus remain coherent", async ({
  page,
}) => {
  await page.goto("/agents");
  await page.getByLabel("Global asset").selectOption("LINK");
  await page.getByRole("button", { name: /Bearish reversal/ }).click();
  await page.goto("/signals");
  const opener = page.getByRole("button", {
    name: "View LINK signal sig-bearish-1",
    exact: true,
  });
  await opener.click();
  await expect(page.getByRole("dialog")).toContainText("lost ground");
  await expect(page.getByRole("dialog")).toContainText("analysis-bearish-1");
  await page.screenshot({
    path: "artifacts/screenshots/signal-scenario-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await page.goto("/assistant");
  await page
    .getByLabel("Ask about your simulated trading workspace")
    .fill("Explain the latest LINK signal.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".chat-assistant")).toContainText(
    "Bearish fixture",
  );
  await expect(page.locator(".chat-assistant")).toContainText("LINK/USDT");
  await page.screenshot({
    path: "artifacts/screenshots/assistant-linked-response.png",
    fullPage: true,
  });
});
test("command palette, signal filters, watchlist and full reset operate", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/sidebar-collapsed/);
  await page.getByRole("button", { name: "Open command palette" }).click();
  await page
    .getByLabel("Command palette search", { exact: true })
    .fill("Signal Center");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Signal Center" })
    .click();
  await page.getByLabel("Search signals").fill("LINK");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "View LINK signal sig-005" }).click();
  await page
    .getByRole("button", { name: "Add to Watchlist", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "On watchlist" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reject Signal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("Rejected");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Chainlink/ })).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Demo reset");
  await page.goto("/signals");
  await expect(
    page.getByRole("table").getByText("Pending approval", { exact: true }),
  ).toHaveCount(5);
});
test("signal approval updates ledger, dashboard, audit and persistence", async ({
  page,
}) => {
  await openSignal(page);
  await page.getByLabel("Paper order size (USDT)").fill("1000");
  await approve(page);
  await expect(page.getByRole("status")).toContainText(/filled|executed/i);
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await page.goto("/portfolio");
  await expect(
    page.getByRole("button", { name: "Close position" }),
  ).toHaveCount(1);
  await expect(page.getByText("9,000.00", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Close position" }),
  ).toHaveCount(1);
  await page.goto("/dashboard");
  await expect(page.getByText("16.7%").first()).toHaveCount(0);
  await expect(page.getByText("10.0% exposure / 60% limit")).toBeVisible();
  await page.goto("/activity");
  await expect(page.getByText(/Paper order filled/).first()).toBeVisible();
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "Close position" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Close position" }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Trade History" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("risk threshold blocks signal and logs reason", async ({ page }) => {
  await page.goto("/risk");
  await page
    .getByRole("spinbutton", { name: /Maximum position size/ })
    .fill("1");
  await page.getByRole("button", { name: /Save risk/ }).click();
  await openSignal(page);
  await approve(page);
  await expect(page.getByRole("status")).toContainText(/position|exposure/i);
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await expect(
    page.getByRole("table").getByText("Blocked by Risk Rules", { exact: true }),
  ).toBeVisible();
  await page.goto("/portfolio");
  await expect(
    page.getByRole("button", { name: "Close position" }),
  ).toHaveCount(0);
  await page.goto("/activity");
  await expect(
    page.getByRole("heading", { name: "Paper order blocked", exact: true }),
  ).toBeVisible();
});
test("emergency stop globally blocks orders and explicit release restores flow", async ({
  page,
}) => {
  await page.goto("/risk");
  await page.getByRole("button", { name: /Activate emergency stop/ }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".environment-bar")).toContainText(
    "EMERGENCY STOP",
  );
  await openSignal(page);
  await approve(page);
  await expect(page.getByRole("status")).toContainText(/emergency/i);
  await page.goto("/risk");
  await page.getByRole("button", { name: /Release emergency stop/ }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await openSignal(page);
  await approve(page);
  await expect(page.getByRole("status")).toContainText(/filled|executed/i);
});
test("agent pause updates dashboard and scenario creates audit record", async ({
  page,
}) => {
  await page.goto("/agents");
  await page
    .getByRole("button", { name: "View Technical Analyst details" })
    .click();
  await page.getByRole("button", { name: /Pause/ }).click();
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await page.goto("/dashboard");
  await expect(
    page.locator(".metric").filter({ hasText: "Active AI agents" }),
  ).toContainText("4");
  await page.goto("/agents");
  await page.getByRole("button", { name: /Bullish breakout/ }).click();
  await expect(page.getByText("Current: bullish")).toBeVisible();
  await page.goto("/activity");
  await expect(
    page.getByText("bullish analysis scenario completed"),
  ).toBeVisible();
});
test("market asset, timeframe, overlays and linked signal work", async ({
  page,
}) => {
  await page.goto("/markets");
  await page.getByLabel("Terminal asset").selectOption("ETH");
  await page.getByRole("button", { name: "4H", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "4H", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "EMA", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "EMA", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Line chart", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Line chart", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("link", { name: "View buy signal", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("ETH/USDT");
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Market Terminal", exact: true }),
  ).toBeVisible();
});
test("strategy input validation and demo run, assistant and preferences", async ({
  page,
}) => {
  await page.goto("/strategies");
  await page.getByLabel("Starting capital (USDT)").fill("0");
  await page.getByRole("button", { name: "Run demo backtest" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Starting capital",
  );
  await page.getByLabel("Starting capital (USDT)").fill("10000");
  await page.getByRole("button", { name: "Run demo backtest" }).click();
  await expect(
    page.getByRole("heading", { name: "Synthetic trade ledger" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).not.toHaveCount(0);
  await page.goto("/assistant");
  await page
    .getByRole("button", { name: "Explain the latest BTC signal." })
    .click();
  await expect(page.locator(".chat-assistant")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".chat-assistant")).toHaveCount(1);
  await page.goto("/settings");
  await page.getByLabel("Interface density").selectOption("compact");
  await expect(page.locator(".app-shell")).toHaveClass(/density-compact/);
  await page.getByLabel("Default asset", { exact: true }).selectOption("SOL");
  await page.goto("/markets");
  await expect(page.getByLabel("Terminal asset")).toHaveValue("SOL");
});
test("queued orders reserve cash and can cancel", async ({ page }) => {
  await openSignal(page);
  await page.getByLabel("Simulated fill model").selectOption("limit");
  await approve(page);
  await page.goto("/portfolio");
  await page.getByRole("tab", { name: /Open Paper Orders/ }).click();
  await expect(
    page.getByRole("button", { name: "Simulate fill" }),
  ).toBeVisible();
  await expect(page.getByText("9,500.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No open paper orders" }),
  ).toBeVisible();
  await expect(
    page.getByText("10,000.00", { exact: true }).first(),
  ).toBeVisible();
});
test("mobile navigation, signal drawer and keyboard dialog escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Signal Center" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Signal Center", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View BTC signal sig-001" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
