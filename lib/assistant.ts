import { ASSET_IDS } from "../data/fixtures";
const assetPattern = new RegExp(
  `\\b(${[...ASSET_IDS, "BNB", "XRP", "DOGE"].join("|")})\\b`,
  "i",
);
export interface AssistantReference {
  label: string;
  href: string;
}

export interface AssistantReply {
  text: string;
  references: AssistantReference[];
  followUps: string[];
}

export interface AssistantContext {
  timestamp: string;
  scenario: string;
  signals: {
    id: string;
    symbol: string;
    side: string;
    confidence: number;
    status: string;
    explanation: string;
    invalidation: string;
  }[];
  agents: { id: string; name: string; status: string; output: string }[];
  events: { id: string; type: string; summary: string; timestamp: string }[];
  portfolio: {
    equity: number;
    initialCapital: number;
    realizedPnl: number;
    unrealizedPnl: number;
    orderCount: number;
  };
  risk: {
    emergencyStop: boolean;
    maxPositionPct: number;
    maxExposurePct: number;
  };
}

export const STARTER_PROMPTS = [
  "Explain the latest BTC signal.",
  "Why is the market outlook bearish?",
  "Show my recent paper trading performance.",
  "Which agent disagreed with the current decision?",
  "Summarize today's simulated risk events.",
] as const;

