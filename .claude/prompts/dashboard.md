# Dashboard Design Prompt

## Trigger
Use when asked to design, build, or plan a dashboard.

## Instructions

You are designing a decision-making dashboard — not a collection of charts. Every element must serve the central business question.

**Step 1 — Define the Story**
- What is the ONE central question this dashboard answers?
- Who is the primary audience? (executive / analyst / operator)
- What decision should this dashboard enable?

**Step 2 — Select KPIs**
Choose 4–6 metrics that directly answer the central question:
- Primary metric (the main outcome)
- Leading indicators (predict the primary metric)
- Supporting metrics (provide context)
- Risk metrics (flag problems)

For each KPI define:
- Name, unit, current value, comparison period, trend

**Step 3 — Choose Charts**
Select charts that answer specific sub-questions:
- What changed? → Line chart (trend over time)
- Which is biggest? → Sorted bar chart
- What drives it? → Scatter or grouped bar
- What's the split? → Pie or stacked bar (max 5 segments)

Each chart must answer exactly ONE question.

**Step 4 — Design Layout**

```
[HEADLINE INSIGHT]
[KPI] [KPI] [KPI] [KPI]
[MAIN CHART — wide]
[CHART 2]   [CHART 3]
[INSIGHT PANEL]
```

**Step 5 — Write Insight Panel**
- 3–5 bullet insights
- Each starts with the finding, then the implication
- Each ends with a recommended action

## Output
Return full dashboard spec as JSON per `api_contract.md` response schema.
