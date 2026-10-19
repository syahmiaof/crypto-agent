import { beforeEach, describe, expect, it } from "vitest";
import { calculatePortfolio } from "../lib/finance";
import { validateRiskLimits, validateTrade } from "../lib/risk";
import {
  createInitialState,
  mergePersistedState,
  useDemoStore,
} from "../store/demo-store";

beforeEach(() => useDemoStore.setState(createInitialState()));
describe("paper ledger", () => {
  it("starts with 10,000 cash and no invented performance", () => {
    const p = calculatePortfolio(useDemoStore.getState());
    expect(p.equity).toBe(10000);
    expect(p.netPnl).toBe(0);
    expect(p.positionValue).toBe(0);
  });
  it("approval creates one order, position and linked audit entries, never duplicates", () => {
    expect(useDemoStore.getState().approveSignal("sig-001", 1000).ok).toBe(
      true,
    );
    const state = useDemoStore.getState();
    expect(state.cash).toBe(9000);
    expect(state.positions).toHaveLength(1);
    expect(state.orders[0].signalId).toBe("sig-001");
    expect(state.signals[0].status).toBe("executed");
    expect(calculatePortfolio(state).equity).toBeCloseTo(10000);
    expect(
      state.events.some(
        (event) => event.entityId === "sig-001" && event.type === "signal",
      ),
    ).toBe(true);
    expect(state.approveSignal("sig-001", 1000).ok).toBe(false);
    expect(useDemoStore.getState().positions).toHaveLength(1);
  });
  it("reserves cash and exposure for open orders and releases it on cancel", () => {
    useDemoStore.getState().approveSignal("sig-001", 1000, "limit");
    let state = useDemoStore.getState();
    expect(state.cash).toBe(10000);
    expect(calculatePortfolio(state).availableCash).toBe(9000);
    expect(calculatePortfolio(state).exposurePct).toBe(10);
    expect(state.cancelOrder(state.orders[0].id).ok).toBe(true);
    state = useDemoStore.getState();
    expect(calculatePortfolio(state).availableCash).toBe(10000);
    expect(state.positions).toHaveLength(0);
  });
  it("rechecks risk limits at delayed fill and preserves reservations on failure", () => {
    useDemoStore.getState().approveSignal("sig-001", 1000, "limit");
    useDemoStore.getState().setRisk({ maxPositionPct: 5 });
    expect(useDemoStore.getState().fillOrder("ord-1").ok).toBe(false);
    expect(useDemoStore.getState().cash).toBe(10000);
    expect(useDemoStore.getState().orders[0].status).toBe("open");
    useDemoStore.getState().setRisk({ maxPositionPct: 20 });
    expect(useDemoStore.getState().fillOrder("ord-1").ok).toBe(true);
    expect(useDemoStore.getState().cash).toBe(9000);
  });
  it("closing realizes precisely the mark P&L and preserves the accounting identity", () => {
    useDemoStore.getState().approveSignal("sig-001", 1000);
    useDemoStore.getState().refreshSimulation();
    const state = useDemoStore.getState();
    const before = calculatePortfolio(state);
    expect(state.closePosition(state.positions[0].id).ok).toBe(true);
    const after = calculatePortfolio(useDemoStore.getState());
    expect(after.equity).toBeCloseTo(before.equity, 8);
    expect(after.realizedPnl).toBeCloseTo(before.unrealizedPnl, 8);
    expect(after.cash).toBeCloseTo(10000 + after.realizedPnl, 8);
    expect(after.unrealizedPnl).toBe(0);
  });
});
describe("deterministic risk engine", () => {
  it("keeps scenario evidence linked, immutable and distinct by specialist", () => {
    useDemoStore.getState().runScenario("bearish");
    const bearish = useDemoStore.getState();
    const signal = bearish.signals[0];
    const analysis = bearish.analyses.find(
      (item) => item.id === signal.analysisId,
    )!;
    expect(signal.direction).toBe("HOLD");
    expect(analysis.summary).toContain("Bearish fixture");
    expect(analysis.id).not.toBe("analysis-001");
    expect(bearish.agents.find((a) => a.id === "bull")!.output).not.toBe(
      bearish.agents.find((a) => a.id === "bear")!.output,
    );
    useDemoStore.getState().runScenario("bullish");
    expect(
      useDemoStore.getState().analyses.find((a) => a.id === analysis.id),
    ).toEqual(analysis);
    expect(useDemoStore.getState().analyses[0].summary).toContain(
      "Bullish fixture",
    );
  });
  it("blocks nonfinite, negative and excessive orders without changing cash", () => {
    for (const size of [NaN, Infinity, -1, 0, 2500])
      expect(useDemoStore.getState().approveSignal("sig-001", size).ok).toBe(
        false,
      );
    expect(useDemoStore.getState().cash).toBe(10000);
    expect(useDemoStore.getState().positions).toHaveLength(0);
  });
  it("blocks both new orders and reserved fills during emergency stop, but permits closing", () => {
    useDemoStore.getState().approveSignal("sig-001", 1000, "limit");
    useDemoStore.getState().setEmergencyStop(true);
    expect(useDemoStore.getState().fillOrder("ord-1").ok).toBe(false);
    expect(useDemoStore.getState().approveSignal("sig-002", 1000).ok).toBe(
      false,
    );
    useDemoStore.getState().setEmergencyStop(false);
    expect(useDemoStore.getState().fillOrder("ord-1").ok).toBe(true);
    useDemoStore.getState().setEmergencyStop(true);
    expect(useDemoStore.getState().closePosition("pos-ord-1").ok).toBe(true);
  });
  it("enforces cooldown using simulation time", () => {
    useDemoStore.getState().approveSignal("sig-001", 1000);
    expect(
      useDemoStore.getState().approveSignal("sig-002", 1000).message,
    ).toContain("cooldown");
    useDemoStore.getState().refreshSimulation();
    expect(useDemoStore.getState().approveSignal("sig-002", 1000).ok).toBe(
      true,
    );
  });
  it("counts reserved capital against portfolio exposure and concurrent slots", () => {
    useDemoStore.getState().setRisk({ maxExposurePct: 20 });
    useDemoStore.getState().approveSignal("sig-001", 1500, "limit");
    expect(
      useDemoStore.getState().approveSignal("sig-002", 1000, "limit").message,
    ).toContain("exposure");
    useDemoStore.getState().setRisk({ maxExposurePct: 60, maxPositions: 1 });
    expect(
      useDemoStore.getState().approveSignal("sig-002", 1000, "limit").message,
    ).toContain("concurrent");
  });
  it("blocks disallowed assets, low reward plans, HOLD and short-sale signals", () => {
    const state = createInitialState();
    state.risk.allowlist = ["ETH"];
    expect(validateTrade(state, state.signals[0], 1000).message).toContain(
      "allowlist",
    );
    state.risk.allowlist = ["BTC"];
    state.risk.minRiskReward = 4;
    expect(validateTrade(state, state.signals[0], 1000).message).toContain(
      "Risk/reward",
    );
    expect(validateTrade(state, state.signals[3], 1000).message).toContain(
      "Short selling",
    );
    expect(validateTrade(state, state.signals[4], 1000).message).toContain(
      "HOLD",
    );
  });
  it("enforces daily loss and drawdown guardrails", () => {
    const state = createInitialState();
    state.cash = 9400;
    expect(validateTrade(state, state.signals[0], 1000).message).toContain(
      "Daily",
    );
    state.risk.maxDailyLossPct = 20;
    state.peakEquity = 11000;
    expect(validateTrade(state, state.signals[0], 1000).message).toContain(
      "drawdown",
    );
  });
  it("rejects invalid risk configuration including empty allowlist and NaN", () => {
    const risk = createInitialState().risk;
    expect(validateRiskLimits({ ...risk, maxPositions: 1.5 }).ok).toBe(false);
    expect(validateRiskLimits({ ...risk, maxPositionPct: NaN }).ok).toBe(false);
    expect(validateRiskLimits({ ...risk, allowlist: [] }).ok).toBe(false);
    expect(validateRiskLimits({ ...risk, cooldownSeconds: -1 }).ok).toBe(false);
  });
  it("scenario and reset are reproducible", () => {
    useDemoStore.getState().runScenario("stress");
    const first = useDemoStore.getState().assets.map((asset) => asset.price);
    useDemoStore.getState().resetDemo();
    useDemoStore.getState().runScenario("stress");
    expect(useDemoStore.getState().assets.map((asset) => asset.price)).toEqual(
      first,
    );
    useDemoStore.getState().resetDemo();
    expect(useDemoStore.getState().cash).toBe(10000);
    expect(useDemoStore.getState().orders).toHaveLength(0);
  });
  it("restores a coherent ledger while rejecting corruption and preserving action functions", () => {
    const current = useDemoStore.getState();
    expect(mergePersistedState({ cash: "broken" }, current)).toBe(current);
    const invalid = { ...createInitialState(), cash: 50000 };
    expect(mergePersistedState(invalid, current)).toBe(current);
    const restored = mergePersistedState(
      { ...createInitialState(), approveSignal: "corrupt" },
      current,
    );
    expect(typeof restored.approveSignal).toBe("function");
    useDemoStore.getState().approveSignal("sig-001", 1000);
    const persisted = JSON.parse(JSON.stringify(useDemoStore.getState()));
    const valid = mergePersistedState(persisted, current);
    expect(valid.cash).toBe(9000);
    expect(valid.positions).toHaveLength(1);
  });
});
