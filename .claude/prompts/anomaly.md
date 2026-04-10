# Anomaly Detection Prompt

## Trigger
Use when asked to detect anomalies, investigate unusual patterns, explain spikes or drops, or audit data for integrity.

## Instructions

**Step 1 — Statistical Baseline**
- Calculate mean, median, and standard deviation for each metric
- Establish expected range: [mean ± 2σ] for normal, [mean ± 3σ] for extreme
- Identify rolling baseline for time-series data (28-day rolling average recommended)

**Step 2 — Detect Anomalies**

Types to check:

| Type | Detection Method | Threshold |
|---|---|---|
| Point anomaly (spike/drop) | Z-score or IQR | \|z\| > 2.5 or outside Q1-1.5×IQR |
| Trend anomaly | Trend break detection | > 20% deviation from trend |
| Contextual anomaly | Compare to same period prior year | > 15% unexpected deviation |
| Collective anomaly | Cluster of abnormal values | 3+ consecutive periods anomalous |
| Missing data anomaly | Gap detection | Unexpected nulls in key columns |

**Step 3 — Explain Each Anomaly**
For every detected anomaly provide:
- What: the metric and the anomalous value
- When: the time period affected
- Magnitude: % deviation from baseline
- Direction: spike (above) or drop (below)
- Potential cause: correlate with other variables, events, or known changes
- Business impact: estimated revenue / user / conversion effect
- Confidence in explanation: %

**Step 4 — Prioritize Anomalies**
Rank by:
1. Business impact (highest first)
2. Confidence in detection
3. Recency (more recent = higher priority)

**Step 5 — Recommend Actions**
For each high-priority anomaly:
- Investigate: what data or context is needed to confirm root cause?
- Respond: what immediate action should be taken?
- Prevent: what process change prevents recurrence?

## Output
Return in `insights` mode with anomaly list, ranked by impact.
Each anomaly entry must include: metric, period, deviation %, cause hypothesis, impact estimate, confidence, recommended action.
