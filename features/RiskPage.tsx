"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  LockKeyhole,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Metric,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import { useDemoStore } from "@/store/demo-store";
import { calculatePortfolio, formatMoney } from "@/lib/finance";
import { ASSET_IDS } from "@/data/fixtures";
import type { RiskLimits } from "@/types";

const fields: {
  key: Exclude<keyof RiskLimits, "allowlist">;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  help: string;
}[] = [
  {
    key: "maxPositionPct",
    label: "Maximum position size",
    unit: "% of equity per asset",
    min: 0.1,
    max: 100,
    step: 0.1,
    help: "Combines filled positions and reserved orders for the same asset.",
  },
  {
    key: "maxExposurePct",
    label: "Maximum total exposure",
    unit: "% of equity",
    min: 0.1,
    max: 100,
    step: 0.1,
    help: "Mark value of positions plus capital reserved by open orders.",
  },
  {
    key: "maxDailyLossPct",
    label: "Daily loss limit",
    unit: "% of day-start equity",
    min: 0.1,
    max: 100,
    step: 0.1,
    help: "Includes realized and unrealized losses during the simulation day.",
  },
  {
    key: "maxDrawdownPct",
    label: "Maximum drawdown",
    unit: "% below peak equity",
    min: 0.1,
    max: 100,
    step: 0.1,
    help: "Blocks new exposure when equity falls this far from its recorded peak.",
  },
  {
    key: "maxPositions",
    label: "Concurrent position limit",
    unit: "positions + open orders",
    min: 1,
    max: 20,
    step: 1,
    help: "Each filled position and each unfilled order consumes one slot.",
  },
  {
    key: "minRiskReward",
    label: "Minimum risk / reward",
    unit: ": 1 reward to risk",
    min: 0.1,
    max: 20,
    step: 0.1,
    help: "Recomputed from the simulated mark before approval and fill.",
  },
  {
    key: "cooldownSeconds",
    label: "Trade cooldown",
    unit: "simulation seconds",
    min: 0,
    max: 86400,
    step: 1,
    help: "Refresh Simulation advances the clock by 60 seconds.",
  },
];

