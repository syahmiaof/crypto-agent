"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  Database,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { calculatePortfolio, INITIAL_CAPITAL } from "@/lib/finance";
import {
  getDemoReply,
  parseChatHistory,
  STARTER_PROMPTS,
  type AssistantContext,
  type ChatMessage,
} from "@/lib/assistant";
import {
  Badge,
  Button,
  ConfirmDialog,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import "../agents/agents.css";

const STORAGE_KEY = "mission-control-demo-chat-v1";
const CHAT_EVENT = "mission-control-chat-changed";
let memoryHistory = "";
function readHistory() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memoryHistory;
  } catch {
    return memoryHistory;
  }
}
function subscribeHistory(listener: () => void) {
  window.addEventListener(CHAT_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHAT_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
function writeHistory(messages: ChatMessage[]) {
  memoryHistory = JSON.stringify(messages.slice(-80));
  let persisted = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, memoryHistory);
  } catch {
    persisted = false;
  }
  window.dispatchEvent(new Event(CHAT_EVENT));
  return persisted;
}
const serverHistory = () => "";

export default function AssistantPage() {
  const state = useDemoStore();
  const rawHistory = useSyncExternalStore(
    subscribeHistory,
    readHistory,
    serverHistory,
  );
  const messages = useMemo(() => parseChatHistory(rawHistory), [rawHistory]);
  const [input, setInput] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const previousMessageCount = useRef(messages.length);
  const portfolio = calculatePortfolio(state);
  const context: AssistantContext = {
    timestamp: state.clock,
    scenario: state.scenario,
    signals: state.signals.map((signal) => {
      const analysis = state.analyses.find(
        (item) => item.id === signal.analysisId,
      );
      return {
        id: signal.id,
        symbol: `${signal.assetId}/USDT`,
        side: signal.direction,
        confidence: signal.strength,
        status: signal.status,
        explanation:
          signal.reason ??
          analysis?.summary ??
          "No supporting analysis is available.",
        invalidation: analysis?.invalidation ?? "No invalidation is recorded.",
      };
    }),
    agents: state.agents,
    events: state.events,
    portfolio: {
      equity: portfolio.equity,
      initialCapital: INITIAL_CAPITAL,
      realizedPnl: portfolio.realizedPnl,
      unrealizedPnl: portfolio.unrealizedPnl,
      orderCount: state.orders.length,
    },
    risk: {
      emergencyStop: state.emergencyStop,
      maxPositionPct: state.risk.maxPositionPct,
      maxExposurePct: state.risk.maxExposurePct,
    },
  };
  useEffect(() => {
    if (messages.length > previousMessageCount.current)
      endRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
    previousMessageCount.current = messages.length;
  }, [messages.length]);

  function ask(question: string) {
    const text = question.trim().slice(0, 1000);
    if (!text) return;
    const reply = getDemoReply(text, context);
    const id = crypto.randomUUID();
    const updated: ChatMessage[] = [
      ...messages,
      { id: `${id}-user`, role: "user", text, timestamp: state.clock },
      {
        id: `${id}-assistant`,
        role: "assistant",
        text: reply.text,
        references: reply.references,
        followUps: reply.followUps,
        timestamp: state.clock,
      },
    ];
    const saved = writeHistory(updated);
    setNotice(
      saved
        ? ""
        : "Browser storage is unavailable. This conversation is retained only for this session.",
    );
    setInput("");
    composerRef.current?.focus();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }
  async function copyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(message.id);
      setNotice("Response copied.");
    } catch {
      setNotice(
        "Clipboard access is unavailable. Select the response text to copy it.",
      );
    }
  }

  return (
    <div className="assistant-page stack">
      <PageHeader
        title="Ask your trading AI"
        description="Trace decisions back to the data, debate, and risk controls."
      >
        <Badge tone="info">Demo assistant mode</Badge>
        <Button
          variant="ghost"
          disabled={!messages.length}
          onClick={() => setClearOpen(true)}
        >
          <Trash2 size={15} /> Clear conversation
        </Button>
      </PageHeader>
      <div className="assistant-layout">
        <section
          className="assistant-conversation panel"
          aria-label="Demo assistant conversation"
        >
          <div className="assistant-topline">
            <div className="assistant-identity">
              <span className="agent-avatar">
                <Bot size={19} />
              </span>
              <div>
                <strong>Mission assistant</strong>
                <span className="muted">
                  Deterministic answers · local context
                </span>
              </div>
            </div>
            <span className="assistant-connected">
              <span /> Ready
            </span>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {!messages.length && (
              <div className="chat-welcome">
                <span className="chat-welcome-icon">
                  <MessageSquare size={25} />
                </span>
                <span className="eyebrow">YOUR RESEARCH, CONNECTED</span>
                <h2>
                  Understand the decision.
                  <br />
                  Before you make yours.
                </h2>
                <p>
                  Explore the current paper portfolio, inspect a signal, or
                  challenge the research consensus.
                </p>
                <div className="starter-prompts">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button key={prompt} onClick={() => ask(prompt)}>
                      {prompt}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <article
                className={`chat-message chat-${message.role}`}
                key={message.id}
              >
                <div className="message-meta">
                  <strong>
                    {message.role === "assistant" ? "Mission assistant" : "You"}
                  </strong>
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString("en-GB", {
                      timeZone: "UTC",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    UTC
                  </span>
                  {message.role === "assistant" && (
                    <Badge tone="neutral">Demo</Badge>
                  )}
                </div>
                <div className="message-text">{message.text}</div>
                {Boolean(message.references?.length) && (
                  <div className="message-references">
                    {message.references?.map((reference) => (
                      <Link
                        key={reference.href + reference.label}
                        href={reference.href}
                      >
                        {reference.label}
                        <ArrowUpRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
                {message.role === "assistant" && (
                  <button
                    className="copy-response"
                    aria-label="Copy response"
                    onClick={() => void copyMessage(message)}
                  >
                    {copied === message.id ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}{" "}
                    {copied === message.id ? "Copied" : "Copy response"}
                  </button>
                )}
              </article>
            ))}
            <div ref={endRef} />
          </div>
          {!!messages.length && (
            <div className="followup-prompts">
              {messages.at(-1)?.followUps?.map((prompt) => (
                <button key={prompt} onClick={() => ask(prompt)}>
                  {prompt}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          )}
          <form className="chat-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="assistant-question">
              Ask about your simulated trading workspace
            </label>
            <textarea
              id="assistant-question"
              ref={composerRef}
              rows={2}
              value={input}
              maxLength={1000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a signal, research, or your paper account…"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  ask(input);
                }
              }}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!input.trim()}
              aria-label="Send question"
            >
              <ArrowUp size={17} />
            </Button>
            <div className="composer-caption">
              <span>Seeded responses. No live AI or financial advice.</span>
              <span>Enter to send · Shift + Enter for newline</span>
            </div>
          </form>
        </section>
        <aside className="assistant-context stack">
          <Panel title="Workspace context" action={<Database size={16} />}>
            <div className="assistant-context-body">
              <span className="eyebrow">CURRENT LOCAL SNAPSHOT</span>
              <h3>{state.scenario.replaceAll("-", " ")}</h3>
              <dl className="context-facts">
                <div>
                  <dt>Paper equity</dt>
                  <dd>
                    {portfolio.equity.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USDT
                  </dd>
                </div>
                <div>
                  <dt>Pending signals</dt>
                  <dd>
                    {
                      state.signals.filter(
                        (signal) => signal.status === "pending",
                      ).length
                    }
                  </dd>
                </div>
                <div>
                  <dt>Running agents</dt>
                  <dd>
                    {
                      state.agents.filter((agent) => agent.status === "running")
                        .length
                    }{" "}
                    / 7
                  </dd>
                </div>
                <div>
                  <dt>Last simulation update</dt>
                  <dd>
                    {new Date(state.clock).toLocaleTimeString("en-GB", {
                      timeZone: "UTC",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    UTC
                  </dd>
                </div>
              </dl>
              <Link href="/portfolio">
                Open paper account <ArrowUpRight size={14} />
              </Link>
            </div>
          </Panel>
          <Panel title="Decision references">
            <div className="assistant-context-links">
              <Link href="/signals">
                <span>
                  <strong>Signal evidence</strong>
                  <small>Entry, exit and invalidation</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
              <Link href="/agents#debate">
                <span>
                  <strong>Research debate</strong>
                  <small>Constructive and opposing views</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
              <Link href="/risk">
                <span>
                  <strong>Risk controls</strong>
                  <small>Current limits and execution gates</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Panel>
          <div className="assistant-boundary">
            <ShieldCheck size={18} />
            <div>
              <strong>Bounded by your workspace</strong>
              <p>
                Answers use the local seeded dataset at send time. Existing
                replies preserve their original snapshot. No exchange access,
                external news, or order execution.
              </p>
              <p>History is stored in this browser; clear it anytime.</p>
            </div>
          </div>
        </aside>
      </div>
      <p className="assistant-notice" role="status">
        {notice}
      </p>
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear this conversation?"
        description="All locally saved messages in this conversation will be removed. Your paper portfolio and audit records remain available."
        danger
        onConfirm={() => {
          writeHistory([]);
          setNotice("Conversation cleared.");
        }}
      />
    </div>
  );
}
