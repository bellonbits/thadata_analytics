import React from "react";
import { AnalyzeResponse } from "@/lib/types";
import { KPICard } from "../ui/KPICard";
import { ChartRenderer } from "../charts/ChartRenderer";
import { AlertCircle, Brain, Zap } from "lucide-react";

export function DashboardView({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPI Grid */}
      {data.kpis.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {data.kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
        </div>
      )}

      {/* Charts + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: data.insights.length || data.actions.length ? "1fr 300px" : "1fr", gap: 18, alignItems: "start" }}>

        {/* Charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {data.charts.map((chart, i) => <ChartRenderer key={i} chart={chart} />)}
          {data.charts.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No charts generated for this analysis.
            </div>
          )}
        </div>

        {/* Insights + Actions sidebar */}
        {(data.insights.length > 0 || data.actions.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {data.insights.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Brain size={16} color="#a78bfa" /> Key Insights
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.insights.map((insight, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginTop: 6, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{insight}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.actions.length > 0 && (
              <div className="card" style={{ border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)" }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Zap size={16} color="var(--green)" /> Recommended Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.actions.map((action, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{action.action}</span>
                        <span className={`badge ${action.priority === "high" ? "badge-red" : action.priority === "medium" ? "badge-orange" : "badge-green"}`}>
                          {action.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{action.impact}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        Confidence: <strong style={{ color: "var(--green)" }}>{Math.round(action.confidence * 100)}%</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "12px 16px", borderRadius: "var(--radius)", background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <span>Confidence: <strong style={{ color: "var(--green)" }}>{(data.meta.confidence_overall * 100).toFixed(0)}%</strong></span>
          <span>Rows: <strong style={{ color: "var(--text-secondary)" }}>{data.meta.rows_analyzed.toLocaleString()}</strong></span>
          {data.meta.data_freshness && <span>Freshness: <strong>{data.meta.data_freshness}</strong></span>}
        </div>
        {data.meta.warnings.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#f59e0b" }}>
            <AlertCircle size={12} /> {data.meta.warnings.length} warning{data.meta.warnings.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
