import { describe, expect, it } from "vitest";
import {
  getDemoReply,
  parseChatHistory,
  type AssistantContext,
} from "../lib/assistant";

const context: AssistantContext = {
  timestamp: "2026-10-20T08:00:00.000Z",
  scenario: "bullish",
  signals: [
    {
      id: "sig-001",
      symbol: "BTC/USDT",
      side: "BUY",
      confidence: 82,
      status: "pending",
      explanation: "Fixture volume confirms the retest.",
      invalidation: "Close below fixture support.",
    },
  ],
  agents: [
    {
      id: "bull",
      name: "Bull Research Agent",
      status: "running",
      output: "Trend supports continuation.",
    },
    {
      id: "bear",
      name: "Bear Research Agent",
      status: "paused",
      output: "Resistance could reject price.",
    },
  ],
  events: [
    {
      id: "event-1",
      type: "risk",
      summary: "Order blocked: position limit.",
      timestamp: "2026-10-20T07:00:00.000Z",
    },
    {
      id: "event-2",
      type: "risk",
      summary: "Prior-day event.",
      timestamp: "2026-10-19T07:00:00.000Z",
    },
  ],
  portfolio: {
    equity: 10020,
    initialCapital: 10000,
    realizedPnl: 10,
    unrealizedPnl: 10,
    orderCount: 2,
  },
  risk: { emergencyStop: false, maxPositionPct: 20, maxExposurePct: 60 },
};

describe("deterministic assistant", () => {
  it("routes LINK to its own evidence and never silently substitutes BTC", () => {
    const linked = {
      ...context,
      signals: [
        ...context.signals,
        {
          ...context.signals[0],
          id: "sig-link",
          symbol: "LINK/USDT",
          side: "HOLD" as const,
          explanation: "LINK fixture is neutral.",
        },
      ],
    };
    const result = getDemoReply("Explain the latest LINK signal.", linked);
    expect(result.text).toContain("sig-link");
    expect(result.text).toContain("LINK fixture is neutral.");
    expect(result.text).not.toContain("BTC/USDT");
    expect(getDemoReply("Explain LINK signal", context).text).toContain(
      "no LINK signal",
    );
  });
  it("grounds latest signal explanation and link in current data", () => {
    const result = getDemoReply("Explain the latest BTC signal.", context);
    expect(result.text).toContain("sig-001");
    expect(result.text).toContain("Fixture volume confirms the retest.");
    expect(result.text).toContain("Close below fixture support.");
    expect(result.references[0].href).toBe("/signals?signal=sig-001");
    expect(getDemoReply("Explain the latest BTC signal.", context)).toEqual(
      result,
    );
  });

  it("updates answer when current risk state changes", () => {
    const result = getDemoReply("Explain the BTC signal", {
      ...context,
      risk: { ...context.risk, emergencyStop: true },
    });
    expect(result.text).toContain("Emergency stop is active");
  });

  it("does not invent a signal for an absent symbol", () => {
    expect(getDemoReply("Explain ETH signal", context).text).toContain(
      "There is no ETH signal",
    );
  });

  it("does not accept the prompt premise when the scenario is bullish", () => {
    const result = getDemoReply("Why is the outlook bearish?", context);
    expect(result.text).toContain("loaded scenario is bullish");
    expect(result.text).toContain("Resistance could reject price.");
  });

  it("computes portfolio return from equity and initial capital", () => {
    const result = getDemoReply("Show my performance", context);
    expect(result.text).toContain("10,020.00 USDT");
    expect(result.text).toContain("+20.00 USDT (0.20%)");
  });

  it("filters risk events to snapshot date and includes current limits", () => {
    const result = getDemoReply("Summarize today's risk events", context);
    expect(result.text).toContain("Order blocked: position limit.");
    expect(result.text).not.toContain("Prior-day event.");
    expect(result.text).toContain("20%");
  });

  it("labels retained output for paused agents", () => {
    const result = getDemoReply("Which agent disagreed?", context);
    expect(result.text).toContain("Bear Research Agent (paused)");
    expect(result.text).toContain("not a fresh analysis");
  });

  it("rejects malformed history and unsafe references", () => {
    expect(parseChatHistory("{malformed")).toEqual([]);
    expect(
      parseChatHistory(
        JSON.stringify([
          {
            id: "1",
            role: "assistant",
            text: "bad",
            timestamp: context.timestamp,
            references: [{ label: "link", href: "javascript:alert(1)" }],
          },
        ]),
      ),
    ).toEqual([]);
    expect(
      parseChatHistory(
        JSON.stringify([
          {
            id: "1",
            role: "assistant",
            text: "good",
            timestamp: context.timestamp,
            references: [{ label: "risk", href: "/risk" }],
          },
        ]),
      ),
    ).toHaveLength(1);
  });
});
