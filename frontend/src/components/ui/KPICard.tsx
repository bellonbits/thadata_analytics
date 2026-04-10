import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { KPI as KPIType } from "@/lib/types";

export function KPICard({ kpi }: { kpi: KPIType }) {
  const up      = kpi.trend === "up"   || kpi.change > 0;
  const down    = kpi.trend === "down" || kpi.change < 0;
  const neutral = !up && !down;

  const trendColor = up ? "var(--green)" : down ? "var(--red)" : "var(--text-muted)";
  const TrendIcon  = neutral ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="kpi-card">
      {/* Trend badge top-right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span className="kpi-card-label" style={{ marginBottom: 0 }}>{kpi.name}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 700, color: trendColor }}>
          <TrendIcon size={14} />
          {kpi.change_pct !== 0 && `${kpi.change_pct > 0 ? "+" : ""}${kpi.change_pct.toFixed(1)}%`}
        </span>
      </div>

      {/* Value */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="kpi-card-value">
          {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
        </span>
        {kpi.unit && (
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{kpi.unit}</span>
        )}
      </div>

      {/* Change absolute */}
      {kpi.change !== 0 && (
        <div className="kpi-card-footer">
          <span className="kpi-card-prev">vs prev period</span>
          <span style={{ color: trendColor, fontWeight: 700, fontSize: 12 }}>
            {kpi.change > 0 ? "+" : ""}{typeof kpi.change === "number" ? kpi.change.toLocaleString() : kpi.change}
          </span>
        </div>
      )}
    </div>
  );
}
