"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Bot, RefreshCw, ShieldCheck } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import {
  calculatePortfolio,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/finance";
import {
  Badge,
  Button,
  Metric,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import { SignalTable } from "@/components/trading/SignalTable";
import { MarketPulse } from "@/components/shared/MarketPulse";
import { IntelligencePanel } from "@/components/agents/IntelligencePanel";
const MarketChart = dynamic(
  () => import("@/components/trading/MarketChart").then((m) => m.MarketChart),
  {
    ssr: false,
    loading: () => (
      <div className="panel chart-loading">Preparing market chart…</div>
    ),
  },
);
export default function DashboardPage() {
  const state = useDemoStore(),
    portfolio = calculatePortfolio(state);
  return (
    <>
      <PageHeader
        title="Mission Control"
        description="Your market. Your agents. One coordinated perspective."
      >
        <Badge tone="positive">
          <ShieldCheck size={11} />
          Paper mode
        </Badge>
        <Button onClick={state.refreshSimulation}>
          <RefreshCw size={13} />
          Refresh simulation
        </Button>
      </PageHeader>
      <div className="metric-grid">
        <Metric
          label="Paper portfolio / USDT"
          value={
            <>
              {state.settings.numberFormat === "compact"
                ? formatNumber(portfolio.equity, true)
                : formatMoney(portfolio.equity)}
            </>
          }
          detail="10,000 USDT initial capital"
          help="Cash + open positions valued at current simulated marks."
        />
        <Metric
          label="Net paper P&L"
          value={`${portfolio.netPnl >= 0 ? "+" : ""}${formatMoney(portfolio.netPnl)}`}
          detail={`${formatPercent(portfolio.netReturn)} since reset`}
          tone={portfolio.netPnl >= 0 ? "positive" : "negative"}
          help="Total equity minus 10,000 USDT initial capital."
        />
        <Metric
          label="Daily P&L"
          value={`${portfolio.dailyPnl >= 0 ? "+" : ""}${formatMoney(portfolio.dailyPnl)}`}
          detail={`${formatPercent(portfolio.dailyPnlPct)} vs demo day start`}
          tone={portfolio.dailyPnl >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Active AI agents"
          value={
            <>
              {state.agents.filter((a) => a.status === "running").length}
              <small> / {state.agents.length}</small>
            </>
          }
          detail="Demo engine · coordinated"
          tone="positive"
          help="Number of agents currently in running state."
        />
        <Metric
          label="Pending signals"
          value={String(
            state.signals.filter((s) => s.status === "pending").length,
          ).padStart(2, "0")}
          detail="Awaiting your review"
          tone="warning"
        />
        <Metric
          label="Risk utilization"
          value={
            <>
              {(
                (portfolio.exposurePct / state.risk.maxExposurePct) *
                100
              ).toFixed(0)}
              <small>%</small>
            </>
          }
          detail={`${portfolio.exposurePct.toFixed(1)}% exposure / ${state.risk.maxExposurePct}% limit`}
          help="Position and reserved order exposure as a share of configured portfolio limit."
        />
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <MarketChart height={335} compact />
          <Panel
            title="Active signals"
            action={
              <Link className="text-link" href="/signals">
                View signal center <ArrowRight size={13} />
              </Link>
            }
          >
            <SignalTable compact />
            <div className="section-note">
              <span>Evidence scores are not win probabilities.</span>
              <span>Approval required for every paper trade</span>
            </div>
          </Panel>
          <MarketPulse full />
        </div>
        <div className="dashboard-rail">
          <IntelligencePanel />
          <Panel
            title="Agent operations"
            action={<Badge tone="positive">Demo engine</Badge>}
          >
            {state.agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents?agent=${agent.id}`}
                className="agent-mini-row"
              >
                <span className="agent-mini-icon">
                  <Bot size={15} />
                </span>
                <div>
                  <strong>{agent.name}</strong>
                  <small>{agent.role}</small>
                </div>
                <Badge
                  tone={
                    agent.status === "running"
                      ? "positive"
                      : agent.status === "error"
                        ? "negative"
                        : "neutral"
                  }
                >
                  {agent.status}
                </Badge>
              </Link>
            ))}
            <div className="section-note">
              <Link className="text-link" href="/agents">
                Open agent war room <ArrowRight size={13} />
              </Link>
            </div>
          </Panel>
          <div className="info-box">
            <div className="row">
              <ShieldCheck size={15} />
              <strong>Human in the loop. Always.</strong>
            </div>
            <p style={{ marginTop: 7 }}>
              Agents explain the evidence. You control the decision. Every paper
              order passes deterministic risk checks.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
