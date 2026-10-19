import type {
  Agent,
  Analysis,
  Asset,
  AssetId,
  Candle,
  Signal,
  Strategy,
  Timeframe,
} from "../types";

export const INITIAL_TIME = "2026-10-20T08:00:00.000Z";
export const INITIAL_ASSETS: Asset[] = [
  {
    id: "BTC",
    name: "Bitcoin",
    symbol: "BTC/USDT",
    price: 67432.8,
    change: 2.34,
    volume: 28900000000,
    color: "#f3a541",
  },
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH/USDT",
    price: 3521.46,
    change: 1.82,
    volume: 14200000000,
    color: "#9baff7",
  },
  {
    id: "SOL",
    name: "Solana",
    symbol: "SOL/USDT",
    price: 172.84,
    change: 4.67,
    volume: 3600000000,
    color: "#a98be6",
  },
  {
    id: "AVAX",
    name: "Avalanche",
    symbol: "AVAX/USDT",
    price: 36.72,
    change: -1.24,
    volume: 418000000,
    color: "#ed7886",
  },
  {
    id: "LINK",
    name: "Chainlink",
    symbol: "LINK/USDT",
    price: 17.26,
    change: 0.91,
    volume: 312000000,
    color: "#729ce9",
  },
  {
    id: "ADA",
    name: "Cardano",
    symbol: "ADA/USDT",
    price: 0.4528,
    change: -0.72,
    volume: 226000000,
    color: "#78bcd4",
  },
];
export const STRATEGIES: Strategy[] = [
  {
    id: "trend",
    name: "Trend Following",
    description: "Follow sustained directional moves with volume confirmation.",
    timeframe: "4H",
    assets: ["BTC", "ETH", "SOL"],
    entry: "Close above 50-period EMA with rising volume.",
    exit: "Close below EMA or a 2% protective stop.",
    parameters: [{ name: "EMA period", value: 50, min: 10, max: 200 }],
  },
  {
    id: "ema",
    name: "EMA Crossover",
    description: "Fast and slow moving averages identify changes in momentum.",
    timeframe: "1H",
    assets: ["BTC", "ETH"],
    entry: "Fast EMA crosses above slow EMA.",
    exit: "Reverse crossover or protective stop.",
    parameters: [
      { name: "Fast EMA", value: 12, min: 2, max: 40 },
      { name: "Slow EMA", value: 26, min: 15, max: 100 },
    ],
  },
  {
    id: "rsi",
    name: "RSI Mean Reversion",
    description: "Test recovery after oversold conditions in ranging markets.",
    timeframe: "1H",
    assets: ["ETH", "LINK", "ADA"],
    entry: "RSI recovers above 30 after an oversold reading.",
    exit: "RSI reaches 65 or price loses its local support.",
    parameters: [{ name: "RSI period", value: 14, min: 5, max: 30 }],
  },
  {
    id: "breakout",
    name: "Breakout Confirmation",
    description: "Require price and volume agreement at resistance.",
    timeframe: "4H",
    assets: ["BTC", "SOL", "AVAX"],
    entry: "Close above the 20-bar high on 1.5x average volume.",
    exit: "Failed retest or 3:1 reward target.",
    parameters: [{ name: "Lookback", value: 20, min: 5, max: 100 }],
  },
  {
    id: "momentum",
    name: "Momentum Filter",
    description: "Select positive momentum with a volatility guardrail.",
    timeframe: "1D",
    assets: ["SOL", "AVAX", "LINK"],
    entry: "Positive 10-bar return and price above 20-period EMA.",
    exit: "Momentum turns negative or stop is touched.",
    parameters: [{ name: "Momentum period", value: 10, min: 3, max: 60 }],
  },
  {
    id: "multi",
    name: "Multi-Signal Confirmation",
    description: "Aggregate technical, volume and sentiment evidence.",
    timeframe: "4H",
    assets: ["BTC", "ETH", "SOL", "AVAX", "LINK", "ADA"],
    entry: "At least three evidence families agree.",
    exit: "Evidence weakens or protective stop is touched.",
    parameters: [{ name: "Required confirmations", value: 3, min: 2, max: 5 }],
  },
];
export const ANALYSES: Analysis[] = [
  {
    id: "analysis-001",
    regime: "Cautiously bullish",
    summary:
      "Trend strength is improving, but resistance and uneven volume argue for selective entries. Evidence strength is a rubric score, not a win probability.",
    bullish: [
      "BTC holds above the simulated 20-period EMA.",
      "SOL relative momentum leads the seeded basket.",
      "Support retests show improving buy volume.",
    ],
    bearish: [
      "BTC is approaching the upper resistance band.",
      "Participation remains uneven across the asset basket.",
      "Simulated sentiment is crowded; a failed breakout is plausible.",
    ],
    evidence: [
      "OHLCV fixture · snapshot 08:00 UTC",
      "Volume study · 48 simulated bars",
      "Sentiment fixture · synthetic balanced sample",
    ],
    invalidation:
      "A close below support with rising sell volume invalidates the long thesis.",
    createdAt: INITIAL_TIME,
  },
];
export const INITIAL_AGENTS: Agent[] = [
  {
    id: "technical",
    name: "Technical Analyst",
    role: "Price action & structure",
    status: "running",
    task: "Reviewing BTC support retest",
    output:
      "Higher lows persist above the short-term EMA. Resistance remains overhead.",
    duration: 1.8,
    lastRun: INITIAL_TIME,
  },
  {
    id: "intelligence",
    name: "Market Intelligence",
    role: "Catalysts & market context",
    status: "running",
    task: "Cross-checking fixture catalysts",
    output:
      "Synthetic catalyst fixture is neutral. No real news feed is connected.",
    duration: 2.4,
    lastRun: INITIAL_TIME,
  },
  {
    id: "sentiment",
    name: "Sentiment Analyst",
    role: "Positioning & sentiment",
    status: "idle",
    task: "Awaiting next analysis cycle",
    output:
      "Synthetic sentiment score 62/100. Sample is fictional and uncalibrated.",
    duration: 1.2,
    lastRun: INITIAL_TIME,
  },
  {
    id: "bull",
    name: "Bull Research Agent",
    role: "Constructive thesis",
    status: "running",
    task: "Testing bullish continuation",
    output:
      "Trend and support favor continuation if volume confirms the breakout.",
    duration: 2.1,
    lastRun: INITIAL_TIME,
  },
  {
    id: "bear",
    name: "Bear Research Agent",
    role: "Counter-thesis & downside",
    status: "running",
    task: "Testing invalidation conditions",
    output: "Resistance and crowded sentiment increase failed-breakout risk.",
    duration: 2.0,
    lastRun: INITIAL_TIME,
  },
  {
    id: "risk",
    name: "Risk Manager",
    role: "Hard limits & exposure",
    status: "running",
    task: "Monitoring paper ledger limits",
    output:
      "New orders require deterministic risk checks. No real funds are connected.",
    duration: 0.4,
    lastRun: INITIAL_TIME,
  },
  {
    id: "manager",
    name: "Strategy Manager",
    role: "Evidence consolidation",
    status: "idle",
    task: "Awaiting review of pending signals",
    output:
      "Selective long bias. Prefer smaller entries while agents disagree.",
    duration: 1.6,
    lastRun: INITIAL_TIME,
  },
];
export const INITIAL_SIGNALS: Signal[] = INITIAL_ASSETS.slice(0, 5).map(
  (asset, i) => ({
    id: `sig-${String(i + 1).padStart(3, "0")}`,
    assetId: asset.id,
    direction: i === 3 ? "SELL" : i === 4 ? "HOLD" : "BUY",
    strategyId: ["multi", "ema", "breakout", "momentum", "rsi"][i],
    analysisId: "analysis-001",
    entry: asset.price,
    stopLoss: asset.price * (i === 3 ? 1.02 : 0.98),
    takeProfit: asset.price * (i === 3 ? 0.95 : 1.06),
    strength: [82, 76, 88, 64, 57][i],
    createdAt: new Date(Date.parse(INITIAL_TIME) - i * 180000).toISOString(),
    status: "pending",
  }),
);
export function getCandles(
  assetId: string,
  timeframe: Timeframe = "1H",
  step = 0,
): Candle[] {
  const asset =
    INITIAL_ASSETS.find((item) => item.id === assetId) ?? INITIAL_ASSETS[0];
  const interval = {
    "15M": 900,
    "1H": 3600,
    "4H": 14400,
    "1D": 86400,
    "1W": 604800,
  }[timeframe];
  const end =
    Math.floor((Date.parse(INITIAL_TIME) / 1000 + step * 60) / interval) *
    interval;
  const index = INITIAL_ASSETS.indexOf(asset);
  return Array.from({ length: 96 }, (_, i) => {
    const curve = (n: number) =>
      asset.price *
      (0.965 +
        n * 0.00032 +
        Math.sin(n * 0.32 + index) * 0.006 +
        Math.sin(n * 0.89 + step * 0.08) * 0.002);
    const open = curve(i);
    const close = curve(i + 1);
    return {
      time: end - (95 - i) * interval,
      open,
      close,
      high: Math.max(open, close) * (1.001 + Math.abs(Math.sin(i)) * 0.001),
      low: Math.min(open, close) * (0.999 - Math.abs(Math.cos(i)) * 0.001),
      volume:
        (asset.volume / 96 / asset.price) *
        (0.5 + Math.abs(Math.sin(i * 1.7 + index))),
    };
  });
}
export function simulatedAssets(step: number, multiplier = 1): Asset[] {
  return INITIAL_ASSETS.map((asset, i) => ({
    ...asset,
    price:
      asset.price *
      multiplier *
      (1 + Math.sin(step * 0.7 + i) * 0.0025 - Math.sin(i) * 0.0025),
    change: asset.change + Math.sin(step * 0.7) * 0.36,
  }));
}
export const ASSET_IDS: AssetId[] = INITIAL_ASSETS.map((asset) => asset.id);
