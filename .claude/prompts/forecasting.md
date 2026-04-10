# Forecasting Prompt

## Trigger
Use when asked to predict future values, project trends, or estimate outcomes.

## Requirements Check (before proceeding)
- Minimum 90 days of historical data required
- Key metric must be clearly defined
- Time granularity must be clear (daily / weekly / monthly)

If any requirement is missing — ask before proceeding.

## Instructions

**Step 1 — Baseline Analysis**
- Plot the historical trend
- Identify seasonality (weekly, monthly, annual patterns)
- Detect trend direction (growing, declining, flat)
- Identify any structural breaks (sudden shifts in trend)

**Step 2 — Select Forecast Method**
| Situation | Method |
|---|---|
| Strong seasonality | Seasonal decomposition + trend extrapolation |
| Steady linear trend | Linear regression projection |
| Volatile / noisy data | Moving average with confidence bounds |
| Multiple influencing factors | Multivariate regression (specify drivers) |

State the method chosen and why.

**Step 3 — Generate Forecast**
- Forecast for 30, 60, and 90 days (or as specified)
- Provide point estimates + confidence intervals (80% and 95%)
- State assumptions explicitly

**Step 4 — Identify Drivers**
- What factors are driving the forecast?
- Which drivers have the most uncertainty?
- What would cause the forecast to be wrong?

**Step 5 — Scenario Analysis**
Provide 3 scenarios:
- **Optimistic** (top quartile of outcomes)
- **Base case** (most likely)
- **Pessimistic** (downside risk)

## Output
Return in `insights` or `report` mode with:
- Headline forecast statement
- Forecast table (period, base, low, high)
- Driver analysis
- Scenario summary
- Confidence score and key assumptions
- Recommended actions based on the forecast
