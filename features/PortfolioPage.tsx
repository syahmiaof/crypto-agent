"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw, RotateCcw } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { calculatePortfolio, formatMoney, formatPercent } from "@/lib/finance";
import {
  Badge,
  Button,
  ConfirmDialog,
  Metric,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import { AnalyticsChart } from "@/components/shared/AnalyticsChart";
import { OrderWorkspace } from "@/components/portfolio/OrderWorkspace";
export default function PortfolioPage() {
  const state = useDemoStore(),
    p = calculatePortfolio(state);
  const [reset, setReset] = useState(false);
  const curve = state.equityHistory.map((point, i) => ({
    label: `${new Date(point.timestamp).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })} · ${i + 1}`,
    value: point.equity,
  }));
  const data =
    curve.length === 1
      ? [{ label: "Starting capital", value: 10000 }, ...curve]
      : curve;
  return (
    <>
      <PageHeader
        title="Portfolio & Paper Trading"
        description="A clear view of your capital, exposure and every decision behind it."
      >
        <Button onClick={state.refreshSimulation}>
          <RefreshCw size={13} />
          Advance simulation
        </Button>
        <Link className="button primary" href="/signals">
          Review signals <ArrowUpRight size={14} />
        </Link>
      </PageHeader>
      <div className="metric-grid">
        <Metric
          label="Total equity / USDT"
          value={formatMoney(p.equity)}
          detail={`${formatPercent(p.netReturn)} since reset`}
          tone={p.netReturn >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Available cash"
          value={formatMoney(p.availableCash)}
          detail={`${formatMoney(p.reservedCash)} USDT reserved`}
        />
        <Metric
          label="Capital allocated"
          value={formatMoney(p.allocated)}
          detail={`${p.exposurePct.toFixed(1)}% total exposure`}
        />
        <Metric
          label="Realized P&L"
          value={formatMoney(p.realizedPnl)}
          detail={`${state.trades.length} closed trades`}
          tone={p.realizedPnl >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Unrealized P&L"
          value={formatMoney(p.unrealizedPnl)}
          detail={`${state.positions.length} open positions`}
          tone={p.unrealizedPnl >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Maximum drawdown"
          value={`${p.maxDrawdownPct.toFixed(2)}%`}
          detail="From portfolio high-water mark"
        />
      </div>
      <div className="split">
        <Panel
          title="Equity performance"
          action={<Badge>SIMULATED · SINCE RESET</Badge>}
        >
          <div className="panel-body">
            <div className="spread">
              <div>
                <h3 className="mono" style={{ fontSize: 24 }}>
                  {formatMoney(p.equity)} <small className="muted">USDT</small>
                </h3>
                <p className="muted" style={{ fontSize: 10, marginTop: 5 }}>
                  Account equity after each recorded event
                </p>
              </div>
              <Badge tone="positive">{formatPercent(p.netReturn)}</Badge>
            </div>
            <AnalyticsChart
              data={data}
              height={240}
              format={(v) => `${formatMoney(v)} USDT`}
            />
          </div>
        </Panel>
        <Panel
          title="Capital allocation"
          action={<Badge>{state.positions.length} positions</Badge>}
        >
          <div className="panel-body">
            <div className="allocation-row">
              <span className="status-dot" />
              <span>Cash</span>
              <div className="risk-meter">
                <span style={{ width: `${(p.cash / p.equity) * 100}%` }} />
              </div>
              <span className="mono">
                {((p.cash / p.equity) * 100).toFixed(1)}%
              </span>
            </div>
            {state.assets.map((asset) => {
              const value = state.positions
                .filter((pos) => pos.assetId === asset.id)
                .reduce((sum, pos) => sum + pos.quantity * asset.price, 0);
              return (
                <div className="allocation-row" key={asset.id}>
                  <span
                    className="status-dot"
                    style={{ background: asset.color }}
                  />
                  <span>{asset.id}</span>
                  <div className="risk-meter">
                    <span
                      style={{
                        width: `${(value / p.equity) * 100}%`,
                        background: asset.color,
                      }}
                    />
                  </div>
                  <span className="mono">
                    {((value / p.equity) * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
            <div className="divider" />
            <div className="spread">
              <span className="muted">Exposure limit</span>
              <span className="mono">{state.risk.maxExposurePct}%</span>
            </div>
          </div>
        </Panel>
      </div>
      <div className="dashboard-section">
        <OrderWorkspace />
      </div>
      <div className="two-column dashboard-section">
        <Panel title="Profit / loss breakdown">
          <div className="panel-body">
            <AnalyticsChart
              variant="bar"
              data={[
                { label: "Realized", value: p.realizedPnl },
                { label: "Unrealized", value: p.unrealizedPnl },
                { label: "Net P&L", value: p.netPnl },
              ]}
              height={180}
              format={formatMoney}
            />
          </div>
        </Panel>
        <Panel title="Daily performance">
          <div className="panel-body">
            <AnalyticsChart
              variant="bar"
              data={Object.entries(
                state.equityHistory.reduce<Record<string, number>>(
                  (days, point) => ({
                    ...days,
                    [point.timestamp.slice(0, 10)]: point.equity,
                  }),
                  {},
                ),
              ).map(([label, value], i, array) => ({
                label,
                value: value - (i ? array[i - 1][1] : 10000),
              }))}
              height={180}
              format={formatMoney}
            />
          </div>
        </Panel>
      </div>
      <div className="spread wrap dashboard-section">
        <p className="muted" style={{ fontSize: 10 }}>
          Local browser state · long-only spot ledger · protective levels
          require manual position closure
        </p>
        <Button variant="ghost" onClick={() => setReset(true)}>
          <RotateCcw size={13} />
          Reset demo portfolio
        </Button>
      </div>
      <ConfirmDialog
        open={reset}
        onOpenChange={setReset}
        title="Reset the entire demo?"
        description="Returns capital to 10,000 USDT and clears paper orders, positions, audit history and preferences. This affects the entire workspace, not just this page."
        danger
        onConfirm={state.resetDemo}
      />
    </>
  );
}
