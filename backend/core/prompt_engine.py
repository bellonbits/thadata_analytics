"""
Prompt engine — loads .claude/prompts/, builds structured prompts
for each analysis mode, and injects dataset context.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

PROMPTS_DIR = Path(__file__).parent.parent.parent / ".claude" / "prompts"
RULES_PATH = Path(__file__).parent.parent.parent / ".claude" / "rules.md"
API_CONTRACT_PATH = Path(__file__).parent.parent.parent / ".claude" / "api_contract.md"

_prompt_cache: dict[str, str] = {}


def _load_prompt(name: str) -> str:
    if name not in _prompt_cache:
        path = PROMPTS_DIR / f"{name}.md"
        if path.exists():
            _prompt_cache[name] = path.read_text()
        else:
            _prompt_cache[name] = ""
    return _prompt_cache[name]


def _load_rules() -> str:
    if RULES_PATH.exists():
        return RULES_PATH.read_text()
    return ""


RESPONSE_SCHEMA = """
REQUIRED RESPONSE SCHEMA — return exactly this structure as valid JSON:
{
  "mode": "dashboard | report | insights | strategy",
  "headline": "string — top insight in one sentence",
  "kpis": [
    {
      "name": "string",
      "value": "number",
      "unit": "string",
      "change": "number",
      "change_pct": "number",
      "trend": "up | down | flat"
    }
  ],
  "charts": [
    {
      "type": "line | bar | pie | scatter | histogram",
      "title": "string",
      "purpose": "string",
      "x_axis": "string",
      "y_axis": "string",
      "data_keys": ["string"],
      "annotation": "string",
      "insight": "string",
      "data": [{"key": "value"}]
    }
  ],
  "insights": ["string"],
  "actions": [
    {
      "action": "string",
      "impact": "string",
      "confidence": 0.0,
      "priority": "high | medium | low"
    }
  ],
  "report": {
    "introduction": "string — 2-3 paragraphs: study summary, data used, context/background",
    "big_questions": ["string — each key question the report answers (3-5 questions)"],
    "introduction_summary": "string — 2-3 sentences answering every big question in brief, for executives who only read this",
    "analysis": [
      {
        "question": "string — the specific question this subsection answers",
        "methods": "string — 1-2 sentences describing the analytical/statistical method used",
        "findings": "string — detailed evidence, numbers, and analysis supporting the answer",
        "conclusion": "string — direct answer to the question, stated plainly"
      }
    ],
    "conclusions": "string — reprises big_questions and conclusions, adds observations, ranked by business impact",
    "future_work": ["string — new questions raised, limitations, or recommended next steps"],
    "risks": ["string — assumptions or conditions that could invalidate the findings"]
  },
  "appendix": {
    "sql": "string",
    "code": "string",
    "data_quality": "string",
    "notes": "string"
  },
  "meta": {
    "confidence_overall": 0.0,
    "data_freshness": "string",
    "rows_analyzed": 0,
    "warnings": ["string"]
  }
}
"""


def build_prompt(
    *,
    mode: str,
    problem: str,
    context: dict[str, Any],
    objective: str,
    constraints: list[str],
    parameters: dict[str, Any],
    data_summary: str,
    sample_rows: str,
    schema_info: str,
) -> str:
    """Build a full structured prompt for the given analysis mode."""

    mode_prompt = _load_prompt(mode) or _load_prompt("analyst")
    rules = _load_rules()

    constraints_text = "\n".join(f"- {c}" for c in constraints) if constraints else "None specified"

    prompt = f"""# ANALYSIS REQUEST

## Mode: {mode.upper()}

## Problem
{problem}

## Context
- Dataset: {context.get('dataset', 'Not specified')}
- Industry: {context.get('industry', 'Not specified')}
- Time Range: {context.get('time_range', 'Not specified')}

## Objective
{objective}

## Constraints
{constraints_text}

## Parameters
{json.dumps(parameters, indent=2)}

---

## DATASET SCHEMA
{schema_info}

## DATA SUMMARY (statistics)
{data_summary}

## SAMPLE ROWS (first 10)
{sample_rows}

---

## ANALYSIS INSTRUCTIONS
{mode_prompt}

---

## BUSINESS RULES (enforce strictly)
{rules}

---

{RESPONSE_SCHEMA}

Analyze the data above and return the JSON response. Include actual computed values from the data in kpis and charts.data. Do not make up numbers — use the dataset provided."""

    return prompt


def build_quick_prompt(question: str, data_summary: str, schema_info: str) -> str:
    """Lightweight prompt for quick questions without full context."""
    return f"""# QUICK DATA QUESTION

{question}

## DATASET SCHEMA
{schema_info}

## DATA SUMMARY
{data_summary}

{RESPONSE_SCHEMA}

Answer the question using the data. Return valid JSON."""
