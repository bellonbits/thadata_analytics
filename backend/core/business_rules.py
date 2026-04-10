"""
Business rules engine — validates AI-generated actions against
defined thresholds before they reach the frontend.
"""
from __future__ import annotations

from typing import Any


def validate_response(response: dict[str, Any]) -> dict[str, Any]:
    """
    Apply business rules to the Groq response.
    - Filter out low-confidence actions
    - Flag rule violations
    - Enforce priority hierarchy
    """
    warnings = response.get("meta", {}).get("warnings", [])
    actions = response.get("actions", [])
    confidence_threshold = 0.70

    validated_actions = []
    for action in actions:
        confidence = action.get("confidence", 0)
        if confidence < confidence_threshold:
            warnings.append(
                f"Action blocked (confidence {confidence:.0%} < {confidence_threshold:.0%}): "
                f"{action.get('action', 'Unknown action')}"
            )
        else:
            validated_actions.append(action)

    # Apply pricing guard
    for action in validated_actions:
        text = action.get("action", "").lower()
        if "price" in text and "increase" in text:
            impact = action.get("impact", "")
            if "conversion" in impact.lower() and any(
                c in impact for c in ["10%", "11%", "12%", "15%", "20%"]
            ):
                action["priority"] = "low"
                warnings.append(
                    f"Pricing action flagged: potential conversion drop detected — {action['action']}"
                )

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    validated_actions.sort(key=lambda a: priority_order.get(a.get("priority", "low"), 2))

    response["actions"] = validated_actions
    if "meta" not in response:
        response["meta"] = {}
    response["meta"]["warnings"] = warnings
    response["meta"]["rules_applied"] = True

    return response


def check_roi(roi: float) -> str:
    """Return recommendation based on ROI threshold."""
    if roi < 1.2:
        return "cut"
    if roi > 2.5:
        return "scale"
    return "monitor"


def check_anomaly(value: float, baseline: float) -> bool:
    """Return True if deviation exceeds 20% threshold."""
    if baseline == 0:
        return False
    return abs(value - baseline) / abs(baseline) > 0.20
