import { describe, expect, it } from "vitest";
import { getCandles, getEMA } from "../lib/candles";

describe("deterministic simulated market history", () => {
  it("reproduces a history with an exact current quote", () => {
    const candles = getCandles("BTC", 67432, "1H", 0);
    expect(candles).toEqual(getCandles("BTC", 67432, "1H", 0));
    expect(candles.at(-1)?.close).toBe(67432);
    for (const candle of candles) {
      expect(candle.low).toBeLessThanOrEqual(
        Math.min(candle.open, candle.close),
      );
      expect(candle.high).toBeGreaterThanOrEqual(
        Math.max(candle.open, candle.close),
      );
      expect(candle.low).toBeGreaterThan(0);
      expect(candle.volume).toBeGreaterThan(0);
    }
  });

  it("uses ordered timestamps at the chosen timeframe and simulated step", () => {
    const initial = getCandles("ETH", 3521, "4H", 0);
    const updated = getCandles("ETH", 3525, "4H", 240);
    expect(initial[1].time - initial[0].time).toBe(14400);
    expect(updated.at(-1)!.time - initial.at(-1)!.time).toBe(14400);
    expect(updated.at(-1)!.close).toBe(3525);
    expect(
      getCandles("ETH", 3521, "1D", 0)[1].time -
        getCandles("ETH", 3521, "1D", 0)[0].time,
    ).toBe(86400);
    expect(
      new Date(
        getCandles("ETH", 3521, "1W", 0).at(-1)!.time * 1000,
      ).getUTCDay(),
    ).toBe(1);
    expect(getCandles("ETH", 3525, "4H", 1).at(-1)!.time).toBe(
      initial.at(-1)!.time,
    );
  });

  it("rejects invalid prices and keeps EMA numerically bounded", () => {
    expect(getCandles("BTC", Number.NaN, "1H", 0)).toEqual([]);
    expect(getCandles("BTC", 0, "1H", 0)).toEqual([]);
    const candles = getCandles("BTC", 67432, "1H", 0);
    const ema = getEMA(candles);
    expect(ema).toHaveLength(candles.length);
    expect(ema.every(({ value }) => Number.isFinite(value) && value > 0)).toBe(
      true,
    );
    expect(ema[0].value).toBe(candles[0].close);
  });
});
