"use client";
import { useState, type ReactNode } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { useDemoStore, TIMEFRAMES } from "@/store/demo-store";
import {
  Badge,
  Button,
  ConfirmDialog,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import type { AssetId, DemoSettings, Timeframe } from "@/types";
function Setting({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export default function SettingsPage() {
  const state = useDemoStore(),
    s = state.settings;
  const [reset, setReset] = useState(false),
    [notice, setNotice] = useState("");
  const update = (patch: Partial<DemoSettings>) => {
    state.updateSettings(patch);
    setNotice("Preferences saved in this browser.");
  };
  return (
    <>
      <PageHeader
        title="Settings & Integrations"
        description="Shape your workspace. Keep its boundaries clear."
      >
        <Badge tone="positive">
          <ShieldCheck size={12} />
          Local demo environment
        </Badge>
      </PageHeader>
      {notice && (
        <div role="status" className="message" style={{ marginBottom: 18 }}>
          {notice}
        </div>
      )}
      <div className="two-column">
        <div className="stack">
          <Panel title="Appearance">
            <div className="panel-body">
              <Setting
                title="Interface density"
                description="Compact mode reduces table and metric spacing."
              >
                <select
                  className="control"
                  aria-label="Interface density"
                  value={s.density}
                  onChange={(e) =>
                    update({
                      density: e.target.value as DemoSettings["density"],
                    })
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </Setting>
              <Setting
                title="Reduced motion"
                description="Disable interface transitions and chart animation."
              >
                <input
                  type="checkbox"
                  aria-label="Reduced motion"
                  checked={s.reduceMotion}
                  onChange={(e) => update({ reduceMotion: e.target.checked })}
                />
              </Setting>
              <Setting
                title="Number formatting"
                description="Compact format applies to dashboard portfolio totals."
              >
                <select
                  className="control"
                  aria-label="Number formatting"
                  value={s.numberFormat}
                  onChange={(e) =>
                    update({
                      numberFormat: e.target
                        .value as DemoSettings["numberFormat"],
                    })
                  }
                >
                  <option value="standard">12,345.67</option>
                  <option value="compact">12.35K</option>
                </select>
              </Setting>
              <Setting
                title="Volume chart"
                description="Show the volume pane in market charts."
              >
                <input
                  type="checkbox"
                  aria-label="Show chart volume"
                  checked={s.showVolume}
                  onChange={(e) => update({ showVolume: e.target.checked })}
                />
              </Setting>
              <Setting
                title="EMA overlay"
                description="Display the exponential moving average."
              >
                <input
                  type="checkbox"
                  aria-label="Show EMA overlay"
                  checked={s.showEMA}
                  onChange={(e) => update({ showEMA: e.target.checked })}
                />
              </Setting>
            </div>
          </Panel>
          <Panel title="Paper trading preferences">
            <div className="panel-body">
              <Setting
                title="Default asset"
                description="Applies to the active workspace immediately."
              >
                <select
                  className="control"
                  aria-label="Default asset"
                  value={s.defaultAsset}
                  onChange={(e) => {
                    const id = e.target.value as AssetId;
                    update({ defaultAsset: id });
                    state.selectAsset(id);
                  }}
                >
                  {state.assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </Setting>
              <Setting
                title="Default timeframe"
                description="Applies to your active market chart."
              >
                <select
                  className="control"
                  aria-label="Default timeframe"
                  value={s.defaultTimeframe}
                  onChange={(e) => {
                    const timeframe = e.target.value as Timeframe;
                    update({ defaultTimeframe: timeframe });
                    state.setTimeframe(timeframe);
                  }}
                >
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf}>{tf}</option>
                  ))}
                </select>
              </Setting>
              <Setting
                title="Execution model"
                description="Long-only spot, manual closes, zero fees and slippage."
              >
                <Badge>PAPER ONLY</Badge>
              </Setting>
            </div>
          </Panel>
          <Panel title="Notifications">
            <div className="panel-body">
              <Setting
                title="Notification badge"
                description="Show unread-event indicator in the top navigation."
              >
                <input
                  type="checkbox"
                  aria-label="Notification badge"
                  checked={s.notifications}
                  onChange={(e) => update({ notifications: e.target.checked })}
                />
              </Setting>
              <Setting
                title="Browser push notifications"
                description="Not connected. No browser permission is requested."
              >
                <Badge>Coming later</Badge>
              </Setting>
              <Setting
                title="Telegram"
                description="External messaging is not part of this demo."
              >
                <Badge>Not connected</Badge>
              </Setting>
            </div>
          </Panel>
        </div>
        <div className="stack">
          <Panel title="AI preferences">
            <div className="panel-body">
              <Setting
                title="Analysis cadence preference"
                description="Saved for future integration. Demo runs remain manual."
              >
                <select
                  className="control"
                  aria-label="Analysis cadence"
                  value={s.analysisCadence}
                  onChange={(e) =>
                    update({
                      analysisCadence: e.target
                        .value as DemoSettings["analysisCadence"],
                    })
                  }
                >
                  <option value="manual">Manual</option>
                  <option value="5m">Every 5 minutes</option>
                  <option value="15m">Every 15 minutes</option>
                </select>
              </Setting>
              <Setting
                title="Model provider"
                description="Deterministic fixtures; no external model inference."
              >
                <Badge>Demo Engine</Badge>
              </Setting>
              <Setting
                title="Connected agents"
                description="Six research and risk agents plus a coordinating manager."
              >
                <Badge>{state.agents.length} configured</Badge>
              </Setting>
            </div>
          </Panel>
          <Panel title="Exchange integrations">
            <div className="panel-body stack">
              <p className="muted">
                Future integration surfaces only. API keys cannot be entered,
                stored or transmitted.
              </p>
              {["Luno", "Binance", "Other exchanges"].map((name) => (
                <div className="settings-row" key={name}>
                  <h3>{name}</h3>
                  <Badge>Not connected</Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="System">
            <div className="panel-body">
              <Setting
                title="Application version"
                description="CRYPTO AI — Mission Control"
              >
                <span className="mono">1.0.0</span>
              </Setting>
              <Setting
                title="Market snapshot"
                description="Fictional clock; advances only on explicit demo actions."
              >
                <span className="mono" style={{ fontSize: 11 }}>
                  {new Date(state.clock).toLocaleTimeString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </span>
              </Setting>
              <Setting
                title="State storage"
                description="Browser localStorage. Clearing site data erases your demo."
              >
                <Badge>Local only</Badge>
              </Setting>
              <div className="divider" />
              <p className="muted" style={{ fontSize: 12, marginBottom: 15 }}>
                Reset returns capital to 10,000 USDT and clears orders,
                positions, preferences, chat history and audit history.
              </p>
              <Button variant="danger" onClick={() => setReset(true)}>
                <RotateCcw size={13} />
                Reset demo data
              </Button>
            </div>
          </Panel>
        </div>
      </div>
      <ConfirmDialog
        open={reset}
        onOpenChange={setReset}
        title="Reset all demo data?"
        description="All local paper-trading records and preferences will be cleared. The workspace returns to its deterministic starting state."
        danger
        onConfirm={() => {
          state.resetDemo();
          localStorage.setItem("mission-control-demo-chat-v1", "[]");
          window.dispatchEvent(new Event("mission-control-chat-changed"));
          setNotice("Demo reset. Starting paper capital: 10,000 USDT.");
        }}
      />
    </>
  );
}
