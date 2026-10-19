"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch, ShieldCheck } from "lucide-react";
import { useDemoStore } from "@/store/demo-store";
import { Badge, Panel } from "@/components/ui/primitives";
import "./agents.css";

export function IntelligencePanel({ compact = false }: { compact?: boolean }) {
  const state = useDemoStore();
  const asset =
    state.assets.find((item) => item.id === state.selectedAsset) ??
    state.assets[0];
  const signal = state.signals.find((item) => item.assetId === asset.id);
  const analysis =
    state.analyses.find((item) => item.id === signal?.analysisId) ??
    state.analyses[0];
  return (
    <Panel
      title="Market intelligence"
      action={<Badge tone="info">Demo analysis</Badge>}
      className="intelligence-panel"
    >
      <div className="intel-heading">
        <span className="eyebrow">{asset.symbol} / RESEARCH BRIEF</span>
        <h3>{analysis.regime}</h3>
        <p>{analysis.summary}</p>
        {signal && (
          <p className="positive">
            Evidence strength {signal.strength}/100 · uncalibrated rubric
          </p>
        )}
      </div>
      <div className="intel-levels">
        <div>
          <span className="muted">Support / stop</span>
          <strong>
            {signal
              ? signal.stopLoss.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
              : "No signal"}
          </strong>
        </div>
        <div>
          <span className="muted">Target / resistance</span>
          <strong>
            {signal
              ? signal.takeProfit.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
              : "No signal"}
          </strong>
        </div>
      </div>
      {!compact && (
        <div className="intel-evidence">
          <span className="eyebrow">CATALYST CONTEXT</span>
          <p>{analysis.evidence.at(-1)}</p>
        </div>
      )}
      <div className="intel-dissent">
        <GitBranch size={16} />
        <p>
          <strong>Disagreement preserved</strong>
          <br />
          {analysis.bearish[0]}
        </p>
      </div>
      <div className="intel-risk">
        <ShieldCheck size={15} />
        <span>
          {state.emergencyStop
            ? "Emergency stop active"
            : "Paper execution requires risk approval"}
        </span>
      </div>
      <div className="intel-footer">
        <span className="muted">
          Fixture {analysis.id} ·{" "}
          {new Date(analysis.createdAt).toLocaleTimeString("en-GB", {
            timeZone: "UTC",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          UTC
        </span>
        <Link href="/agents#debate">
          View full agent analysis <ArrowUpRight size={14} />
        </Link>
      </div>
    </Panel>
  );
}

export default IntelligencePanel;
