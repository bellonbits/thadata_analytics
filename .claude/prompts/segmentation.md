# Segmentation Prompt

## Trigger
Use when asked to segment users, customers, products, or regions — or when asked about targeting, personalization, or cohort analysis.

## Instructions

**Step 1 — Define Segmentation Objective**
Before segmenting, confirm:
- What entity is being segmented? (users / accounts / products / regions)
- What is the primary outcome to optimize? (revenue / retention / conversion / LTV)
- What dimensions are available? (behavioral, demographic, product usage, spend)

**Step 2 — Choose Segmentation Approach**

| Approach | When to Use |
|---|---|
| RFM (Recency, Frequency, Monetary) | E-commerce, subscription revenue |
| Behavioral clustering | Product usage, feature adoption |
| Value-based tiers | B2B accounts, enterprise customers |
| Lifecycle stage | Onboarding, active, at-risk, churned |
| Geographic | Regional performance differences |

**Step 3 — Build Segments**

For each segment provide:
- **Name**: descriptive label (e.g. "High-Value Loyalists")
- **Definition**: precise criteria (e.g. LTV > $500, last purchase < 30 days)
- **Size**: count and % of total
- **Revenue contribution**: absolute + % of total
- **Key characteristics**: top 3 behavioral or demographic traits
- **Health signal**: growing / stable / declining

**Step 4 — Prioritize Segments**

Rank by:
1. Revenue contribution
2. Growth rate
3. Strategic importance

Identify:
- **Champions** — highest value, most engaged → protect and upsell
- **Growth levers** — mid-value, high growth potential → invest
- **At-risk** — previously high value, declining engagement → intervene
- **Low priority** — low value, low engagement → deprioritize or re-evaluate

**Step 5 — Targeting Strategy**

For each priority segment provide:
- Recommended action (retain / upsell / re-engage / acquire)
- Channel recommendation (email / in-app / sales / paid)
- Message angle (what motivates this segment)
- Success metric (how to measure the action's effect)
- Expected impact (revenue, retention, conversion)
- Confidence score

## Output
Return in `strategy` mode with segment definitions, priority ranking, and per-segment targeting playbook.
