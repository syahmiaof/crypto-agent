export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const intervals: Record<string, number> = {
  "5m": 300,
  "15m": 900,
  "1h": 3_600,
  "4h": 14_400,
  "1d": 86_400,
  "1w": 604_800,
};

/** All charts share an explicitly simulated clock, independent of the device date. */
export const SIMULATION_EPOCH = Date.UTC(2026, 9, 20, 8, 0, 0) / 1_000;

function seedFor(value: string): number {
  let seed = 2_166_136_261;
  for (let index = 0; index < value.length; index++) {
    seed = Math.imul(seed ^ value.charCodeAt(index), 16_777_619);
  }
  return seed >>> 0;
}

function randomGenerator(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Seeded illustrative OHLCV history; the final close always equals the current quote. */
export function getCandles(
  assetId: string,
  price: number,
  timeframe: string,
  step: number,
): Candle[] {
  if (!Number.isFinite(price) || price <= 0) return [];
  const interval = intervals[timeframe.toLowerCase()] ?? intervals["1h"];
  const tick = Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0;
  const random = randomGenerator(
    seedFor(`${assetId}:${timeframe.toLowerCase()}`),
  );
  const count = 120;
  const anchor = interval === 604_800 ? 345_600 : 0; // Weekly bars open Monday, 00:00 UTC.
  const end =
    Math.floor((SIMULATION_EPOCH + tick * 60 - anchor) / interval) * interval +
    anchor;
  const volatility = Math.min(0.018, 0.003 * Math.sqrt(interval / 3_600));
  const raw: Candle[] = [];
  let previous = 1;
  for (let index = 0; index < count; index++) {
    const open = previous;
    const cycle = Math.sin(index * 0.14) * volatility * 0.25;
    const close = Math.max(
      0.01,
      open * (1 + (random() - 0.45) * volatility + cycle),
    );
    const high = Math.max(open, close) * (1 + random() * volatility * 0.65);
    const low = Math.min(open, close) * (1 - random() * volatility * 0.65);
    raw.push({
      time: end - (count - 1 - index) * interval,
      open,
      high,
      low,
      close,
      volume: Math.round(
        (60 + random() * 190 + Math.abs(close - open) * 90_000) *
          Math.sqrt(interval / 3_600),
      ),
    });
    previous = close;
  }
  const scale = price / raw[raw.length - 1].close;
  return raw.map((candle, index) => ({
    ...candle,
    open: candle.open * scale,
    high: candle.high * scale,
    low: candle.low * scale,
    close: index === count - 1 ? price : candle.close * scale,
  }));
}

export function getEMA(
  candles: Candle[],
  period = 20,
): { time: number; value: number }[] {
  if (!candles.length) return [];
  const smoothing = 2 / (Math.max(1, period) + 1);
  let previous = candles[0].close;
  return candles.map(({ time, close }) => {
    previous = close * smoothing + previous * (1 - smoothing);
    return { time, value: previous };
  });
}
