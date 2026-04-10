# Dashboarding Guide — Storytelling with Data

## Core Principle

A dashboard is not a collection of charts.
It is a **decision-making interface** that answers one central business question.

---

## Required Structure

### 1. Headline Insight
- One sentence that captures the most important takeaway
- Written for an executive — no jargon
- Example: "Revenue is up 18% MoM but churn risk has increased among mid-tier users"

### 2. KPI Summary (4–6 metrics)
Each KPI card must include:
- Metric name
- Current value
- Change (absolute + %)
- Trend direction (up / down / flat)
- Color signal: green (positive) / red (negative) / amber (neutral)

### 3. Main Charts (1–3 charts)
Each chart answers **one specific question**.
Must include:
- Chart title (as a question or clear statement)
- Annotation highlighting the key insight
- Data source reference

### 4. Supporting Charts (optional, 2–4)
Provide context or breakdown for the main charts.

### 5. Actionable Insights Panel
- 3–5 bullet insights
- Each tied to a recommended action
- Each with estimated impact and confidence score

---

## Chart Selection Rules

| Goal | Chart Type |
|---|---|
| Show change over time | Line chart |
| Compare categories | Bar chart (horizontal preferred) |
| Show composition | Pie / Donut (max 5 segments) |
| Show relationships | Scatter plot |
| Show distribution | Histogram / Box plot |
| Show ranking | Sorted bar chart |
| Show geography | Map |

## Design Rules

- **Remove all chart junk** — no 3D, no decorative elements
- **Highlight key data points** — use color or annotation, not volume
- **Color intentionally** — one accent color for insights, gray for context
- **Label clearly** — no legend if labels can go directly on the chart
- **Every axis must have a unit**

---

## Output Format for Dashboard Response

```json
{
  "headline": "string",
  "kpis": [...],
  "charts": [
    {
      "type": "line | bar | pie | scatter",
      "title": "string",
      "purpose": "What question does this chart answer?",
      "data_keys": ["x_axis", "y_axis"],
      "annotation": "string",
      "insight": "string"
    }
  ],
  "insights": ["string"],
  "actions": [
    {
      "action": "string",
      "impact": "string",
      "confidence": 0.0
    }
  ]
}
```
