"use client";
import Link from "next/link";
import { useDemoStore } from "@/store/demo-store";
import { AssetIcon, Panel } from "@/components/ui/primitives";
import { formatMoney, formatNumber } from "@/lib/finance";
import { getCandles } from "@/lib/candles";
export function MarketPulse({ full = false }: { full?: boolean }) {
  const state = useDemoStore();
  const assets = state.assets.filter((asset) =>
    state.watchlist.includes(asset.id),
  );
  return (
    <Panel
      title="Market pulse"
      action={
        <span className="muted" style={{ fontSize: 9 }}>
          WATCHLIST · SIMULATED
        </span>
      }
    >
      {full ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th className="number">Price / USDT</th>
                <th className="number">24h change</th>
                <th className="number">24h volume</th>
                <th>7D trend</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <Link
                      className="asset-cell"
                      href="/markets"
                      onClick={() => state.selectAsset(asset.id)}
                    >
                      <AssetIcon id={asset.id} />
                      <div>
                        <strong>{asset.name}</strong>
                        <small>{asset.symbol}</small>
                      </div>
                    </Link>
                  </td>
                  <td className="number">
                    {formatMoney(asset.price, asset.price < 1 ? 4 : 2)}
                  </td>
                  <td
                    className={`number ${asset.change >= 0 ? "positive" : "negative"}`}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(2)}%
                  </td>
                  <td className="number muted">
                    {formatNumber(asset.volume, true)}
                  </td>
                  <td>
                    <Sparkline
                      values={getCandles(
                        asset.id,
                        asset.price,
                        "1D",
                        state.simulationStep,
                      )
                        .slice(-7)
                        .map((c) => c.close)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        assets.map((asset) => (
          <Link
            href="/markets"
            onClick={() => state.selectAsset(asset.id)}
            className="watchlist-row"
            key={asset.id}
          >
            <div className="asset-cell">
              <AssetIcon id={asset.id} size={25} />
              <strong>
                {asset.id}
                <small className="muted">/ USDT</small>
              </strong>
            </div>
            <div className="price">
              {formatMoney(asset.price, asset.price < 1 ? 4 : 2)}
            </div>
            <div
              className={`change ${asset.change >= 0 ? "positive" : "negative"}`}
            >
              {asset.change >= 0 ? "+" : ""}
              {asset.change.toFixed(2)}%
            </div>
          </Link>
        ))
      )}
    </Panel>
  );
}
export function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values),
    range = Math.max(...values) - min || 1,
    positive = values.at(-1)! >= values[0];
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 58 + 1},${23 - ((v - min) / range) * 20}`,
    )
    .join(" ");
  return (
    <svg
      className="sparkline"
      viewBox="0 0 60 25"
      role="img"
      aria-label="Seven daily closes from simulated chart history"
    >
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#36d6a5" : "#f0717b"}
        strokeWidth="1.4"
      />
    </svg>
  );
}
