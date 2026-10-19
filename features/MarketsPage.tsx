"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { formatMoney, formatNumber } from "@/lib/finance";
import { Badge, Button, PageHeader, Panel } from "@/components/ui/primitives";
import { IntelligencePanel } from "@/components/agents/IntelligencePanel";
import { OrderWorkspace } from "@/components/portfolio/OrderWorkspace";
import { SignalTable } from "@/components/trading/SignalTable";
import { MarketPulse } from "@/components/shared/MarketPulse";
import type { AssetId } from "@/types";
const MarketChart = dynamic(
  () => import("@/components/trading/MarketChart").then((m) => m.MarketChart),
  {
    ssr: false,
    loading: () => (
      <div className="panel chart-loading">Preparing market chart…</div>
    ),
  },
);
export default function MarketsPage() {
  const state = useDemoStore(),
    asset = state.assets.find((a) => a.id === state.selectedAsset)!;
  const [tab, setTab] = useState("summary"),
    [bottom, setBottom] = useState("orders");
  return (
    <>
      <PageHeader
        title="Market Terminal"
        description="Read the structure. Find the context. Stay ahead of your next decision."
      >
        <label className="field">
          <span className="sr-only">Terminal asset</span>
          <select
            value={state.selectedAsset}
            onChange={(e) => state.selectAsset(e.target.value as AssetId)}
          >
            {state.assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.symbol}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={state.refreshSimulation}>
          <RefreshCw size={14} />
          Refresh simulation
        </Button>
      </PageHeader>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <MarketChart height={460} />
          <Panel>
            <div className="toolbar">
              <div className="tabs">
                {[
                  ["orders", "Paper orders & trades"],
                  ["signals", "Signal history"],
                ].map(([key, label]) => (
                  <button
                    className={bottom === key ? "active" : ""}
                    key={key}
                    onClick={() => setBottom(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {bottom === "signals" ? (
              <SignalTable assetId={asset.id} />
            ) : (
              <OrderWorkspace initialTab="orders" />
            )}
          </Panel>
        </div>
        <div className="dashboard-rail">
          <Panel>
            <div className="toolbar" style={{ padding: 10 }}>
              <div className="tabs">
                {[
                  ["summary", "Summary"],
                  ["book", "Order Book"],
                  ["insights", "AI Insights"],
                  ["signals", "Signals"],
                ].map(([key, label]) => (
                  <button
                    className={tab === key ? "active" : ""}
                    key={key}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {tab === "summary" ? (
              <div className="panel-body stack">
                <div>
                  <Badge tone="positive">SIMULATED MARKET</Badge>
                  <h2 style={{ fontSize: 21, marginTop: 17 }}>{asset.name}</h2>
                  <p className="mono" style={{ fontSize: 28, marginTop: 4 }}>
                    {formatMoney(asset.price, asset.price < 1 ? 4 : 2)}
                  </p>
                  <p
                    className={asset.change >= 0 ? "positive" : "negative"}
                    style={{ fontSize: 12 }}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(2)}%{" "}
                    <span className="muted">past 24 simulated hours</span>
                  </p>
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>24h volume</dt>
                    <dd>{formatNumber(asset.volume, true)}</dd>
                  </div>
                  <div>
                    <dt>Quote currency</dt>
                    <dd>USDT</dd>
                  </div>
                  <div>
                    <dt>Support reference</dt>
                    <dd>{formatMoney(asset.price * 0.98)}</dd>
                  </div>
                  <div>
                    <dt>Resistance reference</dt>
                    <dd>{formatMoney(asset.price * 1.025)}</dd>
                  </div>
                </dl>
                <p className="muted" style={{ fontSize: 11 }}>
                  Synthetic fixture snapshot. Refresh advances the demo clock by
                  one minute and recomputes marks.
                </p>
              </div>
            ) : tab === "book" ? (
              <div style={{ padding: "13px 0" }}>
                <p
                  className="muted"
                  style={{ fontSize: 9, padding: "0 14px 12px" }}
                >
                  SIMULATED DEPTH · SYNTHETIC LIQUIDITY
                </p>
                <div className="orderbook-row muted">
                  <span>Price (USDT)</span>
                  <span>Size ({asset.id})</span>
                  <span>Total</span>
                </div>
                {Array.from({ length: 8 }, (_, i) => {
                  const quantity = (9 - i) * 0.037 * (67432 / asset.price);
                  return (
                    <div className="orderbook-row negative" key={i}>
                      <i
                        style={{
                          width: `${25 + i * 8}%`,
                          background: "var(--loss)",
                        }}
                      />
                      <span>
                        {formatMoney(
                          asset.price * (1 + (8 - i) * 0.0002),
                          asset.price < 1 ? 5 : 2,
                        )}
                      </span>
                      <span>{quantity.toFixed(4)}</span>
                      <span>{formatMoney(quantity * asset.price)}</span>
                    </div>
                  );
                })}
                <div className="orderbook-mid">
                  {formatMoney(asset.price, asset.price < 1 ? 5 : 2)}
                </div>
                {Array.from({ length: 8 }, (_, i) => {
                  const quantity = (i + 2) * 0.041 * (67432 / asset.price);
                  return (
                    <div className="orderbook-row positive" key={i}>
                      <i
                        style={{
                          width: `${20 + i * 9}%`,
                          background: "var(--accent)",
                        }}
                      />
                      <span>
                        {formatMoney(
                          asset.price * (1 - (i + 1) * 0.0002),
                          asset.price < 1 ? 5 : 2,
                        )}
                      </span>
                      <span>{quantity.toFixed(4)}</span>
                      <span>{formatMoney(quantity * asset.price)}</span>
                    </div>
                  );
                })}
              </div>
            ) : tab === "insights" ? (
              <IntelligencePanel />
            ) : (
              <div className="panel-body stack">
                {state.signals
                  .filter((s) => s.assetId === asset.id)
                  .map((signal) => (
                    <Link
                      className="notification-item"
                      key={signal.id}
                      href={`/signals?signal=${signal.id}`}
                    >
                      <div className="spread">
                        <Badge
                          tone={
                            signal.direction === "BUY" ? "positive" : "warning"
                          }
                        >
                          {signal.direction}
                        </Badge>
                        <ArrowUpRight size={14} />
                      </div>
                      <p>
                        {signal.id} · {signal.strength}/100 evidence
                      </p>
                      <small className="muted">
                        {signal.status} · review details
                      </small>
                    </Link>
                  ))}
              </div>
            )}
          </Panel>
          <MarketPulse />
        </div>
      </div>
    </>
  );
}
