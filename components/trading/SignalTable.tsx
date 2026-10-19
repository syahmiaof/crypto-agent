"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Plus,
  ShieldCheck,
  Minus,
} from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { STRATEGIES } from "@/data/fixtures";
import { formatMoney, riskReward } from "@/lib/finance";
import {
  AssetIcon,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
} from "@/components/ui/primitives";
import { SignalSnapshot } from "./SignalSnapshot";
import type { SignalStatus } from "@/types";
export const statusLabels: Record<SignalStatus, string> = {
  pending: "Pending approval",
  approved: "Approved · open order",
  executed: "Executed in Paper Mode",
  rejected: "Rejected",
  blocked: "Blocked by Risk Rules",
  expired: "Expired",
};
export function SignalTable({
  compact = false,
  assetId,
}: {
  compact?: boolean;
  assetId?: string;
}) {
  const state = useDemoStore();
  const [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState<"newest" | "strength" | "asset">("newest");
  const [notional, setNotional] = useState("500"),
    [mode, setMode] = useState<"instant" | "limit">("instant"),
    [message, setMessage] = useState<{ ok: boolean; message: string } | null>(
      null,
    ),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("signal");
    if (id) {
      const t = setTimeout(() => setSelected(id), 0);
      return () => clearTimeout(t);
    }
  }, []);
  const signal = state.signals.find((item) => item.id === selected);
  const analysis =
    state.analyses.find((item) => item.id === signal?.analysisId) ??
    state.analyses[0];
  const signals = state.signals
    .filter(
      (item) =>
        (!assetId || item.assetId === assetId) &&
        (filter === "all" || item.status === filter) &&
        (item.assetId + item.direction + item.id)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "strength"
        ? b.strength - a.strength
        : sort === "asset"
          ? a.assetId.localeCompare(b.assetId)
          : b.createdAt.localeCompare(a.createdAt),
    );
  const inspect = (id: string) => {
    setSelected(id);
    setMessage(null);
  };
  return (
    <>
      {!compact && (
        <div className="toolbar">
          <input
            className="control search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset or signal ID…"
            aria-label="Search signals"
          />
          <select
            className="control"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Signal status filter"
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="control"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort signals"
          >
            <option value="newest">Newest first</option>
            <option value="strength">Evidence strength</option>
            <option value="asset">Asset A–Z</option>
          </select>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset / Pair</th>
              <th>Direction</th>
              <th>{compact ? "Strength" : "Strategy"}</th>
              <th className="number">Entry{compact ? " range" : ""}</th>
              {!compact && (
                <>
                  <th className="number">Stop-loss</th>
                  <th className="number">Take-profit</th>
                </>
              )}
              <th className="number">R / R</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {signals.slice(0, compact ? 4 : undefined).map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="asset-cell">
                    <AssetIcon id={item.assetId} size={27} />
                    <div>
                      <strong>
                        {item.assetId}
                        <span className="muted"> / USDT</span>
                      </strong>
                      <small>
                        {new Date(item.createdAt).toLocaleTimeString("en-GB", {
                          timeZone: "UTC",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        UTC
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`direction ${item.direction === "BUY" ? "positive" : item.direction === "SELL" ? "negative" : "muted"}`}
                  >
                    {item.direction === "BUY" ? (
                      <ArrowUpRight size={13} />
                    ) : item.direction === "SELL" ? (
                      <ArrowDownRight size={13} />
                    ) : (
                      <Minus size={13} />
                    )}{" "}
                    {item.direction}
                  </span>
                </td>
                <td>
                  {compact ? (
                    <span className="strength">
                      <span className="strength-track">
                        <span style={{ width: `${item.strength}%` }} />
                      </span>
                      {item.strength}
                      <span className="muted">/100</span>
                    </span>
                  ) : (
                    STRATEGIES.find(
                      (strategy) => strategy.id === item.strategyId,
                    )?.name
                  )}
                </td>
                <td className="number">
                  {formatMoney(item.entry, item.entry < 1 ? 4 : 2)}
                </td>
                {!compact && (
                  <>
                    <td className="number negative">
                      {formatMoney(item.stopLoss, item.entry < 1 ? 4 : 2)}
                    </td>
                    <td className="number positive">
                      {formatMoney(item.takeProfit, item.entry < 1 ? 4 : 2)}
                    </td>
                  </>
                )}
                <td className="number">1 : {riskReward(item).toFixed(1)}</td>
                <td>
                  <Badge
                    tone={
                      item.status === "executed"
                        ? "positive"
                        : item.status === "blocked" ||
                            item.status === "rejected"
                          ? "negative"
                          : item.status === "pending"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {compact && item.status === "pending"
                      ? "Pending"
                      : statusLabels[item.status]}
                  </Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`View ${item.assetId} signal ${item.id}`}
                    onClick={() => inspect(item.id)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {signals.length === 0 && (
        <EmptyState
          title="No matching signals"
          description="Change your filters or run a new demo scenario in the Agent War Room."
        />
      )}
      <Drawer
        open={!!signal}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={
          signal
            ? `${signal.assetId}/USDT · ${signal.direction} signal`
            : "Signal details"
        }
      >
        {signal && (
          <>
            <div className="spread">
              <Badge tone={signal.direction === "BUY" ? "positive" : "warning"}>
                {signal.direction} · {signal.id}
              </Badge>
              <Badge>{statusLabels[signal.status]}</Badge>
            </div>
            <div>
              <h3>
                {
                  STRATEGIES.find(
                    (strategy) => strategy.id === signal.strategyId,
                  )?.name
                }
              </h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Synthetic analysis ·{" "}
                {new Date(signal.createdAt).toLocaleString("en-GB", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
            </div>
            <SignalSnapshot signal={signal} />
            <dl className="detail-grid">
              <div>
                <dt>Entry / USDT</dt>
                <dd>{formatMoney(signal.entry)}</dd>
              </div>
              <div>
                <dt>Risk / reward</dt>
                <dd>1 : {riskReward(signal).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Stop-loss</dt>
                <dd className="negative">{formatMoney(signal.stopLoss)}</dd>
              </div>
              <div>
                <dt>Take-profit</dt>
                <dd className="positive">{formatMoney(signal.takeProfit)}</dd>
              </div>
            </dl>
            <div>
              <h3>Decision evidence</h3>
              <ul className="evidence-list">
                <li>Technical: {analysis.summary}</li>
                <li>
                  Sentiment: scenario-specific synthetic inputs; fictional
                  sample, uncalibrated. Evidence references are listed below.
                </li>
                <li>Bull case: {analysis.bullish[2]}</li>
                <li>Bear case: {analysis.bearish[0]}</li>
              </ul>
            </div>
            <div className="info-box">
              <strong>Invalidation</strong>
              <p>{analysis.invalidation}</p>
            </div>
            <div>
              <h3>Risk Manager verdict</h3>
              <p className="muted" style={{ marginTop: 7 }}>
                Conditional approval only. Position, aggregate exposure,
                drawdown, daily loss, cash, cooldown and allowlist are checked
                when submitting. Risk / reward = |target − entry| ÷ |entry −
                stop|.
              </p>
            </div>
            <div className="field">
              <label htmlFor="order-notional">Paper order size (USDT)</label>
              <input
                id="order-notional"
                type="number"
                min="1"
                step="1"
                value={notional}
                onChange={(e) => setNotional(e.target.value)}
              />
            </div>
            <label className="field">
              Simulated fill model
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
              >
                <option value="instant">
                  Immediate fictional fill at mark
                </option>
                <option value="limit">
                  Queue unfilled limit order at entry
                </option>
              </select>
            </label>
            {message && (
              <div
                role="status"
                className={`message ${!message.ok ? "error" : ""}`}
              >
                {message.message}
              </div>
            )}
            {signal.reason && <p className="negative">{signal.reason}</p>}
            <div className="header-actions">
              <Button
                variant="primary"
                disabled={!["pending", "blocked"].includes(signal.status)}
                onClick={() => setConfirm(true)}
              >
                <ShieldCheck size={15} />
                Approve Paper Trade
              </Button>
              <Button
                variant="danger"
                disabled={!["pending", "blocked"].includes(signal.status)}
                onClick={() => setMessage(state.rejectSignal(signal.id))}
              >
                Reject Signal
              </Button>
            </div>
            <div className="header-actions">
              <Button
                onClick={() => {
                  state.addToWatchlist(signal.assetId);
                  setMessage({
                    ok: true,
                    message: `${signal.assetId} added to your market watchlist.`,
                  });
                }}
              >
                <Plus size={14} />
                {state.watchlist.includes(signal.assetId)
                  ? "On watchlist"
                  : "Add to Watchlist"}
              </Button>
              <Link
                className="button"
                href="/markets"
                onClick={() => state.selectAsset(signal.assetId)}
              >
                View Market <ArrowUpRight size={14} />
              </Link>
            </div>
            <p className="muted" style={{ fontSize: 10 }}>
              Sources: {analysis.id} · {analysis.evidence.join(" · ")}. Demo
              engine only; no external AI inference. Protective levels are
              research references; closing positions is manual in this demo.
            </p>
          </>
        )}
      </Drawer>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Approve a paper order?"
        description={`Submit ${notional || "0"} USDT through the risk engine. ${mode === "instant" ? "A successful validation creates an immediate simulated fill." : "Funds and risk exposure will be reserved until cancellation or an explicit demo fill."} No real funds are used.`}
        onConfirm={() => {
          if (signal)
            setMessage(state.approveSignal(signal.id, Number(notional), mode));
        }}
      />
    </>
  );
}
