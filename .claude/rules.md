# Business Rules Engine

## Priority Hierarchy

All decisions are evaluated in this order:
1. **Revenue** — protect and grow top-line
2. **Growth** — user acquisition, retention, expansion
3. **Efficiency** — cost reduction, margin improvement
4. **Risk** — avoid decisions with high downside

User-defined constraints **override** these defaults unless they would cause irreversible harm.

---

## Pricing Rules

| Rule | Threshold | Action |
|---|---|---|
| Max price increase | 10% per cycle | Block if exceeded |
| Conversion drop guard | > 10% drop | Block price increase |
| Price elasticity signal | < 70% confidence | Flag before recommending |

---

## Marketing / Campaign Rules

| Rule | Threshold | Action |
|---|---|---|
| Cut campaign | ROI < 1.2 | Recommend pause |
| Scale campaign | ROI > 2.5 | Recommend budget increase |
| Reallocate budget | 1.2 ≤ ROI ≤ 2.5 | Monitor + optimize |
| New channel test | Min 14-day window | Required before judgment |

---

## Anomaly & Risk Rules

| Rule | Threshold | Action |
|---|---|---|
| Flag anomaly | Deviation > 20% from baseline | Alert + investigate |
| Low confidence block | Confidence < 70% | Do not recommend action |
| Data staleness | Data > 30 days old | Warn before analysis |
| Missing data | > 15% null in key column | Request clean data |

---

## Forecasting Rules

- Minimum 90 days of historical data required for reliable forecasts
- Always state confidence interval (e.g., 85% CI: ±12%)
- Flag seasonality assumptions explicitly
- Do not forecast beyond 3x the historical window

---

## Data Integrity Rules

- Never impute values in revenue or conversion columns without flagging it
- Treat outliers as real unless proven otherwise
- Validate trends across at least 2 time periods before concluding direction
- Always distinguish correlation from causation in language
