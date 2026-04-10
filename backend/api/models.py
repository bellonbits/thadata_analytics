"""
Pydantic request/response models — mirrors api_contract.md exactly.
"""
from __future__ import annotations

from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field, model_validator


# ─── Request ──────────────────────────────────────────────────────────────────

class AnalysisContext(BaseModel):
    dataset: str = ""
    industry: str = ""
    time_range: str = ""


class AnalysisParameters(BaseModel):
    segments: list[str] = []
    confidence_threshold: float = Field(default=0.70, ge=0.0, le=1.0)
    forecast_horizon_days: int = Field(default=30, ge=1, le=365)


class AnalyzeRequest(BaseModel):
    problem: str
    context: AnalysisContext = AnalysisContext()
    objective: str = ""
    constraints: list[str] = []
    output: Literal["dashboard", "report", "insights", "strategy"] = "insights"
    parameters: AnalysisParameters = AnalysisParameters()
    dataset_id: Optional[str] = None
    inline_data: Optional[str] = None  # raw CSV string


class QuickQuestionRequest(BaseModel):
    question: str
    dataset_id: Optional[str] = None


class QueryRequest(BaseModel):
    dataset_id: str
    sql: str


class DBIngestRequest(BaseModel):
    db_url: str
    query: str
    name: str = "db_export"


# ─── Response ─────────────────────────────────────────────────────────────────

class KPI(BaseModel):
    name: str
    value: Union[float, str]
    unit: str = ""
    change: float = 0.0
    change_pct: float = 0.0
    trend: Literal["up", "down", "flat"] = "flat"


class Chart(BaseModel):
    type: Literal["line", "bar", "pie", "scatter", "histogram"] = "bar"
    title: str = ""
    purpose: str = ""
    x_axis: str = ""
    y_axis: str = ""
    data_keys: list[str] = []
    annotation: str = ""
    insight: str = ""
    data: list[dict[str, Any]] = []


class Action(BaseModel):
    action: str
    impact: str = ""
    confidence: float = 0.0
    priority: Literal["high", "medium", "low"] = "medium"


def _to_str(v: Any) -> str:
    if isinstance(v, list):
        return "\n".join(str(i) for i in v)
    return "" if v is None else str(v)


class ReportSection(BaseModel):
    """One question-oriented subsection of the Body/Analysis."""
    question: str = ""      # The specific question this section answers
    methods: str = ""       # Statistical / analytical method used (1–2 sentences)
    findings: str = ""      # Evidence, numbers, and detailed analysis
    conclusion: str = ""    # Direct answer to the question

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for f in ("question", "methods", "findings", "conclusion"):
                if f in data:
                    data[f] = _to_str(data[f])
        return data


class Report(BaseModel):
    """
    Follows the standard Data Analysis Report structure:
    1. Introduction  2. Body/Analysis  3. Conclusions/Discussion  4. (Appendix in AnalyzeResponse)
    """
    # ── 1. Introduction ───────────────────────────────────────────────────────
    introduction: str = ""            # Study summary, data context, background
    big_questions: list[str] = []     # The 3-5 key questions the report answers
    introduction_summary: str = ""    # 2-3 sentence executive summary of conclusions

    # ── 2. Body (question-oriented Analysis) ──────────────────────────────────
    analysis: list[ReportSection] = []

    # ── 3. Conclusions / Discussion ───────────────────────────────────────────
    conclusions: str = ""             # Reprise of questions + conclusions + observations
    future_work: list[str] = []       # New questions, limitations, next steps

    # ── Risk Assessment ───────────────────────────────────────────────────────
    risks: list[str] = []             # Assumptions that could invalidate findings

    @model_validator(mode="before")
    @classmethod
    def coerce(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for f in ("introduction", "introduction_summary", "conclusions"):
                if f in data:
                    data[f] = _to_str(data[f])
            for f in ("risks", "future_work", "big_questions"):
                v = data.get(f)
                if isinstance(v, str):
                    data[f] = [v] if v else []
        return data


class Appendix(BaseModel):
    sql: str = ""
    code: str = ""
    data_quality: str = ""
    notes: str = ""

    @model_validator(mode="before")
    @classmethod
    def coerce_str_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ("sql", "code", "data_quality", "notes"):
                v = data.get(field)
                if isinstance(v, list):
                    data[field] = "\n".join(str(i) for i in v)
                elif v is None:
                    data[field] = ""
        return data


class ResponseMeta(BaseModel):
    confidence_overall: float = 0.0
    data_freshness: str = ""
    rows_analyzed: int = 0
    warnings: list[str] = []
    rules_applied: bool = False


class AnalyzeResponse(BaseModel):
    mode: str
    headline: str = ""
    kpis: list[KPI] = []
    charts: list[Chart] = []
    insights: list[str] = []
    actions: list[Action] = []
    report: Optional[Report] = None
    appendix: Optional[Appendix] = None
    meta: ResponseMeta = ResponseMeta()


# ─── Ingest ───────────────────────────────────────────────────────────────────

class IngestResponse(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    col_count: int
    columns: list[str]
    dtypes: dict[str, str]
    null_pct: dict[str, float]
    duplicate_rows: int
    warnings: list[str]


class DatasetListItem(BaseModel):
    dataset_id: str
    name: str
    rows: int
    columns: int
    warnings: list[str]


class QueryResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int


class ColumnStat(BaseModel):
    name: str
    dtype: str
    null_pct: float
    unique: int
    unique_pct: float
    is_numeric: bool
    is_date: bool
    sample_values: list[Any]
    min: Any = None
    max: Any = None
    mean: Any = None
    quality: int  # 0–100


class DatasetDetail(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    col_count: int
    columns: list[str]
    dtypes: dict[str, str]
    null_pct: dict[str, float]
    duplicate_rows: int
    warnings: list[str]
    column_stats: list[ColumnStat]
    preview: list[dict[str, Any]]


class DeleteResponse(BaseModel):
    deleted: bool
    dataset_id: str


# ─── Mock DB Schemas ──────────────────────────────────────────────────────────

class TeamMemberBase(BaseModel):
    name: str
    email: str
    role: str
    status: str
    initials: str
    color: str

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberUpdate(BaseModel):
    role: str

class TeamMemberResponse(TeamMemberBase):
    id: str
    joined_at: Any
    last_active: Optional[str] = None


class AlertBase(BaseModel):
    title: str
    description: str
    severity: str
    status: str
    metric: str
    threshold: float
    current_value: float
    dataset_id: Optional[str] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: str

class AlertResponse(AlertBase):
    id: str
    created_at: Any
    resolved_at: Optional[Any] = None


class IntegrationBase(BaseModel):
    name: str
    description: str
    category: str
    status: str
    icon: str
    color: str
    last_sync: Optional[str] = None

class IntegrationResponse(IntegrationBase):
    id: str

class IntegrationUpdate(BaseModel):
    status: str


class ScenarioBase(BaseModel):
    name: str
    variable: str
    change: float
    unit: str

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioResponse(ScenarioBase):
    id: str
