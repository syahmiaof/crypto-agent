"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  ChevronRight,
  FlaskConical,
  GitBranch,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import "./agents.css";

const time = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const scenarios = [
  {
    id: "bullish",
    label: "Bullish breakout",
    description: "Continuation with volume confirmation",
  },
  {
    id: "bearish",
    label: "Bearish reversal",
    description: "Pressure-test downside conditions",
  },
  {
    id: "stress",
    label: "Volatility spike",
    description: "Elevated uncertainty and risk",
  },
];

export default function AgentsPage() {
  const state = useDemoStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("agent");
    if (id) {
      const handle = window.setTimeout(() => setSelected(id), 0);
      return () => window.clearTimeout(handle);
    }
  }, []);
  const agent = state.agents.find((item) => item.id === selected);
  const analysis = state.analyses[0];
  const running = state.agents.filter(
    (item) => item.status === "running",
  ).length;
  const manager = state.agents.find((item) => item.id === "manager");
  const risk = state.agents.find((item) => item.id === "risk");
  const history = state.events.filter(
    (event) =>
      event.type === "agent" &&
      (historyFilter === "all" ||
        event.entityId === historyFilter ||
        event.source ===
          state.agents.find((item) => item.id === historyFilter)?.name),
  );

  return (
    <div className="agents-page stack">
      <PageHeader
        title="AI Agent War Room"
        description="Seven specialist perspectives. One accountable paper decision."
      >
        <Badge tone="info">Demo Engine</Badge>
        <Badge tone="positive">{running} / 7 running</Badge>
      </PageHeader>
      <div className="agent-workflow" aria-label="Analysis workflow">
        {[
          "Market data",
          "Analysts",
          "Bull / Bear review",
          "Strategy manager",
          "Risk review",
          "Signal queue",
        ].map((step, index) => (
          <div key={step}>
            <span
              className={
                index === 4 ? "workflow-node risk-node" : "workflow-node"
              }
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{step}</span>
            {index < 5 && <ChevronRight size={15} />}
          </div>
        ))}
      </div>
      <div className="agent-roster">
        {state.agents.map((item) => (
          <article
            className={`agent-card ${item.status === "paused" ? "agent-paused" : ""}`}
            key={item.id}
          >
            <div className="agent-card-top">
              <span className="agent-avatar">
                {item.id === "risk" ? (
                  <ShieldCheck size={19} />
                ) : item.id === "manager" ? (
                  <GitBranch size={19} />
                ) : (
                  <Bot size={19} />
                )}
              </span>
              <Badge
                tone={
                  item.status === "running"
                    ? "positive"
                    : item.status === "paused"
                      ? "warning"
                      : "neutral"
                }
              >
                {item.status}
              </Badge>
            </div>
            <button className="agent-name" onClick={() => setSelected(item.id)}>
              {item.name}
              <ArrowRight size={14} />
            </button>
            <p className="agent-role muted">{item.role}</p>
            <p className="agent-task">{item.task}</p>
            <div className="agent-card-meta">
              <span>Demo Engine</span>
              <span>{item.duration.toFixed(1)}s avg. simulated</span>
            </div>
            <div className="agent-card-footer">
              <span className="muted">{time(item.lastRun)} UTC</span>
              <Button
                variant="ghost"
                aria-label={`View ${item.name} details`}
                onClick={() => setSelected(item.id)}
              >
                Details <ChevronRight size={13} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <Panel
        title="Scenario console"
        action={<Badge tone="neutral">Current: {state.scenario}</Badge>}
      >
        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              className="scenario-button"
              onClick={() => {
                state.runScenario(scenario.id);
                setNotice(
                  `${scenario.label} fixture loaded. Review the updated research and signal queue.`,
                );
              }}
            >
              <FlaskConical size={18} />
              <span>
                <strong>{scenario.label}</strong>
                <small>{scenario.description}</small>
              </span>
              <Play size={14} />
            </button>
          ))}
        </div>
        <p className="scenario-footnote muted">
          Predefined fixture replay. No model inference. Paused specialists
          retain their previous output.
        </p>
        <p className="sr-only" aria-live="polite">
          {notice}
        </p>
      </Panel>
      <Panel
        title="The debate arena"
        action={<Badge tone="info">Evidence, not unanimity</Badge>}
        className="debate-panel"
      >
        <div id="debate" className="debate-grid">
          <section className="debate-side">
            <div className="debate-heading">
              <span className="thesis-marker positive">↗</span>
              <div>
                <span className="eyebrow">CONSTRUCTIVE CASE</span>
                <h3>Bull research</h3>
              </div>
            </div>
            <p className="debate-current">
              {state.agents.find((item) => item.id === "bull")?.output}
            </p>
            <span className="eyebrow">SCENARIO EVIDENCE</span>
            <ul>
              {analysis.bullish.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
          <section className="debate-evidence">
            <span className="eyebrow">SHARED SOURCE MATERIAL</span>
            <h3>
              Same evidence.
              <br />
              Different conclusions.
            </h3>
            <p className="muted">
              Research rubric scores express evidence strength, not a calibrated
              chance of profit.
            </p>
            {analysis.evidence.map((evidence, index) => (
              <div className="evidence-row" key={evidence}>
                <span className="mono muted">0{index + 1}</span>
                <span>{evidence}</span>
              </div>
            ))}
            <div className="evidence-source">
              <span>{analysis.id}</span>
              <span>{time(analysis.createdAt)} UTC · scenario fixture</span>
            </div>
          </section>
          <section className="debate-side">
            <div className="debate-heading">
              <span className="thesis-marker negative">↘</span>
              <div>
                <span className="eyebrow">COUNTER-THESIS</span>
                <h3>Bear research</h3>
              </div>
            </div>
            <p className="debate-current">
              {state.agents.find((item) => item.id === "bear")?.output}
            </p>
            <span className="eyebrow">SCENARIO EVIDENCE</span>
            <ul>
              {analysis.bearish.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        </div>
        <div className="decision-grid">
          <section>
            <div className="decision-label">
              <GitBranch size={16} />
              <strong>Coordinator decision</strong>
            </div>
            <p>{manager?.output}</p>
            <Link href="/signals">
              Review suggested paper signals <ArrowRight size={14} />
            </Link>
          </section>
          <section>
            <div className="decision-label">
              <ShieldCheck size={16} />
              <strong>Risk verdict</strong>
            </div>
            <p>
              {state.emergencyStop
                ? "Emergency stop is active. All new paper orders are blocked."
                : risk?.output}
            </p>
            <Link href="/risk">
              Inspect active risk limits <ArrowRight size={14} />
            </Link>
          </section>
          <section>
            <div className="decision-label">
              <Activity size={16} />
              <strong>Thesis invalidation</strong>
            </div>
            <p>{analysis.invalidation}</p>
            <span className="muted">
              Reassess the fixture thesis when conditions change.
            </span>
          </section>
        </div>
      </Panel>
      <Panel
        title="Task history"
        action={
          <label className="agent-filter">
            <span className="sr-only">Filter task history by agent</span>
            <select
              aria-label="Filter task history by agent"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value)}
            >
              <option value="all">All specialists</option>
              {state.agents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        }
      >
        {history.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time (UTC)</th>
                  <th>Source</th>
                  <th>Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((event) => (
                  <tr key={event.id}>
                    <td className="mono">{time(event.timestamp)}</td>
                    <td>{event.source}</td>
                    <td>{event.summary}</td>
                    <td>
                      <Badge
                        tone={
                          event.severity === "warning" ? "warning" : "neutral"
                        }
                      >
                        {event.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No matching tasks yet"
            description="Run a scenario or change a specialist's state to create a traceable audit event."
          />
        )}
      </Panel>
      <Drawer
        open={Boolean(agent)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={agent?.name ?? "Agent details"}
      >
        {agent && (
          <div className="stack">
            <div className="agent-detail-status">
              <Badge tone={agent.status === "running" ? "positive" : "warning"}>
                {agent.status}
              </Badge>
              <span className="muted">
                Demo Engine · deterministic simulation
              </span>
            </div>
            <p>{agent.role}</p>
            <div>
              <span className="eyebrow">CURRENT TASK</span>
              <h3>{agent.task}</h3>
            </div>
            <Panel title="Latest output">
              <div className="agent-output">
                <p>{agent.output}</p>
                <p className="muted">
                  Last successful run:{" "}
                  {new Date(agent.lastRun).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </p>
                <p className="muted">
                  Average simulated processing duration:{" "}
                  {agent.duration.toFixed(1)} seconds
                </p>
              </div>
            </Panel>
            <Button
              variant={agent.status === "paused" ? "primary" : undefined}
              onClick={() => state.toggleAgent(agent.id)}
            >
              {agent.status === "paused" ? (
                <Play size={15} />
              ) : (
                <Pause size={15} />
              )}{" "}
              {agent.status === "paused"
                ? "Resume simulated analysis"
                : "Pause simulated analysis"}
            </Button>
            <p className="muted">
              State changes update the shared roster and audit log. Pausing does
              not delete the latest recorded output.
            </p>
            <Link href="/activity">
              Inspect full activity log <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}
