"use client";
import { useState } from "react";
import { Play, FlaskConical } from "lucide-react";
import { STRATEGIES } from "@/data/fixtures";
import { useDemoStore } from "@/store/demo-store";
import {
  runScenario,
  validateScenario,
  type ScenarioConfig,
  type ScenarioResult,
} from "@/lib/backtest";
import { formatMoney } from "@/lib/finance";
import {
  Badge,
  Button,
  EmptyState,
  Metric,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import { AnalyticsChart } from "@/components/shared/AnalyticsChart";
import type { AssetId } from "@/types";
const defaults = (id: string): ScenarioConfig => {
  const strategy = STRATEGIES.find((s) => s.id === id)!;
  return {
    strategyId: id,
    assetId: strategy.assets[0],
    startDate: "2026-09-01",
    endDate: "2026-10-01",
    capital: 10000,
    feePct: 0.1,
    slippagePct: 0.05,
    parameters: Object.fromEntries(
      strategy.parameters.map((p) => [p.name, p.value]),
    ),
  };
};
export default function StrategiesPage() {
  const [config, setConfig] = useState(defaults("trend")),
    [result, setResult] = useState<ScenarioResult | null>(null),
    [errors, setErrors] = useState<string[]>([]);
  const recordEvent = useDemoStore((s) => s.recordEvent);
  const strategy = STRATEGIES.find((s) => s.id === config.strategyId)!;
  const dirty =
    result && JSON.stringify(config) !== JSON.stringify(result.config);
  function execute() {
    const validation = validateScenario(config);
    setErrors(validation);
    if (validation.length) return;
    const next = runScenario(config);
    setResult(next);
    recordEvent(
      "system",
      `${strategy.name} demonstration completed`,
      `${next.trades.length} synthetic trades; ${next.netReturnPct.toFixed(2)}% simulated return. Not a historical backtest.`,
      strategy.id,
    );
  }
  return (
    <>
      <PageHeader
        title="Strategy Lab"
        description="Test assumptions, inspect trade-offs, and understand the cost of a strategy."
      >
        <Badge tone="info">
          <FlaskConical size={12} />
          Research sandbox
        </Badge>
      </PageHeader>
      <div className="info-box" style={{ marginBottom: 18 }}>
        SIMULATED DEMONSTRATION RESULTS — NOT VERIFIED HISTORICAL PERFORMANCE.
        This sensitivity model applies synthetic return fixtures to your
        parameters, dates and costs. It does not run strategy rules against
        historical candles.
      </div>
      <div className="strategy-layout">
        <Panel title="Strategy library">
          <div className="panel-body strategy-list">
            {STRATEGIES.map((item) => (
              <button
                className={`strategy-item ${item.id === strategy.id ? "active" : ""}`}
                key={item.id}
                onClick={() => {
                  setConfig(defaults(item.id));
                  setErrors([]);
                }}
              >
                <div className="spread">
                  <h3>{item.name}</h3>
                  <Badge>{item.timeframe}</Badge>
                </div>
                <p>{item.description}</p>
              </button>
            ))}
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title={strategy.name}
            action={<Badge>{strategy.assets.join(" · ")}</Badge>}
          >
            <div className="panel-body stack">
              <p className="muted">{strategy.description}</p>
              <div className="two-column">
                <div>
                  <h3>Entry logic</h3>
                  <p className="muted">{strategy.entry}</p>
                </div>
                <div>
                  <h3>Exit logic</h3>
                  <p className="muted">{strategy.exit}</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="field">
                  Symbol
                  <select
                    value={config.assetId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        assetId: e.target.value as AssetId,
                      })
                    }
                  >
                    {strategy.assets.map((id) => (
                      <option key={id} value={id}>
                        {id}/USDT
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Starting capital (USDT)
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    value={config.capital}
                    onChange={(e) =>
                      setConfig({ ...config, capital: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  Start date
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) =>
                      setConfig({ ...config, startDate: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  End date
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={(e) =>
                      setConfig({ ...config, endDate: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  Fee per side (%)
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step=".01"
                    value={config.feePct}
                    onChange={(e) =>
                      setConfig({ ...config, feePct: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  Slippage per side (%)
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step=".01"
                    value={config.slippagePct}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        slippagePct: Number(e.target.value),
                      })
                    }
                  />
                </label>
                {strategy.parameters.map((parameter) => (
                  <label className="field" key={parameter.name}>
                    {parameter.name}
                    <input
                      type="number"
                      min={parameter.min}
                      max={parameter.max}
                      value={config.parameters[parameter.name]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          parameters: {
                            ...config.parameters,
                            [parameter.name]: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <small>
                      Range {parameter.min}–{parameter.max}
                    </small>
                  </label>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 11 }}>
                Model: 20% of current equity per fictional trade; sequential
                trades, no leverage. Parameters alter fixture sensitivity and
                trade cadence. Risk settings govern paper orders separately.
              </p>
              {errors.length > 0 && (
                <div className="message error" role="alert">
                  {errors.join(" ")}
                </div>
              )}
              <div className="spread wrap">
                <span className="muted" style={{ fontSize: 10 }}>
                  Reproducible inputs. Deterministic results.
                </span>
                <Button variant="primary" onClick={execute}>
                  <Play size={13} />
                  Run demo backtest
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      {result ? (
        <div className="stack dashboard-section">
          {dirty && (
            <div className="message" role="status">
              Configuration changed. Results below belong to the previous run;
              run again to update.
            </div>
          )}
          <div className="spread wrap">
            <h2>Demonstration results</h2>
            <Badge>
              {STRATEGIES.find((s) => s.id === result.config.strategyId)?.name}{" "}
              · {result.config.assetId} · {result.config.startDate} →{" "}
              {result.config.endDate}
            </Badge>
          </div>
          <div className="metric-grid" style={{ marginBottom: 0 }}>
            <Metric
              label="Net return"
              value={`${result.netReturnPct.toFixed(2)}%`}
              detail={`${formatMoney(result.netPnl)} USDT after costs`}
              tone={result.netPnl >= 0 ? "positive" : "negative"}
            />
            <Metric
              label="Total trades"
              value={result.trades.length}
              detail="Synthetic sequential trades"
            />
            <Metric
              label="Win rate"
              value={`${result.winRate.toFixed(1)}%`}
              detail="Profitable trades / all trades"
            />
            <Metric
              label="Profit factor"
              value={result.profitFactor?.toFixed(2) ?? "N/A"}
              detail="Gross wins / gross losses"
            />
            <Metric
              label="Max drawdown"
              value={`${result.maxDrawdownPct.toFixed(2)}%`}
              detail="From running equity peak"
            />
            <Metric
              label="Total modeled costs"
              value={formatMoney(result.totalCosts)}
              detail="Fees + slippage / USDT"
            />
          </div>
          <div className="two-column">
            <Panel title="Simulated equity curve">
              <div className="panel-body">
                <AnalyticsChart
                  data={result.equity}
                  height={220}
                  format={formatMoney}
                />
              </div>
            </Panel>
            <Panel title="Drawdown from peak">
              <div className="panel-body">
                <AnalyticsChart
                  data={result.drawdown}
                  height={220}
                  color="#F0717B"
                  format={(v) => `${v.toFixed(2)}%`}
                />
              </div>
            </Panel>
          </div>
          <div className="info-box">
            Average win: {formatMoney(result.averageWin)} USDT · Average loss:{" "}
            {formatMoney(result.averageLoss)} USDT. Sharpe ratio is not
            reported: synthetic trade returns are not a calibrated time series.
          </div>
          <Panel
            title="Synthetic trade ledger"
            action={<Badge>{result.trades.length} trades</Badge>}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>Date</th>
                    <th className="number">Entry</th>
                    <th className="number">Exit</th>
                    <th className="number">Costs</th>
                    <th className="number">Net P&L</th>
                    <th className="number">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.map((trade, i) => (
                    <tr key={trade.id}>
                      <td>#{String(i + 1).padStart(3, "0")}</td>
                      <td>{trade.date}</td>
                      <td className="number">{formatMoney(trade.entry)}</td>
                      <td className="number">{formatMoney(trade.exit)}</td>
                      <td className="number muted">
                        {formatMoney(trade.costs)}
                      </td>
                      <td
                        className={`number ${trade.pnl >= 0 ? "positive" : "negative"}`}
                      >
                        {formatMoney(trade.pnl)}
                      </td>
                      <td className="number">{formatMoney(trade.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="dashboard-section">
          <Panel>
            <EmptyState
              title="A hypothesis, before a result"
              description="Choose a strategy and run the demonstration to inspect the synthetic equity curve, drawdown, transaction costs and individual trades."
            />
          </Panel>
        </div>
      )}
    </>
  );
}
