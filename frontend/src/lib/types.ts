// Mirrors api_contract.md response schema exactly

export type OutputMode = "dashboard" | "report" | "insights" | "strategy";
export type TrendDir = "up" | "down" | "flat";
export type ChartType = "line" | "bar" | "pie" | "scatter" | "histogram";
export type Priority = "high" | "medium" | "low";

export interface KPI {
  name: string;
  value: number | string;
  unit: string;
  change: number;
  change_pct: number;
  trend: TrendDir;
}

export interface Chart {
  type: ChartType;
  title: string;
  purpose: string;
  x_axis: string;
  y_axis: string;
  data_keys: string[];
  annotation: string;
  insight: string;
  data: Record<string, unknown>[];
}

export interface Action {
  action: string;
  impact: string;
  confidence: number;
  priority: Priority;
}

export interface ReportSection {
  question: string;
  methods: string;
  findings: string;
  conclusion: string;
}

export interface Report {
  // 1. Introduction
  introduction: string;
  big_questions: string[];
  introduction_summary: string;
  // 2. Body
  analysis: ReportSection[];
  // 3. Conclusions
  conclusions: string;
  future_work: string[];
  // Risk assessment
  risks: string[];
}

export interface Appendix {
  sql: string;
  code: string;
  data_quality: string;
  notes: string;
}

export interface ResponseMeta {
  confidence_overall: number;
  data_freshness: string;
  rows_analyzed: number;
  warnings: string[];
  rules_applied: boolean;
}

export interface AnalyzeResponse {
  mode: OutputMode;
  headline: string;
  kpis: KPI[];
  charts: Chart[];
  insights: string[];
  actions: Action[];
  report?: Report;
  appendix?: Appendix;
  meta: ResponseMeta;
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface AnalyzeRequest {
  problem: string;
  context?: {
    dataset?: string;
    industry?: string;
    time_range?: string;
  };
  objective?: string;
  constraints?: string[];
  output: OutputMode;
  parameters?: {
    segments?: string[];
    confidence_threshold?: number;
    forecast_horizon_days?: number;
  };
  dataset_id?: string;
  inline_data?: string;
}

// ─── Dataset ──────────────────────────────────────────────────────────────────

export interface Dataset {
  dataset_id: string;
  name: string;
  rows: number;
  columns: number;
  warnings: string[];
}

export interface IngestResponse {
  dataset_id: string;
  filename: string;
  row_count: number;
  col_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  null_pct: Record<string, number>;
  duplicate_rows: number;
  warnings: string[];
}

export interface DBIngestRequest {
  db_url: string;
  query: string;
  name: string;
}

export interface ColumnStat {
  name: string;
  dtype: string;
  null_pct: number;
  unique: number;
  unique_pct: number;
  is_numeric: boolean;
  is_date: boolean;
  sample_values: unknown[];
  min: unknown;
  max: unknown;
  mean: unknown;
  quality: number; // 0–100
}

export interface DatasetDetail {
  dataset_id: string;
  filename: string;
  row_count: number;
  col_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  null_pct: Record<string, number>;
  duplicate_rows: number;
  warnings: string[];
  column_stats: ColumnStat[];
  preview: Record<string, unknown>[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type Role = "owner" | "admin" | "analyst" | "viewer";
export type MemberStatus = "active" | "invited";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  joined_at: string;
  last_active?: string;
  initials: string;
  color: string;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "resolved" | "snoozed";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: string;
  threshold: number;
  current_value: number;
  dataset_id?: string;
  created_at: string;
  resolved_at?: string;
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationStatus = "connected" | "available" | "coming_soon";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  icon: string;
  color: string;
  last_sync?: string;
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  variable: string;
  change: number;
  unit: string;
}

export interface SavedAnalysis {
  id: string;
  headline: string;
  mode: string;
  created_at: string;
  rows_analyzed: number;
  confidence: number;
  data: AnalyzeResponse;
}
