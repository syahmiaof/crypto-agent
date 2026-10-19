"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileClock, Search, X } from "lucide-react";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import { useDemoStore } from "@/store/demo-store";
import type { AuditEvent } from "@/types";

const tones = {
  info: "info",
  success: "positive",
  warning: "warning",
  error: "negative",
} as const;
const destinations: Record<AuditEvent["type"], string> = {
  agent: "/agents",
  signal: "/signals",
  order: "/portfolio",
  risk: "/risk",
  settings: "/settings",
  system: "/dashboard",
};

export default function ActivityPage() {
  const events = useDemoStore((state) => state.events);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const invalidRange = Boolean(start && end && start > end);
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (type === "all" || event.type === type) &&
          (severity === "all" || event.severity === severity) &&
          (!start || event.timestamp.slice(0, 10) >= start) &&
          (!end || event.timestamp.slice(0, 10) <= end) &&
          `${event.summary} ${event.detail} ${event.source} ${event.entityId}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [events, query, type, severity, start, end],
  );
  const activeFilters =
    query || type !== "all" || severity !== "all" || start || end;
  return (
    <>
      <PageHeader
        title="Activity & Audit Log"
        description="A traceable record of decisions, simulations and operator actions."
      >
        <Badge>
          <FileClock size={12} />
          LOCAL DEMO AUDIT
        </Badge>
      </PageHeader>
      <Panel
        title="Operational timeline"
        action={
          <span className="muted mono" style={{ fontSize: 11 }}>
            {filtered.length} / {events.length} events
          </span>
        }
      >
        <div className="toolbar" style={{ flexWrap: "wrap" }}>
          <label style={{ position: "relative", flex: "1 1 200px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                top: 11,
                left: 10,
                color: "var(--muted)",
              }}
            />
            <input
              aria-label="Search audit events"
              className="control"
              style={{ paddingLeft: 31, width: "100%" }}
              placeholder="Search events or entity ID…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="control"
            aria-label="Filter event type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">All event types</option>
            {Object.keys(destinations).map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="control"
            aria-label="Filter severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="all">All severities</option>
            {Object.keys(tones).map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <label className="field" style={{ gap: 3, fontSize: 9 }}>
            <span className="muted">From · UTC</span>
            <input
              className="control"
              aria-label="Audit start date"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="field" style={{ gap: 3, fontSize: 9 }}>
            <span className="muted">Through · UTC</span>
            <input
              className="control"
              aria-label="Audit end date"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
          {activeFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setType("all");
                setSeverity("all");
                setStart("");
                setEnd("");
              }}
            >
              <X size={13} />
              Clear
            </Button>
          )}
        </div>
        {invalidRange && (
          <p role="alert" className="info-box negative" style={{ margin: 16 }}>
            End date must be on or after the start date.
          </p>
        )}
        {filtered.length ? (
          <div>
            {filtered.map((event) => (
              <article className="audit-event" key={event.id}>
                <time
                  className="mono muted"
                  dateTime={event.timestamp}
                  style={{ fontSize: 10 }}
                >
                  {event.timestamp.slice(11, 19)} UTC
                  <br />
                  <span style={{ fontSize: 9 }}>
                    {event.timestamp.slice(0, 10)}
                  </span>
                </time>
                <div>
                  <Badge tone={tones[event.severity]}>{event.severity}</Badge>
                  <p>{event.type}</p>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3>{event.summary}</h3>
                  <p style={{ overflowWrap: "anywhere" }}>
                    {event.source} · {event.entityId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  aria-label={`Inspect event: ${event.summary}`}
                  onClick={() => setSelected(event)}
                >
                  <ArrowUpRight size={15} />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching events"
            description="Adjust your filters, or approve a signal, run a scenario or change a setting to generate an audit record."
          />
        )}
        <div className="section-note">
          <span>Newest first · simulation timestamps in UTC</span>
          <span>Last 500 events retained locally</span>
        </div>
      </Panel>
      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="Audit event details"
      >
        {selected && (
          <>
            <div className="header-actions">
              <Badge tone={tones[selected.severity]}>
                {selected.severity.toUpperCase()}
              </Badge>
              <Badge>{selected.type.toUpperCase()}</Badge>
            </div>
            <h2>{selected.summary}</h2>
            <p className="muted" style={{ lineHeight: 1.8 }}>
              {selected.detail}
            </p>
            <Panel title="Record metadata">
              <dl className="panel-body stack" style={{ fontSize: 12 }}>
                {[
                  ["Event ID", selected.id],
                  ["Entity ID", selected.entityId],
                  ["Source", selected.source],
                  [
                    "Simulation timestamp",
                    `${selected.timestamp.replace("T", " ").replace(".000Z", "")} UTC`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="muted" style={{ marginBottom: 5 }}>
                      {label}
                    </dt>
                    <dd className="mono" style={{ overflowWrap: "anywhere" }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Link
              className="button"
              href={destinations[selected.type]}
              onClick={() => setSelected(null)}
            >
              Open related workspace <ArrowUpRight size={14} />
            </Link>
            <p className="info-box">
              This is a local demonstration log. It is reset with demo data and
              is not an immutable production audit trail.
            </p>
          </>
        )}
      </Drawer>
    </>
  );
}
