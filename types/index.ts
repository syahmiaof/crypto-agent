export type AssetId = "BTC" | "ETH" | "SOL" | "AVAX" | "LINK" | "ADA";
export type Timeframe = "15M" | "1H" | "4H" | "1D" | "1W";
export interface Asset {
  id: AssetId;
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: number;
  color: string;
}
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
export type SignalStatus =
  "pending" | "approved" | "executed" | "rejected" | "blocked" | "expired";
export interface Signal {
  id: string;
  assetId: AssetId;
  direction: "BUY" | "SELL" | "HOLD";
  strategyId: string;
  analysisId: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  strength: number;
  createdAt: string;
  status: SignalStatus;
  reason?: string;
}
export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "running" | "idle" | "paused" | "error";
  task: string;
  output: string;
  lastRun: string;
  duration: number;
}
export interface PaperOrder {
  id: string;
  signalId: string;
  assetId: AssetId;
  side: "BUY";
  notional: number;
  quantity: number;
  price: number;
  status: "open" | "filled" | "cancelled";
  createdAt: string;
  filledAt?: string;
}
export interface Position {
  id: string;
  assetId: AssetId;
  signalId: string;
  quantity: number;
  entryPrice: number;
  openedAt: string;
}
export interface Trade {
  id: string;
  positionId: string;
  assetId: AssetId;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  closedAt: string;
}
export interface AuditEvent {
  id: string;
  timestamp: string;
  type: "system" | "agent" | "signal" | "order" | "risk" | "settings";
  source: string;
  severity: "info" | "success" | "warning" | "error";
  summary: string;
  entityId: string;
  detail: string;
}
export interface RiskLimits {
  maxPositionPct: number;
  maxExposurePct: number;
  maxDailyLossPct: number;
  maxDrawdownPct: number;
  maxPositions: number;
  minRiskReward: number;
  cooldownSeconds: number;
  allowlist: AssetId[];
}
export interface DemoSettings {
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  numberFormat: "standard" | "compact";
  defaultAsset: AssetId;
  defaultTimeframe: Timeframe;
  showVolume: boolean;
  showEMA: boolean;
  analysisCadence: "manual" | "5m" | "15m";
  notifications: boolean;
}
export interface EquityPoint {
  timestamp: string;
  equity: number;
}
export interface Analysis {
  id: string;
  regime: string;
  summary: string;
  bullish: string[];
  bearish: string[];
  evidence: string[];
  invalidation: string;
  createdAt: string;
}
export interface Strategy {
  id: string;
  name: string;
  description: string;
  timeframe: Timeframe;
  assets: AssetId[];
  entry: string;
  exit: string;
  parameters: { name: string; value: number; min: number; max: number }[];
}
export interface DemoState {
  assets: Asset[];
  selectedAsset: AssetId;
  timeframe: Timeframe;
  signals: Signal[];
  analyses: Analysis[];
  agents: Agent[];
  orders: PaperOrder[];
  positions: Position[];
  trades: Trade[];
  events: AuditEvent[];
  cash: number;
  risk: RiskLimits;
  emergencyStop: boolean;
  simulationStep: number;
  clock: string;
  settings: DemoSettings;
  watchlist: AssetId[];
  equityHistory: EquityPoint[];
  dayStartEquity: number;
  peakEquity: number;
  lastTradeAt: string | null;
  scenario: string;
}
export interface ActionResult {
  ok: boolean;
  message: string;
}
export interface DemoActions {
  selectAsset: (id: AssetId) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  refreshSimulation: () => void;
  approveSignal: (
    id: string,
    notional: number,
    fillMode?: "instant" | "limit",
  ) => ActionResult;
  rejectSignal: (id: string) => ActionResult;
  cancelOrder: (id: string) => ActionResult;
  fillOrder: (id: string) => ActionResult;
  closePosition: (id: string) => ActionResult;
  setRisk: (risk: Partial<RiskLimits>) => ActionResult;
  setEmergencyStop: (enabled: boolean) => void;
  toggleAgent: (id: string) => void;
  runScenario: (scenario: string) => void;
  updateSettings: (settings: Partial<DemoSettings>) => void;
  resetDemo: () => void;
  addToWatchlist: (id: AssetId) => void;
}
export interface DemoActions {
  recordEvent: (
    type: AuditEvent["type"],
    summary: string,
    detail?: string,
    entityId?: string,
    severity?: AuditEvent["severity"],
  ) => void;
}
export type DemoStore = DemoState & DemoActions;