const amount = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Pure deterministic provider. Replace behind an authenticated server boundary for real inference. */
export function getDemoReply(
  prompt: string,
  context: AssistantContext,
): AssistantReply {
  const query = prompt.toLowerCase();
  const suffix = `\n\nSource: current local simulation snapshot (${context.timestamp}). No live market feed or LLM inference.`;
  const reply = (
    text: string,
    references: AssistantReference[],
    followUps: string[],
  ): AssistantReply => ({ text: text + suffix, references, followUps });

  if (/performance|profit|pnl|p&l|portfolio|return|balance/.test(query)) {
    const p = context.portfolio;
    const net = p.equity - p.initialCapital;
    const percentage =
      p.initialCapital > 0 ? (net / p.initialCapital) * 100 : 0;
    return reply(
      `Your paper account equity is ${amount(p.equity)} USDT against ${amount(p.initialCapital)} USDT initial capital. Net paper P&L is ${net >= 0 ? "+" : ""}${amount(net)} USDT (${percentage.toFixed(2)}%).\n\nRealized P&L: ${amount(p.realizedPnl)} USDT. Unrealized P&L: ${amount(p.unrealizedPnl)} USDT. Recorded paper orders: ${p.orderCount}. This describes the local demo account; it is not a live or verified investment return.`,
      [
        { label: "Open paper portfolio", href: "/portfolio" },
        { label: "Inspect order audit", href: "/activity" },
      ],
      [STARTER_PROMPTS[4], STARTER_PROMPTS[0]],
    );
  }

  if (/disagree|agent|debate|dissent/.test(query)) {
    const researchers = context.agents.filter((a) =>
      /bull|bear|risk|strategy/.test(a.name.toLowerCase()),
    );
    const body = researchers
      .map((a) => `${a.name} (${a.status}): ${a.output}`)
      .join("\n\n");
    return reply(
      `The current scenario is ${context.scenario}. Research opinions are preserved separately so confidence is not mistaken for consensus.\n\n${body || "No researcher outputs are available in this snapshot."}\n\nPaused agents retain their last output; those outputs are not a fresh analysis.`,
      researchers.map((a) => ({
        label: a.name,
        href: `/agents?agent=${encodeURIComponent(a.id)}`,
      })),
      [STARTER_PROMPTS[0], STARTER_PROMPTS[4]],
    );
  }

  if (/risk|stop|limit|event|safe|exposure/.test(query)) {
    const date = context.timestamp.slice(0, 10);
    const events = context.events.filter(
      (e) =>
        /risk|emergency|block/.test(`${e.type} ${e.summary}`.toLowerCase()) &&
        e.timestamp.slice(0, 10) === date,
    );
    const summaries = events
      .slice(0, 5)
      .map((e) => `• ${e.summary}`)
      .join("\n");
    return reply(
      `Emergency stop is ${context.risk.emergencyStop ? "ACTIVE: new paper orders are blocked" : "released"}. The configured maximum position is ${context.risk.maxPositionPct}% of equity; the maximum total exposure is ${context.risk.maxExposurePct}%.\n\n${events.length ? `${events.length} risk-related audit event(s) recorded on snapshot date ${date}:\n${summaries}` : `No risk-related audit events are recorded on snapshot date ${date}. That does not establish that an order is safe; the risk engine checks each proposed order.`}`,
      [
        { label: "Review risk controls", href: "/risk" },
        { label: "Inspect risk audit", href: "/activity" },
      ],
      [STARTER_PROMPTS[2], STARTER_PROMPTS[0]],
    );
  }

  if (/bear|outlook|market|bull|trend/.test(query) && !/signal/.test(query)) {
    const bear = context.agents.find((a) => /bear/.test(a.name.toLowerCase()));
    const bull = context.agents.find((a) => /bull/.test(a.name.toLowerCase()));
    return reply(
      `The loaded scenario is ${context.scenario}; a bearish question does not make the snapshot bearish.\n\nBear case: ${bear?.output ?? "No bearish output in this snapshot."}\n\nBull case: ${bull?.output ?? "No bullish output in this snapshot."}\n\nThese are fixture-based research summaries with opposing interpretations, not a price forecast. Review the shared evidence and invalidation conditions before acting on a paper signal.`,
      [
        { label: "Inspect both research cases", href: "/agents#debate" },
        { label: "Review signal queue", href: "/signals" },
      ],
      [STARTER_PROMPTS[3], STARTER_PROMPTS[0]],
    );
  }

  if (/signal|buy|sell|trade/.test(query) || assetPattern.test(query)) {
    const requested = query.match(assetPattern)?.[1]?.toUpperCase() ?? "BTC";
    const signal = context.signals.find((s) =>
      s.symbol.toUpperCase().startsWith(requested),
    );
    if (!signal)
      return reply(
        `There is no ${requested} signal in the current local snapshot. I cannot infer a signal or its rationale from missing data.`,
        [{ label: "Browse available signals", href: "/signals" }],
        [STARTER_PROMPTS[2], STARTER_PROMPTS[4]],
      );
    return reply(
      `${signal.id} · ${signal.symbol} · ${signal.side} · ${signal.status}\n\nEvidence strength is ${signal.confidence}/100; this is a simulated score, not a probability of profit. ${signal.explanation}\n\nInvalidation: ${signal.invalidation}\n\n${context.risk.emergencyStop ? "Emergency stop is active, so new paper execution is blocked." : "Any paper execution still requires approval and the current risk checks."}`,
      [
        {
          label: `Inspect ${signal.id}`,
          href: `/signals?signal=${encodeURIComponent(signal.id)}`,
        },
        { label: "Research disagreement", href: "/agents#debate" },
        { label: "Current risk limits", href: "/risk" },
      ],
      [STARTER_PROMPTS[3], STARTER_PROMPTS[4]],
    );
  }

  return reply(
    "I can explain the seeded signals, research disagreement, paper-account performance, and current risk events. This deterministic demo does not browse the web, predict prices, or execute orders. Try one of the context questions below.",
    [{ label: "Open current signals", href: "/signals" }],
    [STARTER_PROMPTS[0], STARTER_PROMPTS[2], STARTER_PROMPTS[4]],
  );
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  references?: AssistantReference[];
  followUps?: string[];
}

export function parseChatHistory(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((message): message is ChatMessage => {
        if (!message || typeof message !== "object") return false;
        const m = message as Partial<ChatMessage>;
        return (
          typeof m.id === "string" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.text === "string" &&
          typeof m.timestamp === "string" &&
          (m.references === undefined ||
            (Array.isArray(m.references) &&
              m.references.every(
                (r) =>
                  r &&
                  typeof r.label === "string" &&
                  typeof r.href === "string" &&
                  /^\/(signals|agents|risk|activity|portfolio)(\?|#|$)/.test(
                    r.href,
                  ),
              ))) &&
          (m.followUps === undefined ||
            (Array.isArray(m.followUps) &&
              m.followUps.every((f) => typeof f === "string")))
        );
      })
      .slice(-80);
  } catch {
    return [];
  }
}
