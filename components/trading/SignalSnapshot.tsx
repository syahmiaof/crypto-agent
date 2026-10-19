"use client";
import { useMemo } from "react";
import { AnalyticsChart } from "@/components/shared/AnalyticsChart";
import { getCandles } from "@/lib/candles";
import { useDemoStore } from "@/store/demo-store";
import { formatMoney } from "@/lib/finance";
import type { Signal } from "@/types";
export function SignalSnapshot({ signal }: { signal: Signal }) {
  const price = useDemoStore(
      (s) =>
        s.assets.find((a) => a.id === signal.assetId)?.price ?? signal.entry,
    ),
    step = useDemoStore((s) => s.simulationStep);
  const data = useMemo(
    () =>
      getCandles(signal.assetId, price, "1H", step)
        .slice(-24)
        .map((c) => ({
          label: new Date(c.time * 1000).toISOString().slice(11, 16),
          value: c.close,
        })),
    [signal.assetId, price, step],
  );
  return (
    <div>
      <div className="spread">
        <h3>{signal.assetId} · 24-bar context</h3>
        <small className="muted">1H · SIMULATED</small>
      </div>
      <AnalyticsChart
        data={data}
        height={170}
        format={(v) => formatMoney(v, price < 1 ? 4 : 2)}
      />
    </div>
  );
}
