"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { Badge, Metric, PageHeader, Panel } from "@/components/ui/primitives";
import { SignalTable } from "@/components/trading/SignalTable";
export default function SignalsPage() {
  const state = useDemoStore();
  return (
    <>
      <PageHeader
        title="Signal Center"
        description="Inspect the evidence. Challenge the thesis. Control the decision."
      >
        <Link className="button" href="/agents">
          Run demo analysis <ArrowRight size={14} />
        </Link>
      </PageHeader>
      <div className="metric-grid metrics-three">
        <Metric
          label="Pending review"
          value={state.signals.filter((s) => s.status === "pending").length}
          detail="Your approval is required"
        />
        <Metric
          label="Paper executions"
          value={state.signals.filter((s) => s.status === "executed").length}
          detail="Simulated fills only"
          tone="positive"
        />
        <Metric
          label="Blocked by risk"
          value={state.signals.filter((s) => s.status === "blocked").length}
          detail="Hard rules are enforced"
          tone="warning"
        />
      </div>
      <Panel
        title="Research signal queue"
        action={<Badge>SIMULATED RECOMMENDATIONS</Badge>}
      >
        <SignalTable />
      </Panel>
      <div className="info-box" style={{ marginTop: 18 }}>
        This is a long-only spot paper portfolio. SELL and HOLD signals are
        research recommendations; use Portfolio to close an existing position.
        No exchange or external model is connected.
      </div>
    </>
  );
}
