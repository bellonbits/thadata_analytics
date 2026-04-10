"""
Groq AI client — wraps the Groq SDK with structured JSON output enforcement,
retry logic, and model routing (content vs grading).
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Literal, Optional

from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

_client: Optional[AsyncGroq] = None


def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = AsyncGroq(api_key=api_key)
    return _client


MODEL_CONTENT = os.getenv("GROQ_MODEL_CONTENT", "meta-llama/llama-4-scout-17b-16e-instruct")
MODEL_GRADING = os.getenv("GROQ_MODEL_GRADING", "meta-llama/llama-4-scout-17b-16e-instruct")

SYSTEM_PROMPT = """You are Thadata Analytics — an autonomous AI data analyst and decision intelligence engine.

Your role: Senior Data Analyst + Data Scientist + BI Engineer + Strategy Consultant.

CRITICAL RULES:
- Always return VALID JSON that matches the requested schema exactly.
- Never hallucinate data or metrics.
- Always quantify impact (revenue, cost, conversion, churn).
- Always include confidence scores (0.0 to 1.0).
- Always recommend actions — not just observations.
- Flag any data quality issues in meta.warnings.
- Confidence < 0.70 → do not recommend action, flag instead.

Priority order for all decisions: Revenue → Growth → Efficiency → Risk.

Output ONLY valid JSON. No markdown, no prose, no code blocks. Pure JSON."""


async def chat(
    user_prompt: str,
    model_type: Literal["content", "grading"] = "content",
    temperature: float = 0.3,
    max_tokens: int = 8192,
    extra_system: str = "",
) -> dict[str, Any]:
    """
    Send a prompt to Groq and return a parsed JSON dict.
    Retries once on JSON parse failure with a correction prompt.
    """
    model = MODEL_CONTENT if model_type == "content" else MODEL_GRADING
    client = get_client()

    system = SYSTEM_PROMPT
    if extra_system:
        system = f"{system}\n\n{extra_system}"

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    raw = response.choices[0].message.content or ""
    return await _parse_json(raw, messages, client, model, temperature, max_tokens)


async def _parse_json(
    raw: str,
    messages: list,
    client: AsyncGroq,
    model: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    """Parse JSON from response, retry once if malformed."""
    cleaned = _extract_json(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Retry with correction
        retry_messages = messages + [
            {"role": "assistant", "content": raw},
            {
                "role": "user",
                "content": (
                    "Your previous response was not valid JSON. "
                    "Return ONLY the corrected JSON object with no additional text."
                ),
            },
        ]
        retry_response = await client.chat.completions.create(
            model=model,
            messages=retry_messages,
            temperature=0.1,
            max_tokens=max_tokens,
        )
        retry_raw = retry_response.choices[0].message.content or ""
        retry_cleaned = _extract_json(retry_raw)
        try:
            return json.loads(retry_cleaned)
        except json.JSONDecodeError as e:
            raise ValueError(f"Groq returned non-JSON after retry: {e}\nRaw: {retry_raw[:500]}")


def _extract_json(text: str) -> str:
    """Strip markdown code fences and extract JSON content."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    # Find first { or [
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        if start != -1:
            end = text.rfind(end_char)
            if end != -1:
                return text[start:end + 1]
    return text
