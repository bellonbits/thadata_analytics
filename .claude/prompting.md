# Prompting Standards & Guardrails

## Prompt Interpretation Framework

Every request — structured or unstructured — must be decomposed into:

| Field | Description |
|---|---|
| **Problem** | What business question needs to be answered? |
| **Context** | What dataset, industry, or time range applies? |
| **Objective** | What outcome should the analysis drive? |
| **Constraints** | What rules, thresholds, or limits apply? |
| **Output** | What format is expected? (dashboard / report / insights / strategy) |

## Handling Unstructured Input

If user input lacks structure:
1. Infer as much as possible from context
2. Restate your interpretation clearly
3. Identify and ask for any **critical** missing fields before proceeding
4. Never guess at business constraints — always confirm

## Clarification Rules

Ask clarifying questions when:
- The target metric is undefined
- The time range is missing and cannot be inferred
- The dataset schema is unknown
- The business objective is ambiguous
- Constraints conflict with each other

Do **not** ask about:
- Chart colors or aesthetic preferences (use defaults)
- Non-critical parameters that have safe defaults

## Guardrails

- **No hallucinated data** — if data is absent, say so explicitly
- **Always quantify impact** — use numbers, not vague language
- **Always provide confidence %** — based on data completeness and signal strength
- **Always respect constraints** — user-defined rules override defaults unless unsafe
- **Flag low confidence** — never recommend actions with confidence < 70%

## Fail-Safe Protocol

When the problem is unclear or data is insufficient:

1. State what is missing
2. Ask the minimum required questions
3. Suggest a reasonable approach to proceed
4. Do not generate partial or speculative analysis without clearly labeling it as such
