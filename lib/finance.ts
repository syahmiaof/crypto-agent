import type { DemoState, Signal } from "../types";
export const INITIAL_CAPITAL = 10000;
export function formatMoney(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}
export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
export function riskReward(
  signal: Pick<Signal, "entry" | "stopLoss" | "takeProfit">,
): number {
  const risk = Math.abs(signal.entry - signal.stopLoss);
  return risk > 0 ? Math.abs(signal.takeProfit - signal.entry) / risk : 0;
}
export function calculatePortfolio(state: DemoState) {
  const positionValue = state.positions.reduce(
    (sum, position) =>
      sum +
      position.quantity *
        (state.assets.find((asset) => asset.id === position.assetId)?.price ??
          position.entryPrice),
    0,
  );
  const costBasis = state.positions.reduce(
    (sum, position) => sum + position.quantity * position.entryPrice,
    0,
  );
  const reservedCash = state.orders
    .filter((order) => order.status === "open")
    .reduce((sum, order) => sum + order.notional, 0);
  const equity = state.cash + positionValue;
  const realizedPnl = state.trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const unrealizedPnl = positionValue - costBasis;
  const peak = Math.max(state.peakEquity, equity);
  const maxDrawdownPct = state.equityHistory.reduce(
    (acc, point) => {
      const nextPeak = Math.max(acc.peak, point.equity);
      return {
        peak: nextPeak,
        drawdown: Math.max(
          acc.drawdown,
          ((nextPeak - point.equity) / nextPeak) * 100,
        ),
      };
    },
    { peak: INITIAL_CAPITAL, drawdown: 0 },
  ).drawdown;
  return {
    equity,
    cash: state.cash,
    availableCash: state.cash - reservedCash,
    reservedCash,
    positionValue,
    allocated: costBasis,
    costBasis,
    realizedPnl,
    unrealizedPnl,
    netPnl: equity - INITIAL_CAPITAL,
    netReturn: (equity / INITIAL_CAPITAL - 1) * 100,
    dailyPnl: equity - state.dayStartEquity,
    dailyPnlPct: (equity / state.dayStartEquity - 1) * 100,
    exposurePct:
      equity > 0 ? ((positionValue + reservedCash) / equity) * 100 : 0,
    drawdownPct: peak > 0 ? ((peak - equity) / peak) * 100 : 0,
    maxDrawdownPct: Math.max(
      maxDrawdownPct,
      peak > 0 ? ((peak - equity) / peak) * 100 : 0,
    ),
  };
}
