"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ASSET_IDS,
  ANALYSES,
  INITIAL_AGENTS,
  INITIAL_ASSETS,
  INITIAL_SIGNALS,
  INITIAL_TIME,
  simulatedAssets,
} from "../data/fixtures";
import { calculatePortfolio } from "../lib/finance";
import { validateRiskLimits, validateTrade } from "../lib/risk";
import type {
  ActionResult,
  AuditEvent,
  DemoState,
  DemoStore,
  Position,
  Timeframe,
} from "../types";

export function createInitialState(): DemoState {
  return {
    assets: structuredClone(INITIAL_ASSETS),
    selectedAsset: "BTC",
    timeframe: "1H",
    signals: structuredClone(INITIAL_SIGNALS),
    analyses: structuredClone(ANALYSES),
    agents: structuredClone(INITIAL_AGENTS),
    orders: [],
    positions: [],
    trades: [],
    events: [
      {
        id: "evt-000",
        timestamp: INITIAL_TIME,
        type: "system",
        source: "Demo Engine",
        severity: "info",
        summary: "Mission Control initialized",
        entityId: "demo",
        detail:
          "10,000 USDT fictional starting capital. All market data, analysis and execution are deterministic simulations. No exchange is connected.",
      },
    ],
    cash: 10000,
    risk: {
      maxPositionPct: 20,
      maxExposurePct: 60,
      maxDailyLossPct: 5,
      maxDrawdownPct: 10,
      maxPositions: 5,
      minRiskReward: 2,
      cooldownSeconds: 60,
      allowlist: [...ASSET_IDS],
    },
    emergencyStop: false,
    simulationStep: 0,
    clock: INITIAL_TIME,
    settings: {
      density: "comfortable",
      reduceMotion: false,
      numberFormat: "standard",
      defaultAsset: "BTC",
      defaultTimeframe: "1H",
      showVolume: true,
      showEMA: true,
      analysisCadence: "manual",
      notifications: true,
    },
    watchlist: ASSET_IDS.slice(0, 4),
    equityHistory: [{ timestamp: INITIAL_TIME, equity: 10000 }],
    dayStartEquity: 10000,
    peakEquity: 10000,
    lastTradeAt: null,
    scenario: "baseline",
  };
}
function event(
  state: DemoState,
  type: AuditEvent["type"],
  summary: string,
  entityId: string,
  severity: AuditEvent["severity"] = "info",
  detail = summary,
): AuditEvent {
  return {
    id: `evt-${state.simulationStep}-${state.events.length}-${state.orders.length}-${state.trades.length}`,
    timestamp: state.clock,
    type,
    source: type === "risk" ? "Risk Manager" : "Demo Engine",
    severity,
    summary,
    entityId,
    detail,
  };
}
function append(state: DemoState, entry: AuditEvent): AuditEvent[] {
  return [entry, ...state.events].slice(0, 500);
}
function withEquity(state: DemoState): DemoState {
  const equity = calculatePortfolio(state).equity;
  return {
    ...state,
    peakEquity: Math.max(state.peakEquity, equity),
    equityHistory: [
      ...state.equityHistory,
      { timestamp: state.clock, equity },
    ].slice(-500),
  };
}
function validPersisted(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as DemoState;
  try {
    if (
      !Array.isArray(state.analyses) ||
      !state.analyses.length ||
      state.analyses.some(
        (analysis) =>
          typeof analysis.id !== "string" ||
          typeof analysis.summary !== "string" ||
          !Array.isArray(analysis.bullish) ||
          !Array.isArray(analysis.bearish) ||
          !Array.isArray(analysis.evidence),
      )
    )
      return false;
    if (
      !Number.isFinite(state.cash) ||
      state.cash < 0 ||
      !Number.isInteger(state.simulationStep) ||
      state.simulationStep < 0 ||
      !Number.isFinite(Date.parse(state.clock)) ||
      !Number.isFinite(state.dayStartEquity) ||
      state.dayStartEquity <= 0 ||
      !Number.isFinite(state.peakEquity) ||
      state.peakEquity <= 0 ||
      typeof state.emergencyStop !== "boolean"
    )
      return false;
    if (
      !validateRiskLimits(state.risk).ok ||
      !ASSET_IDS.includes(state.selectedAsset) ||
      !["15M", "1H", "4H", "1D", "1W"].includes(state.timeframe)
    )
      return false;
    if (
      !Array.isArray(state.assets) ||
      state.assets.length !== 6 ||
      new Set(state.assets.map((asset) => asset.id)).size !== 6 ||
      state.assets.some(
        (asset) =>
          !ASSET_IDS.includes(asset.id) ||
          !Number.isFinite(asset.price) ||
          asset.price <= 0,
      )
    )
      return false;
    if (
      !Array.isArray(state.signals) ||
      state.signals.some(
        (signal) =>
          typeof signal.id !== "string" ||
          !ASSET_IDS.includes(signal.assetId) ||
          !["BUY", "SELL", "HOLD"].includes(signal.direction) ||
          ![
            signal.entry,
            signal.stopLoss,
            signal.takeProfit,
            signal.strength,
          ].every(Number.isFinite) ||
          ![
            "pending",
            "approved",
            "executed",
            "rejected",
            "blocked",
            "expired",
          ].includes(signal.status),
      )
    )
      return false;
    if (
      !Array.isArray(state.orders) ||
      state.orders.some(
        (order) =>
          !ASSET_IDS.includes(order.assetId) ||
          !state.signals.some((signal) => signal.id === order.signalId) ||
          !Number.isFinite(order.notional) ||
          order.notional <= 0 ||
          !Number.isFinite(order.price) ||
          order.price <= 0 ||
          !Number.isFinite(order.quantity) ||
          order.quantity <= 0 ||
          !["open", "filled", "cancelled"].includes(order.status),
      )
    )
      return false;
    if (
      !Array.isArray(state.positions) ||
      state.positions.some(
        (position) =>
          !ASSET_IDS.includes(position.assetId) ||
          !state.signals.some((signal) => signal.id === position.signalId) ||
          !Number.isFinite(position.quantity) ||
          position.quantity <= 0 ||
          !Number.isFinite(position.entryPrice) ||
          position.entryPrice <= 0,
      )
    )
      return false;
    if (
      !Array.isArray(state.trades) ||
      state.trades.some(
        (trade) =>
          !ASSET_IDS.includes(trade.assetId) ||
          ![trade.pnl, trade.quantity, trade.entryPrice, trade.exitPrice].every(
            Number.isFinite,
          ) ||
          Math.abs(
            trade.pnl - (trade.exitPrice - trade.entryPrice) * trade.quantity,
          ) > 0.00001,
      )
    )
      return false;
    if (
      !Array.isArray(state.events) ||
      state.events.some(
        (entry) =>
          typeof entry.summary !== "string" || typeof entry.detail !== "string",
      ) ||
      !Array.isArray(state.agents) ||
      state.agents.length !== 7 ||
      state.agents.some(
        (agent) =>
          !INITIAL_AGENTS.some((initial) => initial.id === agent.id) ||
          !["running", "idle", "paused", "error"].includes(agent.status),
      ) ||
      !Array.isArray(state.equityHistory) ||
      state.equityHistory.some((point) => !Number.isFinite(point.equity)) ||
      !Array.isArray(state.watchlist) ||
      state.watchlist.some((id) => !ASSET_IDS.includes(id))
    )
      return false;
    const portfolio = calculatePortfolio(state);
    if (
      portfolio.availableCash < -0.000001 ||
      Math.abs(
        state.cash + portfolio.costBasis - (10000 + portfolio.realizedPnl),
      ) > 0.001
    )
      return false;
    const settings = state.settings;
    return Boolean(
      settings &&
      ["comfortable", "compact"].includes(settings.density) &&
      ["standard", "compact"].includes(settings.numberFormat) &&
      ASSET_IDS.includes(settings.defaultAsset) &&
      ["15M", "1H", "4H", "1D", "1W"].includes(settings.defaultTimeframe) &&
      ["manual", "5m", "15m"].includes(settings.analysisCadence) &&
      [
        settings.reduceMotion,
        settings.showVolume,
        settings.showEMA,
        settings.notifications,
      ].every((value) => typeof value === "boolean"),
    );
  } catch {
    return false;
  }
}
export function mergePersistedState(
  persisted: unknown,
  current: DemoStore,
): DemoStore {
  if (!validPersisted(persisted)) return current;
  const fields = Object.keys(createInitialState()) as (keyof DemoState)[];
  const restored = Object.fromEntries(
    fields.map((key) => [key, persisted[key]]),
  ) as unknown as DemoState;
  return { ...current, ...restored };
}
export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      recordEvent: (
        type,
        summary,
        detail = summary,
        entityId = "demo",
        severity = "info",
      ) => {
        const state = get();
        set({
          events: append(
            state,
            event(state, type, summary, entityId, severity, detail),
          ),
        });
      },
      selectAsset: (id) => {
        if (ASSET_IDS.includes(id)) set({ selectedAsset: id });
      },
      setTimeframe: (timeframe) => {
        if (["15M", "1H", "4H", "1D", "1W"].includes(timeframe))
          set({ timeframe });
      },
      refreshSimulation: () => {
        const state = get();
        const step = state.simulationStep + 1;
        const clock = new Date(Date.parse(state.clock) + 60000).toISOString();
        const next = withEquity({
          ...state,
          simulationStep: step,
          clock,
          assets: simulatedAssets(
            step,
            state.scenario === "stress"
              ? 0.9
              : state.scenario === "bearish"
                ? 0.97
                : state.scenario === "bullish"
                  ? 1.02
                  : 1,
          ),
          agents: state.agents.map((agent) =>
            agent.status === "paused" ? agent : { ...agent, lastRun: clock },
          ),
        });
        if (clock.slice(0, 10) !== state.clock.slice(0, 10))
          next.dayStartEquity = calculatePortfolio(next).equity;
        set({
          ...next,
          events: append(
            next,
            event(
              next,
              "system",
              "Market simulation advanced by 60 seconds",
              "market",
              "info",
              "Deterministic mark prices updated. Open limit orders require an explicit fill action and a fresh risk check.",
            ),
          ),
        });
      },
      approveSignal: (id, notional, fillMode = "instant") => {
        const state = get();
        const signal = state.signals.find((item) => item.id === id);
        if (!signal || !["pending", "blocked"].includes(signal.status))
          return {
            ok: false,
            message: "This signal is no longer available for approval.",
          };
        const validation = validateTrade(state, signal, notional);
        if (!validation.ok) {
          set({
            signals: state.signals.map((item) =>
              item.id === id
                ? { ...item, status: "blocked", reason: validation.message }
                : item,
            ),
            events: append(
              state,
              event(
                state,
                "risk",
                "Paper order blocked",
                id,
                "warning",
                validation.message,
              ),
            ),
          });
          return validation;
        }
        const price = state.assets.find(
          (asset) => asset.id === signal.assetId,
        )!.price;
        const orderId = `ord-${state.orders.length + 1}`;
        const quantity = notional / price;
        const order = {
          id: orderId,
          signalId: id,
          assetId: signal.assetId,
          side: "BUY" as const,
          notional,
          quantity,
          price,
          status:
            fillMode === "limit" ? ("open" as const) : ("filled" as const),
          createdAt: state.clock,
          ...(fillMode === "instant" ? { filledAt: state.clock } : {}),
        };
        const position: Position = {
          id: `pos-${orderId}`,
          assetId: signal.assetId,
          signalId: id,
          quantity,
          entryPrice: price,
          openedAt: state.clock,
        };
        const next = withEquity({
          ...state,
          cash: fillMode === "instant" ? state.cash - notional : state.cash,
          orders: [order, ...state.orders],
          positions:
            fillMode === "instant"
              ? [...state.positions, position]
              : state.positions,
          lastTradeAt: fillMode === "instant" ? state.clock : state.lastTradeAt,
          signals: state.signals.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: fillMode === "instant" ? "executed" : "approved",
                  reason: undefined,
                }
              : item,
          ),
        });
        next.events = append(
          next,
          event(
            next,
            "signal",
            "Signal approved for paper trading",
            id,
            "success",
            `${notional.toFixed(2)} USDT approved; ${orderId}. No fees or slippage in paper execution.`,
          ),
        );
        next.events = append(
          next,
          event(
            next,
            "order",
            fillMode === "instant"
              ? "Paper order filled"
              : "Paper limit order opened · cash reserved",
            orderId,
            "success",
            `${quantity.toFixed(8)} ${signal.assetId} at ${price.toFixed(4)} USDT. Originating signal: ${id}.`,
          ),
        );
        set(next);
        return {
          ok: true,
          message:
            fillMode === "instant"
              ? "Paper trade filled. Portfolio and audit log updated."
              : "Limit order opened. Cash and exposure reserved.",
        };
      },
      rejectSignal: (id) => {
        const state = get();
        const signal = state.signals.find((item) => item.id === id);
        if (!signal || !["pending", "blocked"].includes(signal.status))
          return {
            ok: false,
            message: "Only pending or blocked signals can be rejected.",
          };
        set({
          signals: state.signals.map((item) =>
            item.id === id
              ? { ...item, status: "rejected", reason: "Rejected by operator" }
              : item,
          ),
          events: append(
            state,
            event(state, "signal", "Signal rejected by operator", id, "info"),
          ),
        });
        return {
          ok: true,
          message: "Signal rejected and audit event recorded.",
        };
      },
      cancelOrder: (id) => {
        const state = get();
        const order = state.orders.find((item) => item.id === id);
        if (!order || order.status !== "open")
          return {
            ok: false,
            message: "Only open paper orders can be cancelled.",
          };
        set({
          orders: state.orders.map((item) =>
            item.id === id ? { ...item, status: "cancelled" } : item,
          ),
          signals: state.signals.map((signal) =>
            signal.id === order.signalId
              ? {
                  ...signal,
                  status: "rejected",
                  reason: "Associated order cancelled",
                }
              : signal,
          ),
          events: append(
            state,
            event(
              state,
              "order",
              "Paper order cancelled · reserved cash released",
              id,
            ),
          ),
        });
        return {
          ok: true,
          message: "Order cancelled and reserved cash released.",
        };
      },
      fillOrder: (id) => {
        const state = get();
        const order = state.orders.find((item) => item.id === id);
        if (!order || order.status !== "open")
          return {
            ok: false,
            message: "Only open paper orders can be filled.",
          };
        const signal = state.signals.find((item) => item.id === order.signalId);
        if (!signal)
          return { ok: false, message: "Originating signal is missing." };
        const check = validateTrade(state, signal, order.notional, id);
        if (!check.ok) {
          set({
            events: append(
              state,
              event(
                state,
                "risk",
                "Pending fill blocked by current risk rules",
                id,
                "warning",
                check.message,
              ),
            ),
          });
          return check;
        }
        const price = state.assets.find(
          (asset) => asset.id === order.assetId,
        )!.price;
        if (price > order.price + 1e-8)
          return {
            ok: false,
            message:
              "Current mark is above the buy limit. Advance simulation or cancel the order.",
          };
        const quantity = order.notional / price;
        const next = withEquity({
          ...state,
          cash: state.cash - order.notional,
          lastTradeAt: state.clock,
          orders: state.orders.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "filled",
                  filledAt: state.clock,
                  price,
                  quantity,
                }
              : item,
          ),
          positions: [
            ...state.positions,
            {
              id: `pos-${id}`,
              assetId: order.assetId,
              signalId: order.signalId,
              quantity,
              entryPrice: price,
              openedAt: state.clock,
            },
          ],
          signals: state.signals.map((item) =>
            item.id === signal.id ? { ...item, status: "executed" } : item,
          ),
        });
        next.events = append(
          next,
          event(
            next,
            "order",
            "Paper limit order filled after risk recheck",
            id,
            "success",
          ),
        );
        set(next);
        return {
          ok: true,
          message: "Paper limit order filled at the current simulated mark.",
        };
      },
      closePosition: (id) => {
        const state = get();
        const position = state.positions.find((item) => item.id === id);
        if (!position)
          return {
            ok: false,
            message: "Position is already closed or does not exist.",
          };
        const price = state.assets.find(
          (asset) => asset.id === position.assetId,
        )!.price;
        const pnl = (price - position.entryPrice) * position.quantity;
        const next = withEquity({
          ...state,
          cash: state.cash + position.quantity * price,
          positions: state.positions.filter((item) => item.id !== id),
          trades: [
            {
              id: `trade-${state.trades.length + 1}`,
              positionId: id,
              assetId: position.assetId,
              quantity: position.quantity,
              entryPrice: position.entryPrice,
              exitPrice: price,
              pnl,
              closedAt: state.clock,
            },
            ...state.trades,
          ],
        });
        next.events = append(
          next,
          event(
            next,
            "order",
            `Paper position closed · ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT realized`,
            id,
            "success",
            "Closed at the simulated mark with zero fees and zero slippage. Closing remains allowed during an emergency stop to reduce risk.",
          ),
        );
        set(next);
        return { ok: true, message: "Position closed. Realized P&L recorded." };
      },
      setRisk: (patch) => {
        const state = get();
        const risk = { ...state.risk, ...patch };
        const result = validateRiskLimits(risk);
        if (!result.ok) return result;
        set({
          risk,
          events: append(
            state,
            event(
              state,
              "settings",
              "Risk limits updated",
              "risk-config",
              "info",
              JSON.stringify(risk),
            ),
          ),
        });
        return result;
      },
      setEmergencyStop: (enabled) => {
        const state = get();
        if (state.emergencyStop === enabled) return;
        set({
          emergencyStop: enabled,
          events: append(
            state,
            event(
              state,
              "risk",
              enabled
                ? "Emergency stop activated · new exposure blocked"
                : "Emergency stop released by operator",
              "emergency-stop",
              enabled ? "error" : "warning",
              enabled
                ? "All new approvals and pending fills are blocked. Position closures and order cancellations remain available."
                : "New paper orders must still pass all configured risk checks.",
            ),
          ),
        });
      },
      toggleAgent: (id) => {
        const state = get();
        const agent = state.agents.find((item) => item.id === id);
        if (!agent) return;
        const status = agent.status === "paused" ? "running" : "paused";
        set({
          agents: state.agents.map((item) =>
            item.id === id ? { ...item, status } : item,
          ),
          events: append(
            state,
            event(state, "agent", `${agent.name} ${status}`, id),
          ),
        });
      },
      runScenario: (scenario) => {
        const state = get();
        const normalized = scenario.toLowerCase().includes("stress")
          ? "stress"
          : scenario.toLowerCase().includes("bear")
            ? "bearish"
            : scenario.toLowerCase().includes("bull")
              ? "bullish"
              : "baseline";
        const step = state.simulationStep + 1;
        const clock = new Date(Date.parse(state.clock) + 60000).toISOString();
        const assets = simulatedAssets(
          step,
          normalized === "stress"
            ? 0.9
            : normalized === "bearish"
              ? 0.97
              : normalized === "bullish"
                ? 1.02
                : 1,
        );
        const summary =
          normalized === "stress"
            ? "Stress fixture: marks reduced by approximately 10%. Check drawdown and daily loss before adding exposure."
            : normalized === "bearish"
              ? "Bearish fixture: simulated support weakened. Favor observation until structure recovers."
              : normalized === "bullish"
                ? "Bullish fixture: simulated momentum improved. Resistance and position limits still apply."
                : "Balanced fixture: trend support and resistance remain in disagreement.";
        const signal = {
          ...INITIAL_SIGNALS[0],
          id: `sig-${normalized}-${step}`,
          analysisId: `analysis-${normalized}-${step}`,
          assetId: state.selectedAsset,
          direction:
            normalized === "stress" || normalized === "bearish"
              ? ("HOLD" as const)
              : ("BUY" as const),
          entry: assets.find((asset) => asset.id === state.selectedAsset)!
            .price,
          createdAt: clock,
          status: "pending" as const,
        };
        signal.stopLoss = signal.entry * 0.98;
        signal.takeProfit = signal.entry * 1.06;
        const defensive = normalized === "bearish" || normalized === "stress";
        const analysis = {
          id: signal.analysisId,
          regime:
            normalized === "stress"
              ? "Elevated volatility"
              : normalized === "bearish"
                ? "Defensive / bearish"
                : normalized === "bullish"
                  ? "Bullish continuation"
                  : "Balanced / ranging",
          summary,
          bullish: defensive
            ? [
                `${state.selectedAsset} may stabilize if the next simulated support retest holds.`,
                "A recovery in participation would challenge the defensive thesis.",
                "Wait for confirmation; falling prices alone do not justify a long entry.",
              ]
            : [
                `${state.selectedAsset} momentum improved in the loaded fixture.`,
                "A confirmed retest would support a measured long entry.",
                "Constructive conditions remain conditional on volume and support.",
              ],
          bearish: defensive
            ? [
                `${state.selectedAsset} lost ground in the loaded scenario; downside structure takes priority.`,
                "Synthetic participation is insufficient to confirm a reversal.",
                "Rising losses may trigger daily-loss or drawdown limits.",
              ]
            : [
                `${state.selectedAsset} can still reject at overhead resistance.`,
                "Synthetic sentiment cannot establish real market demand.",
                "A failed retest would invalidate continuation despite positive momentum.",
              ],
          evidence: [
            `${normalized} price fixture · ${clock.slice(11, 19)} UTC`,
            `Simulated mark ${signal.entry.toFixed(4)} USDT · ${state.selectedAsset}`,
            "Synthetic catalyst and sentiment inputs; no external news feed",
          ],
          invalidation: defensive
            ? "A sustained recovery above the pre-scenario price with renewed participation invalidates the defensive thesis."
            : `A close below the protective reference ${signal.stopLoss.toFixed(4)} USDT invalidates the long thesis.`,
          createdAt: clock,
        };
        const outputs: Record<string, string> = {
          technical: `${state.selectedAsset} simulated mark ${signal.entry.toFixed(4)} USDT. ${defensive ? "Structure weakened; wait for a confirmed recovery." : "Momentum improved; monitor the support retest."}`,
          intelligence: `${normalized} catalyst fixture loaded. No real news or exchange data is connected.`,
          sentiment: `Synthetic sentiment ${defensive ? "38" : "64"}/100. Fictional sample; not a calibrated probability.`,
          bull: analysis.bullish[0] + " " + analysis.bullish[1],
          bear: analysis.bearish[0] + " " + analysis.bearish[1],
          manager: `${summary} Suggested action: ${signal.direction}. Bull and Bear evidence remain available for review.`,
          risk: "No automatic approval. Current exposure, cash, daily loss, drawdown, cooldown and protective price geometry are checked by code at order time.",
        };
        const next = withEquity({
          ...state,
          scenario: normalized,
          simulationStep: step,
          clock,
          assets,
          signals: [signal, ...state.signals],
          analyses: [analysis, ...state.analyses],
          agents: state.agents.map((agent) =>
            agent.status === "paused"
              ? agent
              : {
                  ...agent,
                  status: "idle",
                  task: `${normalized} scenario complete`,
                  output: outputs[agent.id],
                  lastRun: clock,
                },
          ),
        });
        next.events = append(
          next,
          event(
            next,
            "agent",
            `${normalized} analysis scenario completed`,
            signal.analysisId,
            "info",
            `${summary} Deterministic Demo Engine; no external AI inference.`,
          ),
        );
        next.events = append(
          next,
          event(
            next,
            "signal",
            `${signal.direction} signal created for ${signal.assetId}`,
            signal.id,
          ),
        );
        set(next);
      },
      updateSettings: (patch) => {
        const state = get();
        const settings = { ...state.settings, ...patch };
        set({
          settings,
          events: append(
            state,
            event(
              state,
              "settings",
              "Workspace preferences updated",
              "preferences",
              "info",
              "Preferences are stored locally in this browser. Analysis cadence is a saved preference; simulation advances only when explicitly requested.",
            ),
          ),
        });
      },
      resetDemo: () => set(createInitialState()),
      addToWatchlist: (id) => {
        const state = get();
        if (!ASSET_IDS.includes(id) || state.watchlist.includes(id)) return;
        set({
          watchlist: [...state.watchlist, id],
          events: append(
            state,
            event(state, "settings", `${id} added to watchlist`, id),
          ),
        });
      },
    }),
    {
      name: "crypto-ai-mission-control-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([, value]) => typeof value !== "function",
          ),
        ) as unknown as DemoState,
      merge: mergePersistedState,
    },
  ),
);

export const TIMEFRAMES: Timeframe[] = ["15M", "1H", "4H", "1D", "1W"];
export type { DemoState, DemoStore, ActionResult };
