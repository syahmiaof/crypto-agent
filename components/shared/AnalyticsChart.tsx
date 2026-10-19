"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  variant?: "area" | "bar";
  format?: (value: number) => string;
}

const defaultFormat = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

export function AnalyticsChart({
  data,
  color = "#36D6A5",
  height = 220,
  variant = "area",
  format = defaultFormat,
}: AnalyticsChartProps) {
  const descriptionId = useId();
  const ticks = {
    fill: "#96A6B5",
    fontSize: 10,
    fontFamily: "var(--font-geist-mono), monospace",
  };
  const common = {
    data,
    margin: { top: 12, right: 12, left: 0, bottom: 0 },
    accessibilityLayer: true,
  };
  const chartContents = (
    <>
      <CartesianGrid stroke="#263340" strokeDasharray="3 5" vertical={false} />
      <XAxis
        dataKey="label"
        tick={ticks}
        axisLine={false}
        tickLine={false}
        minTickGap={28}
        dy={8}
      />
      <YAxis
        tick={ticks}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value: number) => format(value)}
        width={80}
        tickCount={4}
        domain={["auto", "auto"]}
      />
      <Tooltip
        cursor={
          variant === "bar"
            ? { fill: "#17212C" }
            : { stroke: "#96A6B5", strokeDasharray: "3 3" }
        }
        contentStyle={{
          background: "#111923",
          border: "1px solid #263340",
          borderRadius: 6,
          fontSize: 12,
        }}
        labelStyle={{ color: "#96A6B5", marginBottom: 4 }}
        itemStyle={{ color }}
        formatter={(value) => [format(Number(value)), "Value"]}
      />
    </>
  );

  if (!data.length)
    return (
      <div className="chart-empty muted" style={{ height }}>
        No observations for this period.
      </div>
    );

  return (
    <div
      className="analytics-chart"
      style={{ height, minWidth: 0, width: "100%" }}
      role="img"
      aria-describedby={descriptionId}
      aria-label={
        variant === "area"
          ? "Performance history chart"
          : "Period comparison chart"
      }
    >
      <span id={descriptionId} className="sr-only">
        {data
          .map((point) => `${point.label}: ${format(point.value)}`)
          .join(". ")}
      </span>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {variant === "bar" ? (
          <BarChart {...common}>
            {chartContents}
            <Bar
              dataKey="value"
              fill={color}
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <AreaChart {...common}>
            {chartContents}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.075}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
