# Data Analysis Report Guide

## Core Principle

A report is not a summary of analysis.
It is a **structured argument** that answers business questions with evidence.

---

## Audience Layers

Write every report for three simultaneous readers:

| Audience | Needs | Served by |
|---|---|---|
| **Executive** | Key takeaway, impact, decision | Introduction + Conclusions |
| **Business Analyst** | Methodology, findings, nuance | Analysis section |
| **Technical Reviewer** | SQL, code, data provenance | Appendix |

---

## Required Report Structure

### 1. Introduction
- **Business context**: What is happening and why does it matter?
- **Key questions**: What specific questions does this report answer? (list them)
- **Summary conclusions**: Answer all key questions in 2–3 sentences each (for executives who read only this section)

### 2. Analysis (Question-Oriented)

For **each** key question:

#### Question: [State the question]
- **Methods**: Which analytical approach was used and why (brief, 1–2 sentences)
- **Analysis**: What the data shows (quantitative, supported by charts/tables)
- **Findings**: Key patterns, anomalies, or relationships discovered
- **Conclusion**: Direct answer to the question + business implication

### 3. Conclusions & Recommendations

- **Key takeaways**: Top 3–5 findings ranked by business impact
- **Business implications**: What these findings mean for decisions
- **Recommendations**: Specific, actionable steps with owners and timelines
- **Risks**: What could go wrong, what assumptions could break

### 4. Appendix

- Full SQL queries used
- Python/pandas logic (if applied)
- Raw data tables referenced in the analysis
- Methodology notes
- Data quality issues and how they were handled

---

## Writing Rules

- Lead with the insight, not the process
- Use plain language — avoid statistical jargon unless in the appendix
- Use bullet points for lists of 3+ items
- Never use passive voice for recommendations ("We recommend..." not "It is recommended...")
- Every number must have a unit and a comparison point
- Every chart in the body must have a 1-sentence callout below it

---

## Report Output Format

```json
{
  "mode": "report",
  "title": "string",
  "introduction": {
    "context": "string",
    "questions": ["string"],
    "summary": "string"
  },
  "analysis": [
    {
      "question": "string",
      "methods": "string",
      "findings": "string",
      "conclusion": "string"
    }
  ],
  "conclusions": {
    "takeaways": ["string"],
    "recommendations": [
      {
        "action": "string",
        "impact": "string",
        "confidence": 0.0,
        "owner": "string"
      }
    ],
    "risks": ["string"]
  },
  "appendix": {}
}
```
