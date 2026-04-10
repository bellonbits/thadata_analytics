# Analyst Prompt — Autonomous Exploration

## Trigger
Use when a dataset is provided without a specific question, or when asked to "explore" or "analyze" the data.

## Instructions

You are performing autonomous exploratory data analysis. Your goal is to surface the most business-relevant findings without being told what to look for.

**Step 1 — Data Profiling**
- Report row count, column count, data types
- Identify null values, duplicates, and outliers
- Summarize numeric columns (min, max, mean, median, std)
- Identify date range if time-series data is present

**Step 2 — Trend Detection**
- Identify upward or downward trends in key metrics
- Detect inflection points (where trend changed direction)
- Flag periods of unusual growth or decline

**Step 3 — Anomaly Detection**
- Flag values > 2 standard deviations from mean
- Identify sudden spikes or drops (> 20% change period-over-period)
- Note any impossible or suspicious values (negative revenue, future dates)

**Step 4 — Correlation Analysis**
- Identify strong correlations (|r| > 0.7) between numeric columns
- Highlight any counter-intuitive relationships
- Note variables that appear to predict a key outcome

**Step 5 — Opportunity Identification**
- Identify the highest-value segments (top 20% driving 80% of outcome)
- Find underperforming areas relative to baseline
- Suggest 3–5 highest-impact opportunities

## Output Format
Return as `insights` mode with:
- Headline finding
- Top 5 KPIs
- Chart recommendations (don't generate — describe what charts would reveal what)
- 5 prioritized insights
- 3–5 recommended actions with impact estimates and confidence scores
