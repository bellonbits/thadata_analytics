# Data Analysis Report — Generation Instructions

## Purpose
Generate a professional data analysis report written for three simultaneous audiences:

- **Primary (collaborator/client):** Reads Introduction + Conclusion, skims Body stopping at interesting evidence. Organize around a conversation agenda: general → specific, or most important → least important.
- **Secondary (executive):** Only skims Introduction headline and Conclusion. Leave clear signposts ("Key Finding:", "Conclusion:") so they can extract headlines in 60 seconds.
- **Secondary (technical reviewer):** Reads Body carefully, examines Appendix for quality control. Uses cross-references between Body and Appendix. Must see defensible statistical methods.

---

## Report Structure — Follow Exactly

### 1. Introduction (`introduction` field)
Write 2–3 paragraphs covering in order:
1. Summary of the study, the data used, and any relevant context or background
2. The "big questions" answered by this analysis (list them explicitly in `big_questions`)
3. A brief executive-facing summary of conclusions (`introduction_summary`) — answer every big question in 1–2 sentences so an executive who reads only this section gets the full picture

### 2. Body — Question-Oriented Analysis (`analysis` array)
Create one `ReportSection` per big question, in the same order as listed in `big_questions`.

Each section must contain:
- **`question`**: State the question clearly as if it were a section header
- **`methods`**: 1–2 sentences describing the statistical or analytical method used. Be specific: "Computed month-over-month percentage change using rolling 30-day windows" not just "calculated trends".
- **`findings`**: The substantive analysis — present evidence with actual numbers, percentages, and comparisons. This is the main value for the technical reviewer. Avoid vague prose; be quantitative.
- **`conclusion`**: A direct, plain-language answer to the question. No hedging if the data supports it. Start with the answer, then qualify if needed.

Rule: provide just enough in the body to make each point. Detailed tables, extra graphs, and code go in the Appendix — cross-reference them explicitly: "See Appendix: SQL Queries" or "See Appendix: Methodology."

### 3. Conclusions / Discussion (`conclusions` field)
- Reprise the big questions and their answers in ranked order (most important business impact first)
- Add any additional observations or nuances that emerged from the analysis
- Write specific, ownable recommendations: who should act, what they should do, why

### 4. Future Work (`future_work` array)
List new questions raised by this analysis, limitations of the current study, or recommended next steps for deeper investigation.

### 5. Risks (`risks` array)
List assumptions and conditions that could invalidate the findings. Be honest about data quality issues, sample size limits, or confounding factors.

### 6. Appendix (`appendix` field — separate from `report`)
- `sql`: All SQL or DuckDB queries used, with inline comments explaining what each does
- `notes`: Technical methodology details too granular for the body; describe why each technique was chosen
- `data_quality`: Specific data quality observations (null rates, outliers, suspicious values)
- `code`: Any additional code or formulas used

---

## Writing Style Rules
- **Invisible writing**: The reader should remember the content, not the prose. No flowery language, no filler sentences.
- **Quantify everything**: Every finding should have a number. "Revenue dropped significantly" → "Revenue dropped 18.4% MoM, from $2.1M to $1.7M."
- **Headlines for skimmers**: Each `conclusion` field should work as a standalone headline.
- **Cross-reference the Appendix**: When you mention a method or a table in the body, point to where in the Appendix the reader can find more detail.
- **Word count**: Honor the requested word count constraint. Distribute words proportionally: ~20% Introduction, ~60% Analysis body, ~15% Conclusions, ~5% Future Work/Risks.
