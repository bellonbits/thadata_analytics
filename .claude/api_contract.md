# API Contract — FastAPI ↔ Claude ↔ Next.js

## Architecture

```
User (Next.js UI)
      ↓  HTTP Request
FastAPI Backend
      ↓  Prompt + Data
   Claude API
      ↓  Structured JSON
FastAPI Backend
      ↓  Response
Next.js Dashboard / Report Renderer
```

---

## Request Schema

Sent by FastAPI to Claude:

```json
{
  "problem": "string — the business question to answer",
  "context": {
    "dataset": "string — dataset name or inline data reference",
    "industry": "string — e.g. ecommerce, SaaS, fintech",
    "time_range": "string — e.g. last 90 days, Q1 2025"
  },
  "objective": "string — desired outcome of analysis",
  "constraints": [
    "string — business rules or limits (e.g. max price increase 10%)"
  ],
  "output": "dashboard | report | insights | strategy",
  "parameters": {
    "segments": ["string — e.g. user_tier, region, product_category"],
    "confidence_threshold": 0.70,
    "forecast_horizon_days": 30
  }
}
```

---

## Response Schema

Returned by Claude to FastAPI:

```json
{
  "mode": "dashboard | report | insights | strategy",
  "headline": "string — top-level insight in one sentence",
  "kpis": [
    {
      "name": "string",
      "value": "number",
      "unit": "string — e.g. USD, %, count",
      "change": "number — delta from previous period",
      "change_pct": "number",
      "trend": "up | down | flat"
    }
  ],
  "charts": [
    {
      "type": "line | bar | pie | scatter | histogram",
      "title": "string",
      "purpose": "string — what question does this chart answer?",
      "x_axis": "string — column name",
      "y_axis": "string — column name",
      "data_keys": ["string"],
      "annotation": "string — key data point to highlight",
      "insight": "string — one-sentence takeaway from this chart"
    }
  ],
  "insights": [
    "string — actionable insight with quantified impact"
  ],
  "actions": [
    {
      "action": "string — specific recommended action",
      "impact": "string — estimated outcome (e.g. +$12,400 revenue)",
      "confidence": 0.91,
      "priority": "high | medium | low"
    }
  ],
  "report": {
    "introduction": "string",
    "analysis": [
      {
        "question": "string",
        "findings": "string",
        "conclusion": "string"
      }
    ],
    "conclusions": "string",
    "risks": ["string"]
  },
  "appendix": {
    "sql": "string",
    "code": "string",
    "data_quality": "string",
    "notes": "string"
  },
  "meta": {
    "confidence_overall": 0.85,
    "data_freshness": "string — e.g. 2025-04-10",
    "rows_analyzed": 0,
    "warnings": ["string"]
  }
}
```

---

## FastAPI Endpoint Convention

```
POST /analyze
  Body: RequestSchema
  Returns: ResponseSchema

POST /ingest
  Body: { source_type, connection_string | file_url | inline_data }
  Returns: { dataset_id, schema_preview, quality_report }

GET /datasets/{dataset_id}
  Returns: { schema, row_count, preview }

POST /query
  Body: { dataset_id, sql | pipeline }
  Returns: { rows, columns, execution_time_ms }
```

---

## Notes

- Claude **never** returns raw unstructured prose when called via API
- All API responses must be **valid JSON** conforming to the response schema above
- The `appendix.sql` field contains any queries used, for transparency
- `meta.warnings` carries any data quality issues that affected the analysis
- Next.js renders conditionally based on `mode` — ensure mode is always set
