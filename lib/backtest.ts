import { INITIAL_ASSETS, STRATEGIES } from "../data/fixtures";
import type { AssetId } from "../types";

export interface ScenarioConfig {
  strategyId: string;
  assetId: AssetId;
  startDate: string;
  endDate: string;
  capital: number;
  feePct: number;
  slippagePct: number;
  parameters: Record<string, number>;
}

export interface ScenarioTrade {
  id: string;
  date: string;
  entry: number;
  exit: number;
  notional: number;
  grossPnl: number;
  costs: number;
  pnl: number;
  equity: number;
}

export interface ScenarioResult {
  config: ScenarioConfig;
  trades: ScenarioTrade[];
  equity: { label: string; value: number }[];
  drawdown: { label: string; value: number }[];
  finalEquity: number;
  netPnl: number;
  netReturnPct: number;
  winRate: number;
  profitFactor: number | null;
  averageWin: number;
  averageLoss: number;
  maxDrawdownPct: number;
  totalCosts: number;
}

const day = 86_400_000;
function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function validateScenario(config: ScenarioConfig): string[] {
  const errors: string[] = [];
  const strategy = STRATEGIES.find((item) => item.id === config.strategyId);
  if (!strategy) return ["Choose an available strategy."];
  if (!strategy.assets.includes(config.assetId))
    errors.push("Choose an asset supported by this strategy.");
  if (!validDate(config.startDate) || !validDate(config.endDate))
    errors.push("Enter valid start and end dates.");
  else {
    const days =
      (Date.parse(config.endDate) - Date.parse(config.startDate)) / day;
    if (days < 7 || days > 366)
      errors.push("The scenario window must be between 7 and 366 days.");
  }
  if (
    !Number.isFinite(config.capital) ||
    config.capital < 100 ||
    config.capital > 1_000_000
  )
    errors.push("Starting capital must be between $100 and $1,000,000.");
  if (!Number.isFinite(config.feePct) || config.feePct < 0 || config.feePct > 1)
    errors.push("Fee per side must be between 0% and 1%.");
  if (
    !Number.isFinite(config.slippagePct) ||
    config.slippagePct < 0 ||
    config.slippagePct > 2
  )
    errors.push("Slippage per side must be between 0% and 2%.");
  for (const parameter of strategy.parameters) {
    const value = config.parameters[parameter.name];
    if (
      !Number.isInteger(value) ||
      value < parameter.min ||
      value > parameter.max
    )
      errors.push(
        `${parameter.name} must be an integer between ${parameter.min} and ${parameter.max}.`,
      );
  }
  if (
    config.strategyId === "ema" &&
    config.parameters["Fast EMA"] >= config.parameters["Slow EMA"]
  )
    errors.push("Fast EMA must be smaller than Slow EMA.");
  return errors;
}

/** A sensitivity demonstration using synthetic return fixtures, not historical market execution. */
export function runScenario(config: ScenarioConfig): ScenarioResult {
  const errors = validateScenario(config);
  if (errors.length) throw new Error(errors.join(" "));
  const strategy = STRATEGIES.find((item) => item.id === config.strategyId)!;
  const asset = INITIAL_ASSETS.find((item) => item.id === config.assetId)!;
  const start = Date.parse(config.startDate);
  const duration = Date.parse(config.endDate) - start;
  const parameterScore =
    strategy.parameters.reduce(
      (sum, parameter) =>
        sum +
        (config.parameters[parameter.name] - parameter.min) /
          (parameter.max - parameter.min),
      0,
    ) / strategy.parameters.length;
  const cadence: Record<string, number> = {
    trend: 1.1,
    ema: 0.7,
    rsi: 0.9,
    breakout: 1.8,
    momentum: 2.2,
    multi: 1.4,
  };
  const count = Math.min(
    160,
    Math.max(
      4,
      Math.floor(
        duration / day / (cadence[strategy.id] * (0.7 + parameterScore)),
      ),
    ),
  );
  const scenarioSeed = [
    ...`${config.strategyId}:${config.assetId}:${config.startDate}:${config.endDate}`,
  ].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  const returnFixture = [
    -0.018, 0.026, 0.012, -0.014, 0.035, -0.022, 0.019, 0.028, -0.011, 0.017,
    -0.024, 0.031,
  ];
  const assetVolatility = [1, 1.12, 1.35, 1.4, 1.2, 1.3][
    INITIAL_ASSETS.indexOf(asset)
  ];
  let equity = config.capital;
  let peak = equity;
  let maxDrawdownPct = 0;
  const trades: ScenarioTrade[] = [];
  const equityCurve = [{ label: config.startDate, value: equity }];
  const drawdownCurve = [{ label: config.startDate, value: 0 }];
  for (let index = 0; index < count; index++) {
    const fixture =
      returnFixture[(index + scenarioSeed) % returnFixture.length];
    const grossReturn =
      fixture * assetVolatility * (0.8 + parameterScore * 0.4) +
      Math.sin(index * 1.7 + scenarioSeed) * 0.003;
    const notional = equity * 0.2;
    const entry =
      asset.price *
      (0.93 + Math.sin(index * 0.35 + scenarioSeed) * 0.04 + index * 0.0003);
    const exit = entry * (1 + grossReturn);
    const grossPnl = notional * grossReturn;
    const costs =
      ((notional * (config.feePct + config.slippagePct)) / 100) *
      (2 + grossReturn);
    const pnl = grossPnl - costs;
    equity += pnl;
    peak = Math.max(peak, equity);
    const drawdown = ((peak - equity) / peak) * 100;
    maxDrawdownPct = Math.max(maxDrawdownPct, drawdown);
    const date = new Date(start + duration * ((index + 1) / count))
      .toISOString()
      .slice(0, 10);
    trades.push({
      id: `scenario-trade-${index + 1}`,
      date,
      entry,
      exit,
      notional,
      grossPnl,
      costs,
      pnl,
      equity,
    });
    equityCurve.push({ label: date, value: equity });
    drawdownCurve.push({ label: date, value: -drawdown });
  }
  const wins = trades.filter((trade) => trade.pnl > 0);
  const losses = trades.filter((trade) => trade.pnl < 0);
  const totalWins = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalLosses = -losses.reduce((sum, trade) => sum + trade.pnl, 0);
  return {
    config: structuredClone(config),
    trades,
    equity: equityCurve,
    drawdown: drawdownCurve,
    finalEquity: equity,
    netPnl: equity - config.capital,
    netReturnPct: (equity / config.capital - 1) * 100,
    winRate: (wins.length / count) * 100,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : null,
    averageWin: wins.length ? totalWins / wins.length : 0,
    averageLoss: losses.length ? totalLosses / losses.length : 0,
    maxDrawdownPct,
    totalCosts: trades.reduce((sum, trade) => sum + trade.costs, 0),
  };
}
