"""
Analysis engine — orchestrates the full pipeline:
dataset retrieval → prompt building → Groq call → rule validation → response.
"""
from __future__ import annotations

from typing import Any, Optional

from core.groq_client import chat
from core.prompt_engine import build_prompt, build_quick_prompt
from core.business_rules import validate_response
from services.data_processor import (
    get_schema_info,
    get_data_summary,
    get_sample_rows,
    get_chart_data,
    dataset_exists,
)


async def run_analysis(
    *,
    mode: str,
    problem: str,
    context: dict[str, Any],
    objective: str,
    constraints: list[str],
    parameters: dict[str, Any],
    dataset_id: Optional[str] = None,
    inline_data: Optional[str] = None,
) -> dict[str, Any]:
    """
    Full analysis pipeline.
    Returns a validated structured response conforming to api_contract.md.
    """

    # ── Gather data context ───────────────────────────────────────────────────
    if dataset_id and dataset_exists(dataset_id):
        schema_info = get_schema_info(dataset_id)
        data_summary = get_data_summary(dataset_id)
        sample_rows = get_sample_rows(dataset_id)
    elif inline_data:
        # Quick inline CSV
        from services.data_processor import ingest_csv_string
        result = ingest_csv_string(inline_data)
        dataset_id = result["dataset_id"]
        schema_info = get_schema_info(dataset_id)
        data_summary = get_data_summary(dataset_id)
        sample_rows = get_sample_rows(dataset_id)
    else:
        schema_info = "No dataset provided."
        data_summary = "No dataset provided."
        sample_rows = "No dataset provided."

    # ── Build prompt ─────────────────────────────────────────────────────────
    prompt = build_prompt(
        mode=mode,
        problem=problem,
        context=context,
        objective=objective,
        constraints=constraints,
        parameters=parameters,
        data_summary=data_summary,
        sample_rows=sample_rows,
        schema_info=schema_info,
    )

    # ── Call Groq ─────────────────────────────────────────────────────────────
    raw_response = await chat(prompt, model_type="content")

    # ── Ensure mode is set ────────────────────────────────────────────────────
    if "mode" not in raw_response or not raw_response["mode"]:
        raw_response["mode"] = mode

    # ── Hydrate chart data from actual dataset ────────────────────────────────
    if dataset_id and dataset_exists(dataset_id):
        raw_response = _hydrate_charts(raw_response, dataset_id)

    # ── Apply business rules ──────────────────────────────────────────────────
    validated = validate_response(raw_response)

    return validated


def _hydrate_charts(response: dict[str, Any], dataset_id: str) -> dict[str, Any]:
    """
    If charts have x_axis/y_axis defined but no data,
    pull actual data from the dataset.
    """
    charts = response.get("charts", [])
    for chart in charts:
        if not chart.get("data") and chart.get("x_axis") and chart.get("y_axis"):
            try:
                chart["data"] = get_chart_data(
                    dataset_id,
                    chart["x_axis"],
                    chart["y_axis"],
                    limit=60,
                )
            except Exception:
                chart["data"] = []
    return response


async def run_quick_question(
    question: str,
    dataset_id: Optional[str] = None,
) -> dict[str, Any]:
    """Lightweight Q&A against a dataset."""
    if dataset_id and dataset_exists(dataset_id):
        schema_info = get_schema_info(dataset_id)
        data_summary = get_data_summary(dataset_id)
    else:
        schema_info = "No dataset."
        data_summary = "No dataset."

    prompt = build_quick_prompt(question, data_summary, schema_info)
    response = await chat(prompt, model_type="content", max_tokens=4096)

    if "mode" not in response:
        response["mode"] = "insights"

    return validate_response(response)
