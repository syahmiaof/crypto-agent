"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemoStore } from "@/store/demo-store";
import { calculatePortfolio, formatMoney } from "@/lib/finance";
import {
  AssetIcon,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Panel,
} from "@/components/ui/primitives";
import type { PaperOrder, Trade } from "@/types";
export function OrderWorkspace({
  initialTab = "positions",
}: {
  initialTab?: "positions" | "orders" | "history" | "trades";
}) {
  const state = useDemoStore(),
    portfolio = calculatePortfolio(state);
  const [tab, setTab] = useState(initialTab),
    [detail, setDetail] = useState<PaperOrder | Trade | null>(null),
    [close, setClose] = useState<string | null>(null),
    [message, setMessage] = useState<{ ok: boolean; message: string } | null>(
      null,
    );
  const tabs = [
    ["positions", "Open Positions"],
    ["orders", "Open Paper Orders"],
    ["history", "Order History"],
    ["trades", "Trade History"],
  ] as const;
  return (
    <Panel
      title="Paper trading workspace"
      action={<Badge>ZERO FEES · DEMO</Badge>}
    >
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Paper workspace">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {label}
              {value === "positions"
                ? ` (${state.positions.length})`
                : value === "orders"
                  ? ` (${state.orders.filter((o) => o.status === "open").length})`
                  : ""}
            </button>
          ))}
        </div>
      </div>
      {message && (
        <div
          role="status"
          className={`message ${message.ok ? "" : "error"}`}
          style={{ margin: 14 }}
        >
          {message.message}
        </div>
      )}
      {tab === "positions" &&
        (state.positions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset / side</th>
                  <th className="number">Quantity</th>
                  <th className="number">Entry</th>
                  <th className="number">Mark</th>
                  <th className="number">Value</th>
                  <th className="number">Unrealized P&L</th>
                  <th className="number">Exposure</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {state.positions.map((position) => {
                  const asset = state.assets.find(
                      (a) => a.id === position.assetId,
                    )!,
                    value = asset.price * position.quantity,
                    pnl = value - position.entryPrice * position.quantity;
                  return (
                    <tr key={position.id}>
                      <td>
                        <div className="asset-cell">
                          <AssetIcon id={asset.id} size={26} />
                          <div>
                            <strong>{asset.id}/USDT</strong>
                            <small>Long · Open</small>
                          </div>
                        </div>
                      </td>
                      <td className="number">{position.quantity.toFixed(6)}</td>
                      <td className="number">
                        {formatMoney(position.entryPrice)}
                      </td>
                      <td className="number">{formatMoney(asset.price)}</td>
                      <td className="number">{formatMoney(value)}</td>
                      <td
                        className={`number ${pnl >= 0 ? "positive" : "negative"}`}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {formatMoney(pnl)}
                      </td>
                      <td className="number">
                        {((value / portfolio.equity) * 100).toFixed(2)}%
                      </td>
                      <td>
                        <Button onClick={() => setClose(position.id)}>
                          Close position
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Your next decision starts with evidence"
            description="Approve a BUY signal to open your first simulated position. Your 10,000 USDT starting capital is ready."
          />
        ))}
      {(tab === "orders" || tab === "history") &&
        (() => {
          const orders = state.orders.filter(
            (order) => tab === "history" || order.status === "open",
          );
          return orders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order / Asset</th>
                    <th>Originating signal</th>
                    <th className="number">Notional / USDT</th>
                    <th className="number">Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.assetId}/USDT</strong>
                        <small className="muted" style={{ display: "block" }}>
                          {order.id}
                        </small>
                      </td>
                      <td>
                        <Link
                          href={`/signals?signal=${order.signalId}`}
                          className="text-link"
                        >
                          {order.signalId}
                        </Link>
                      </td>
                      <td className="number">{formatMoney(order.notional)}</td>
                      <td className="number">{formatMoney(order.price)}</td>
                      <td>
                        <Badge
                          tone={
                            order.status === "filled" ? "positive" : "neutral"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="header-actions">
                          <Button onClick={() => setDetail(order)}>
                            Details
                          </Button>
                          {order.status === "open" && (
                            <>
                              <Button
                                onClick={() =>
                                  setMessage(state.fillOrder(order.id))
                                }
                              >
                                Simulate fill
                              </Button>
                              <Button
                                onClick={() =>
                                  setMessage(state.cancelOrder(order.id))
                                }
                              >
                                Cancel order
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={
                tab === "orders"
                  ? "No open paper orders"
                  : "No paper orders yet"
              }
              description="Approve a signal with the queued fill model to reserve cash. A fill requires a new risk check and the mark to reach your limit."
            />
          );
        })()}
      {tab === "trades" &&
        (state.trades.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="number">Quantity</th>
                  <th className="number">Entry</th>
                  <th className="number">Exit</th>
                  <th className="number">Realized P&L</th>
                  <th>Closed / UTC</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.assetId}/USDT</td>
                    <td className="number">{trade.quantity.toFixed(6)}</td>
                    <td className="number">{formatMoney(trade.entryPrice)}</td>
                    <td className="number">{formatMoney(trade.exitPrice)}</td>
                    <td
                      className={`number ${trade.pnl >= 0 ? "positive" : "negative"}`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}
                      {formatMoney(trade.pnl)}
                    </td>
                    <td>
                      {new Date(trade.closedAt).toLocaleTimeString("en-GB", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <Button onClick={() => setDetail(trade)}>Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No closed trades"
            description="Close an open position to realize its simulated profit or loss and create a trade record."
          />
        ))}
      <div className="section-note">
        <span>
          Fictional fills · zero fees and slippage · no exchange execution
        </span>
        <Link href="/signals" className="text-link">
          Review signals →
        </Link>
      </div>
      <ConfirmDialog
        open={!!close}
        onOpenChange={(open) => {
          if (!open) setClose(null);
        }}
        title="Close this paper position?"
        description="The full position will close at its current simulated mark. This realizes the profit or loss and credits your paper cash balance."
        onConfirm={() => {
          if (close) setMessage(state.closePosition(close));
          setClose(null);
        }}
      />
      <Drawer
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title="Paper execution record"
      >
        {detail && (
          <>
            <Badge>SIMULATED RECORD</Badge>
            <dl className="detail-grid">
              {Object.entries(detail).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd style={{ fontSize: 11, overflowWrap: "anywhere" }}>
                    {typeof value === "number" ? formatMoney(value, 6) : value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </Drawer>
    </Panel>
  );
}
