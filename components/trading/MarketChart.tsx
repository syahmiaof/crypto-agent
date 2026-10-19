"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickChart,
  ChartNoAxesCombined,
  Expand,
  ArrowUpRight,
} from "lucide-react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { getCandles, getEMA, type Candle } from "@/lib/candles";
import { useDemoStore } from "@/store/demo-store";
import type { Timeframe } from "@/types";
import "./chart.css";

const timeframes: Timeframe[] = ["15M", "1H", "4H", "1D", "1W"];
const up = "#36D6A5";
const down = "#F0717B";

interface ChartInstances {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  line: ISeriesApi<"Line">;
  volume: ISeriesApi<"Histogram">;
  ema: ISeriesApi<"Line">;
  markers: ISeriesMarkersPluginApi<Time>;
}

export function MarketChart({
  compact = false,
  height = 330,
}: {
  compact?: boolean;
  height?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const instances = useRef<ChartInstances | null>(null);
  const lastView = useRef("");
  const router = useRouter();
  const selectedAsset = useDemoStore((state) => state.selectedAsset);
  const timeframe = useDemoStore((state) => state.timeframe);
  const assets = useDemoStore((state) => state.assets);
  const simulationStep = useDemoStore((state) => state.simulationStep);
  const settings = useDemoStore((state) => state.settings);
  const signals = useDemoStore((state) => state.signals);
  const setTimeframe = useDemoStore((state) => state.setTimeframe);
  const updateSettings = useDemoStore((state) => state.updateSettings);
  const asset = assets.find((item) => item.id === selectedAsset) ?? assets[0];
  const signal = signals.find(
    (item) => item.assetId === selectedAsset && item.direction !== "HOLD",
  );
  const [mode, setMode] = useState<"candles" | "line">("candles");
  const [showMarkers, setShowMarkers] = useState(true);
  const [crosshair, setCrosshair] = useState<{
    key: string;
    candle: Candle;
  } | null>(null);
  const candles = useMemo(
    () => getCandles(asset.id, asset.price, timeframe, simulationStep),
    [asset.id, asset.price, timeframe, simulationStep],
  );
  const currentView = `${asset.id}:${timeframe}`;
  const interaction = useRef({
    candles,
    currentView,
    signalId: signal?.id,
    router,
  });
  const precision = asset.price >= 10 ? 2 : asset.price >= 1 ? 4 : 6;
  const displayPrice = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: precision,
    });
  const current =
    (crosshair?.key === currentView
      ? candles.find((candle) => candle.time === crosshair.candle.time)
      : undefined) ?? candles[candles.length - 1];

  useEffect(() => {
    interaction.current = {
      candles,
      currentView,
      signalId: signal?.id,
      router,
    };
  }, [candles, currentView, signal?.id, router]);

  useEffect(() => {
    if (!container.current) return;
    const chart = createChart(container.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#111923" },
        textColor: "#96A6B5",
        fontFamily: "Geist Mono, monospace",
        fontSize: 10,
        panes: { separatorColor: "#263340", separatorHoverColor: "#364553" },
      },
      grid: {
        vertLines: { color: "#1b2530" },
        horzLines: { color: "#1b2530" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#627889", labelBackgroundColor: "#263340" },
        horzLine: { color: "#627889", labelBackgroundColor: "#263340" },
      },
      rightPriceScale: {
        borderColor: "#263340",
        scaleMargins: { top: 0.12, bottom: 0.1 },
        minimumWidth: 76,
      },
      timeScale: {
        borderColor: "#263340",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 7,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderVisible: false,
      wickUpColor: up,
      wickDownColor: down,
    });
    const lineSeries = chart.addSeries(LineSeries, {
      color: up,
      lineWidth: 2,
      visible: false,
      priceLineVisible: true,
    });
    const ema = chart.addSeries(LineSeries, {
      color: "#E9BC66",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const volume = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    );
    chart.panes()[1]?.setHeight(64);
    const markers = createSeriesMarkers(candleSeries, []);
    instances.current = {
      chart,
      candles: candleSeries,
      line: lineSeries,
      volume,
      ema,
      markers,
    };
    chart.subscribeCrosshairMove((event) => {
      const state = interaction.current;
      if (!event.time) {
        setCrosshair(null);
        return;
      }
      const candle = state.candles.find((item) => item.time === event.time);
      if (candle) setCrosshair({ key: state.currentView, candle });
    });
    chart.subscribeClick((event) => {
      const state = interaction.current;
      if (state.signalId && event.hoveredObjectId === state.signalId) {
        state.router.push(
          `/signals?signal=${encodeURIComponent(state.signalId)}`,
        );
      }
    });
    return () => {
      markers.detach();
      chart.remove();
      instances.current = null;
      lastView.current = "";
    };
  }, []);

  useEffect(() => {
    const instance = instances.current;
    if (!instance) return;
    const priceFormat = {
      type: "price" as const,
      precision,
      minMove: 10 ** -precision,
    };
    instance.candles.applyOptions({ visible: mode === "candles", priceFormat });
    instance.line.applyOptions({ visible: mode === "line", priceFormat });
    instance.candles.setData(
      candles.map((candle) => ({
        ...candle,
        time: candle.time as UTCTimestamp,
      })),
    );
    instance.line.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.close,
      })),
    );
    instance.ema.setData(
      getEMA(candles).map((point) => ({
        ...point,
        time: point.time as UTCTimestamp,
      })),
    );
    instance.ema.applyOptions({ visible: settings.showEMA, priceFormat });
    instance.volume.setData(
      settings.showVolume
        ? candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.volume,
            color: candle.close >= candle.open ? "#36D6A54D" : "#F0717B4D",
          }))
        : [],
    );
    instance.chart.panes()[1]?.setHeight(settings.showVolume ? 64 : 1);
    const signalTime = signal ? Date.parse(signal.createdAt) / 1_000 : 0;
    const markerCandle = candles.findLast(
      (candle) => candle.time <= signalTime,
    );
    instance.markers.setMarkers(
      showMarkers && mode === "candles" && signal && markerCandle
        ? [
            {
              id: signal.id,
              time: markerCandle.time as UTCTimestamp,
              position: signal.direction === "BUY" ? "belowBar" : "aboveBar",
              color: signal.direction === "BUY" ? up : down,
              shape: signal.direction === "BUY" ? "arrowUp" : "arrowDown",
              text: signal.direction,
            },
          ]
        : [],
    );
    if (lastView.current !== currentView) {
      instance.chart.timeScale().fitContent();
      lastView.current = currentView;
    }
  }, [
    candles,
    currentView,
    mode,
    precision,
    settings.showEMA,
    settings.showVolume,
    showMarkers,
    signal,
  ]);

  return (
    <section
      className={`panel market-chart ${compact ? "market-chart--compact" : ""}`}
      aria-label={`${asset.name} simulated market chart`}
    >
      <div className="panel-header market-chart-header">
        <div className="market-chart-identity">
          <span className="chart-asset-icon" style={{ color: asset.color }}>
            {asset.id === "BTC" ? "₿" : asset.id.slice(0, 1)}
          </span>
          <div>
            <h2>
              {asset.id}
              <span className="muted chart-pair"> / USDT</span>
            </h2>
            <span className="muted chart-exchange">
              {asset.name} · Simulated spot market
            </span>
          </div>
        </div>
        <div className="market-chart-quote">
          <strong>${displayPrice(asset.price)}</strong>
          <span className={asset.change >= 0 ? "positive" : "negative"}>
            {asset.change >= 0 ? "+" : ""}
            {asset.change.toFixed(2)}% <span className="muted">24h</span>
          </span>
        </div>
      </div>
      <div className="market-chart-toolbar">
        <div
          className="tabs chart-timeframes"
          role="group"
          aria-label="Chart timeframe"
        >
          {timeframes.map((value) => (
            <button
              key={value}
              type="button"
              className={timeframe === value ? "active" : ""}
              aria-pressed={timeframe === value}
              onClick={() => setTimeframe(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div
          className="chart-tool-buttons"
          role="group"
          aria-label="Chart display"
        >
          <button
            type="button"
            className={`chart-icon-button ${mode === "candles" ? "active" : ""}`}
            aria-label="Candlestick chart"
            title="Candlestick chart"
            aria-pressed={mode === "candles"}
            onClick={() => setMode("candles")}
          >
            <CandlestickChart size={15} />
          </button>
          <button
            type="button"
            className={`chart-icon-button ${mode === "line" ? "active" : ""}`}
            aria-label="Line chart"
            title="Line chart"
            aria-pressed={mode === "line"}
            onClick={() => setMode("line")}
          >
            <ChartNoAxesCombined size={15} />
          </button>
          <span className="chart-tool-divider" />
          <button
            type="button"
            className={`chart-text-toggle ${settings.showEMA ? "active" : ""}`}
            aria-pressed={settings.showEMA}
            onClick={() => updateSettings({ showEMA: !settings.showEMA })}
          >
            EMA
          </button>
          <button
            type="button"
            className={`chart-text-toggle ${settings.showVolume ? "active" : ""}`}
            aria-pressed={settings.showVolume}
            onClick={() => updateSettings({ showVolume: !settings.showVolume })}
          >
            VOL
          </button>
          <button
            type="button"
            className={`chart-text-toggle ${showMarkers ? "active" : ""}`}
            aria-pressed={showMarkers}
            onClick={() => setShowMarkers((value) => !value)}
          >
            Signals
          </button>
          <button
            type="button"
            className="chart-icon-button"
            aria-label="Fit chart to data"
            title="Fit chart to data"
            onClick={() => instances.current?.chart.timeScale().fitContent()}
          >
            <Expand size={14} />
          </button>
        </div>
      </div>
      <div className="chart-ohlc" aria-label="Candle values">
        {current && (
          <>
            <span>
              O <b>{displayPrice(current.open)}</b>
            </span>
            <span>
              H <b>{displayPrice(current.high)}</b>
            </span>
            <span>
              L <b>{displayPrice(current.low)}</b>
            </span>
            <span>
              C{" "}
              <b
                className={
                  current.close >= current.open ? "positive" : "negative"
                }
              >
                {displayPrice(current.close)}
              </b>
            </span>
          </>
        )}
        {settings.showEMA && (
          <span className="chart-ema-label">
            <i />
            EMA 20
          </span>
        )}
      </div>
      <div
        ref={container}
        className="market-chart-canvas"
        style={{ height }}
        role="img"
        aria-label={`${asset.name} ${timeframe} candlestick history. Current simulated price $${displayPrice(asset.price)}. Drag to pan, scroll to zoom.`}
      />
      <div className="market-chart-footer">
        <span>
          <i className="chart-status-dot" />
          Deterministic demo feed{" "}
          <span className="chart-footer-separator">·</span> UTC
        </span>
        {signal ? (
          <Link href={`/signals?signal=${encodeURIComponent(signal.id)}`}>
            View {signal.direction.toLowerCase()} signal{" "}
            <ArrowUpRight size={12} />
          </Link>
        ) : (
          <span className="muted">No active signal</span>
        )}
      </div>
    </section>
  );
}
