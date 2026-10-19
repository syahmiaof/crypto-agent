import { ASSET_IDS } from "../data/fixtures";
import type { ActionResult, DemoState, RiskLimits, Signal } from "../types";
import { calculatePortfolio, riskReward } from "./finance";
export function validateRiskLimits(risk: RiskLimits): ActionResult {
  for (const key of [
    "maxPositionPct",
    "maxExposurePct",
    "maxDailyLossPct",
    "maxDrawdownPct",
  ] as const)
    if (!Number.isFinite(risk[key]) || risk[key] <= 0 || risk[key] > 100)
      return {
        ok: false,
        message: `${key} must be greater than 0 and at most 100.`,
      };
  if (risk.maxPositionPct > risk.maxExposurePct)
    return {
      ok: false,
      message: "Position limit cannot exceed total exposure limit.",
    };
  if (
    !Number.isInteger(risk.maxPositions) ||
    risk.maxPositions < 1 ||
    risk.maxPositions > 20
  )
    return {
      ok: false,
      message: "Maximum positions must be an integer from 1 to 20.",
    };
  if (
    !Number.isFinite(risk.minRiskReward) ||
    risk.minRiskReward < 0.1 ||
    risk.minRiskReward > 20
  )
    return {
      ok: false,
      message: "Minimum risk/reward must be between 0.1 and 20.",
    };
  if (
    !Number.isInteger(risk.cooldownSeconds) ||
    risk.cooldownSeconds < 0 ||
    risk.cooldownSeconds > 86400
  )
    return {
      ok: false,
      message: "Cooldown must be 0–86400 whole simulation seconds.",
    };
  if (
    !Array.isArray(risk.allowlist) ||
    !risk.allowlist.length ||
    risk.allowlist.some((asset) => !ASSET_IDS.includes(asset))
  )
    return { ok: false, message: "Allow at least one supported asset." };
  return { ok: true, message: "Risk limits saved." };
}
export function validateTrade(
  state: DemoState,
  signal: Signal,
  notional: number,
  excludeOrderId?: string,
): ActionResult {
  const fail = (message: string) => ({ ok: false, message });
  if (state.emergencyStop)
    return fail(
      "Emergency stop is active. Release it in Risk Control before trading.",
    );
  if (!Number.isFinite(notional) || notional <= 0)
    return fail("Enter a finite paper order amount greater than zero.");
  if (signal.direction !== "BUY")
    return fail(
      signal.direction === "SELL"
        ? "Short selling is disabled. Close an existing long position from Portfolio."
        : "HOLD signals cannot create paper orders.",
    );
  if (!state.risk.allowlist.includes(signal.assetId))
    return fail(`${signal.assetId} is not in the risk allowlist.`);
  const asset = state.assets.find((item) => item.id === signal.assetId);
  if (
    !asset ||
    !Number.isFinite(asset.price) ||
    asset.price <= signal.stopLoss ||
    asset.price >= signal.takeProfit
  )
    return fail(
      "Current mark is outside the signal entry plan. Run a fresh analysis.",
    );
  if (
    ![signal.stopLoss, signal.takeProfit, signal.entry].every(
      Number.isFinite,
    ) ||
    signal.stopLoss <= 0 ||
    signal.stopLoss >= signal.entry ||
    signal.takeProfit <= signal.entry
  )
    return fail("The signal has an invalid protective price plan.");
  if (
    riskReward({ ...signal, entry: asset.price }) + 1e-9 <
    state.risk.minRiskReward
  )
    return fail(
      `Risk/reward is below the ${state.risk.minRiskReward}:1 minimum at the current mark.`,
    );
  const portfolio = calculatePortfolio(state);
  const pending = state.orders.filter(
    (order) => order.status === "open" && order.id !== excludeOrderId,
  );
  const reserved = pending.reduce((sum, order) => sum + order.notional, 0);
  if (notional > state.cash - reserved + 1e-8)
    return fail(
      "Insufficient available paper cash; open orders reserve capital.",
    );
  const existingAssetValue =
    state.positions
      .filter((position) => position.assetId === signal.assetId)
      .reduce((sum, position) => sum + position.quantity * asset.price, 0) +
    pending
      .filter((order) => order.assetId === signal.assetId)
      .reduce((sum, order) => sum + order.notional, 0);
  if (
    ((existingAssetValue + notional) / portfolio.equity) * 100 >
    state.risk.maxPositionPct + 1e-8
  )
    return fail(
      `Position size exceeds the ${state.risk.maxPositionPct}% per-asset limit.`,
    );
  if (
    ((portfolio.positionValue + reserved + notional) / portfolio.equity) * 100 >
    state.risk.maxExposurePct + 1e-8
  )
    return fail(
      `Total exposure exceeds the ${state.risk.maxExposurePct}% limit, including reserved orders.`,
    );
  if (state.positions.length + pending.length >= state.risk.maxPositions)
    return fail(
      `Maximum ${state.risk.maxPositions} concurrent positions/orders reached.`,
    );
  if (portfolio.dailyPnlPct <= -state.risk.maxDailyLossPct)
    return fail("Daily paper loss limit reached. New exposure is blocked.");
  if (portfolio.drawdownPct >= state.risk.maxDrawdownPct)
    return fail("Maximum drawdown limit reached. New exposure is blocked.");
  if (
    state.lastTradeAt &&
    (Date.parse(state.clock) - Date.parse(state.lastTradeAt)) / 1000 <
      state.risk.cooldownSeconds
  )
    return fail(
      `Trade cooldown active. Advance simulation by ${state.risk.cooldownSeconds} seconds after the last fill.`,
    );
  return { ok: true, message: "All deterministic risk checks passed." };
}
