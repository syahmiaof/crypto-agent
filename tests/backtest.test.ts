import { describe, expect, it } from "vitest";
import {
  runScenario,
  validateScenario,
  type ScenarioConfig,
} from "../lib/backtest";

const baseline: ScenarioConfig = {
  strategyId: "trend",
  assetId: "BTC",
  startDate: "2026-09-20",
  endDate: "2026-10-20",
  capital: 10000,
  feePct: 0.1,
  slippagePct: 0.05,
  parameters: { "EMA period": 50 },
};

describe("synthetic scenario engine", () => {
  it("is reproducible and reconciles the full ledger including costs", () => {
    const result = runScenario(baseline);
    expect(result).toEqual(runScenario(baseline));
    expect(result.finalEquity).toBeCloseTo(
      baseline.capital +
        result.trades.reduce((sum, trade) => sum + trade.pnl, 0),
      8,
    );
    expect(result.trades.some((trade) => trade.pnl < 0)).toBe(true);
    expect(result.trades.some((trade) => trade.pnl > 0)).toBe(true);
    expect(
      result.trades.every(
        (trade) => Math.abs(trade.grossPnl - trade.costs - trade.pnl) < 1e-8,
      ),
    ).toBe(true);
    expect(result.drawdown.every((point) => point.value <= 0)).toBe(true);
  });
  it("charges fee and slippage changes without inventing a different gross scenario", () => {
    const free = runScenario({ ...baseline, feePct: 0, slippagePct: 0 });
    const costly = runScenario({ ...baseline, feePct: 0.5, slippagePct: 0.5 });
    expect(costly.finalEquity).toBeLessThan(free.finalEquity);
    expect(costly.totalCosts).toBeGreaterThan(0);
    expect(free.totalCosts).toBe(0);
    expect(costly.trades[0].entry).toBe(free.trades[0].entry);
    expect(costly.trades[0].exit).toBe(free.trades[0].exit);
  });
  it("uses parameters, symbol, dates, and starting capital", () => {
    expect(
      runScenario({ ...baseline, parameters: { "EMA period": 180 } }).trades
        .length,
    ).not.toBe(runScenario(baseline).trades.length);
    expect(runScenario({ ...baseline, assetId: "ETH" }).netReturnPct).not.toBe(
      runScenario(baseline).netReturnPct,
    );
    expect(
      runScenario({ ...baseline, endDate: "2026-10-30" }).trades.length,
    ).toBeGreaterThan(runScenario(baseline).trades.length);
    expect(runScenario({ ...baseline, capital: 20000 }).netPnl).toBeCloseTo(
      runScenario(baseline).netPnl * 2,
      8,
    );
  });
  it("rejects impossible dates, invalid costs, unsupported assets, and crossed EMA periods", () => {
    expect(
      validateScenario({ ...baseline, startDate: "2026-02-30" }).length,
    ).toBeGreaterThan(0);
    expect(
      validateScenario({ ...baseline, endDate: "2026-01-01" }).length,
    ).toBeGreaterThan(0);
    expect(
      validateScenario({ ...baseline, feePct: -0.1 }).length,
    ).toBeGreaterThan(0);
    expect(
      validateScenario({ ...baseline, assetId: "ADA" }).length,
    ).toBeGreaterThan(0);
    expect(
      validateScenario({
        ...baseline,
        strategyId: "ema",
        parameters: { "Fast EMA": 30, "Slow EMA": 20 },
      }).length,
    ).toBeGreaterThan(0);
    expect(() => runScenario({ ...baseline, capital: Number.NaN })).toThrow();
  });
});