function RiskMeter({
  label,
  value,
  limit,
  suffix = "%",
}: {
  label: string;
  value: number;
  limit: number;
  suffix?: string;
}) {
  const utilization = Math.min(100, (value / limit) * 100);
  return (
    <div className="risk-row">
      <div className="spread">
        <span>{label}</span>
        <span className="mono">
          <span className={value >= limit ? "negative" : ""}>
            {value.toFixed(suffix ? 2 : 0)}
            {suffix}
          </span>{" "}
          <span className="muted">
            / {limit}
            {suffix}
          </span>
        </span>
      </div>
      <div
        className="risk-meter"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(value, limit)}
      >
        <span
          style={{
            width: `${utilization}%`,
            background:
              value >= limit
                ? "var(--loss)"
                : utilization > 75
                  ? "var(--warning)"
                  : "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

export default function RiskPage() {
  const state = useDemoStore();
  const portfolio = calculatePortfolio(state);
  const [draft, setDraft] = useState<Partial<RiskLimits>>({});
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const config = { ...state.risk, ...draft };
  const riskEvents = state.events
    .filter((event) => event.type === "risk")
    .slice(0, 4);
  const largestExposure = Math.max(
    0,
    ...state.assets.map(
      (asset) =>
        ((state.positions
          .filter((position) => position.assetId === asset.id)
          .reduce((sum, position) => sum + position.quantity * asset.price, 0) +
          state.orders
            .filter(
              (order) => order.assetId === asset.id && order.status === "open",
            )
            .reduce((sum, order) => sum + order.notional, 0)) /
          portfolio.equity) *
        100,
    ),
  );
  const cooldownRemaining = state.lastTradeAt
    ? Math.max(
        0,
        state.risk.cooldownSeconds -
          (Date.parse(state.clock) - Date.parse(state.lastTradeAt)) / 1000,
      )
    : 0;
  const blocked =
    state.emergencyStop ||
    -portfolio.dailyPnlPct >= state.risk.maxDailyLossPct ||
    portfolio.drawdownPct >= state.risk.maxDrawdownPct;
  return (
    <>
      <PageHeader
        title="Risk Control"
        description="Deterministic guardrails. Every paper order. Every time."
      >
        <Badge tone={blocked ? "negative" : "positive"}>
          {blocked ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
          {blocked ? "NEW EXPOSURE BLOCKED" : "RISK ENGINE ACTIVE"}
        </Badge>
      </PageHeader>
      <div className="metric-grid metrics-three">
        <Metric
          label="Portfolio exposure"
          value={`${portfolio.exposurePct.toFixed(1)}%`}
          detail={`Limit ${state.risk.maxExposurePct}% · includes reservations`}
          help="Current position mark value plus reserved order capital, divided by equity."
        />
        <Metric
          label="Current drawdown"
          value={`${portfolio.drawdownPct.toFixed(2)}%`}
          detail={`Peak equity $${formatMoney(state.peakEquity)}`}
          tone={portfolio.drawdownPct ? "warning" : ""}
          help="Percentage decline from the highest recorded simulated portfolio equity."
        />
        <Metric
          label="Available risk capital"
          value={`$${formatMoney(portfolio.availableCash)}`}
          detail={`$${formatMoney(portfolio.reservedCash)} reserved for open orders`}
          help="Unspent cash less reservations. Every order also checks exposure and loss limits."
        />
      </div>
      <div className="split">
        <Panel
          title="Trading guardrails"
          action={<Badge>ENFORCED IN CODE</Badge>}
        >
          <form
            className="panel-body stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = state.setRisk(config);
              setFeedback(result);
              if (result.ok) setDraft({});
            }}
          >
            <div className="form-grid">
              {fields.map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    className="control"
                    type="number"
                    required
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={
                      Number.isNaN(config[field.key]) ? "" : config[field.key]
                    }
                    onChange={(event) => {
                      setDraft((previous) => ({
                        ...previous,
                        [field.key]:
                          event.target.value === ""
                            ? NaN
                            : Number(event.target.value),
                      }));
                      setFeedback(null);
                    }}
                  />
                  <small className="muted">{field.unit}</small>
                  <small className="muted">{field.help}</small>
                </label>
              ))}
            </div>
            <fieldset
              style={{
                border: "1px solid var(--border)",
                padding: 14,
                borderRadius: 6,
              }}
            >
              <legend style={{ padding: "0 6px", fontSize: 12 }}>
                Permitted assets
              </legend>
              <div className="header-actions" style={{ gap: 16 }}>
                {ASSET_IDS.map((id) => (
                  <label
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={config.allowlist.includes(id)}
                      onChange={(event) => {
                        setDraft((previous) => ({
                          ...previous,
                          allowlist: event.target.checked
                            ? [...config.allowlist, id]
                            : config.allowlist.filter((asset) => asset !== id),
                        }));
                        setFeedback(null);
                      }}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
            {feedback && (
              <p
                role={feedback.ok ? "status" : "alert"}
                className={`info-box ${feedback.ok ? "positive" : "negative"}`}
              >
                {feedback.message}
              </p>
            )}
            <div className="spread">
              <span className="muted" style={{ fontSize: 11 }}>
                Changes apply to new approvals and pending fills.
              </span>
              <Button type="submit" variant="primary">
                <Check size={14} />
                Save risk limits
              </Button>
            </div>
          </form>
        </Panel>
        <div className="stack">
          <Panel title="Exposure & loss monitors">
            <div className="panel-body">
              <RiskMeter
                label="Largest asset exposure"
                value={largestExposure}
                limit={state.risk.maxPositionPct}
              />
              <RiskMeter
                label="Total exposure"
                value={portfolio.exposurePct}
                limit={state.risk.maxExposurePct}
              />
              <RiskMeter
                label="Daily loss"
                value={Math.max(0, -portfolio.dailyPnlPct)}
                limit={state.risk.maxDailyLossPct}
              />
              <RiskMeter
                label="Peak drawdown"
                value={portfolio.drawdownPct}
                limit={state.risk.maxDrawdownPct}
              />
              <RiskMeter
                label="Concurrent slots"
                value={
                  state.positions.length +
                  state.orders.filter((order) => order.status === "open").length
                }
                limit={state.risk.maxPositions}
                suffix=""
              />
              <div className="spread" style={{ marginTop: 14, fontSize: 11 }}>
                <span className="muted">Trade cooldown</span>
                <Badge tone={cooldownRemaining ? "warning" : "positive"}>
                  {cooldownRemaining
                    ? `${cooldownRemaining}s remaining`
                    : "Ready"}
                </Badge>
              </div>
            </div>
          </Panel>
          <section className="risk-stop">
            <h2>
              <LockKeyhole size={18} />
              {state.emergencyStop
                ? "Emergency stop is active"
                : "Emergency stop"}
            </h2>
            <p>
              Immediately block new paper orders and pending fills. You can
              still close positions and cancel orders to reduce exposure.
            </p>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              {state.emergencyStop
                ? "Release emergency stop"
                : "Activate emergency stop"}
            </Button>
          </section>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <Panel
          title="Recent risk events"
          action={
            <Link href="/activity" className="button ghost">
              View audit log <ArrowUpRight size={14} />
            </Link>
          }
        >
          {riskEvents.length ? (
            riskEvents.map((entry) => (
              <div key={entry.id} className="audit-event">
                <time className="mono muted" style={{ fontSize: 10 }}>
                  {entry.timestamp.slice(11, 19)} UTC
                </time>
                <Badge
                  tone={entry.severity === "error" ? "negative" : "warning"}
                >
                  {entry.severity}
                </Badge>
                <div>
                  <h3>{entry.summary}</h3>
                  <p>{entry.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No risk violations"
              description="Blocked orders, emergency stops and risk interventions will appear here as you use the simulation."
            />
          )}
        </Panel>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        danger={!state.emergencyStop}
        title={
          state.emergencyStop
            ? "Release emergency stop?"
            : "Pause all new paper exposure?"
        }
        description={
          state.emergencyStop
            ? "Paper orders can resume after passing every configured risk check. This action is recorded in the audit log."
            : "New approvals and pending fills will be blocked until you explicitly release the stop. Existing positions are not automatically liquidated."
        }
        onConfirm={() => state.setEmergencyStop(!state.emergencyStop)}
      />
    </>
  );
}
