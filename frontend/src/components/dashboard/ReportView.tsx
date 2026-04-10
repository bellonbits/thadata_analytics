import React from "react";
import { AnalyzeResponse } from "@/lib/types";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import {
  FileText, ClipboardList, AlertTriangle, Lightbulb,
  CheckCircle2, BarChart2, HelpCircle, FlaskConical,
  ArrowRight, Telescope,
} from "lucide-react";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionNumber({ n, color = "var(--accent-light)" }: { n: number | string; color?: string }) {
  return (
    <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-muted)", color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
      {n}
    </span>
  );
}

function SectionHeading({ n, title, color = "var(--accent-light)", icon: Icon }: {
  n: number | string; title: string; color?: string; icon?: React.ElementType;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
      <SectionNumber n={n} color={color} />
      {Icon && <Icon size={18} color={color} style={{ flexShrink: 0 }} />}
      <h2 style={{ fontWeight: 800, fontSize: 20, color, letterSpacing: "-0.3px" }}>{title}</h2>
    </div>
  );
}

function PillLabel({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color, background: `${color}18`, padding: "3px 8px", borderRadius: 99, display: "inline-block", marginBottom: 6 }}>
      {text}
    </span>
  );
}

// ─── ReportView ───────────────────────────────────────────────────────────────

interface Props {
  data: AnalyzeResponse;
  showCharts?: boolean;
}

export function ReportView({ data, showCharts = false }: Props) {
  const { report, appendix, actions, charts, meta } = data;

  if (!report) return (
    <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
      No report data returned. Try again with a more specific problem statement.
    </div>
  );

  const hasCharts = showCharts && charts && charts.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36, maxWidth: 900, margin: "0 auto" }}>

      {/* ── Report meta bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FileText size={13} /> Data Analysis Report</span>
        <span>·</span>
        <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        <span>·</span>
        <span>Overall confidence: <strong style={{ color: "var(--green)" }}>{(meta.confidence_overall * 100).toFixed(0)}%</strong></span>
        {meta.rows_analyzed > 0 && <><span>·</span><span>{meta.rows_analyzed.toLocaleString()} rows analyzed</span></>}
        {meta.warnings.length > 0 && <><span>·</span><span style={{ color: "#f59e0b" }}>⚠ {meta.warnings.length} data warning{meta.warnings.length > 1 ? "s" : ""}</span></>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Introduction
          Audience: ALL. Executive stops here; client uses as overview; tech reviewer skims.
      ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeading n={1} title="Introduction" icon={FileText} />

        {/* Study summary + context */}
        <div className="card" style={{ padding: 28, fontSize: 14, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
          {report.introduction}
        </div>

        {/* Big questions */}
        {report.big_questions?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Key Questions This Report Answers
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {report.big_questions.map((q, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: "var(--radius)", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-muted)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive summary of conclusions */}
        {report.introduction_summary && (
          <div style={{ padding: "18px 20px", borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, rgba(234,88,12,0.07), rgba(234,88,12,0.02))", border: "1px solid rgba(234,88,12,0.2)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Executive Summary — Conclusions at a Glance
            </p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>{report.introduction_summary}</p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Body / Analysis (question-oriented)
          Audience: Client (evidence per section) + Technical reviewer (methods + findings)
      ══════════════════════════════════════════════════════════════════════ */}
      {report.analysis.length > 0 && (
        <section>
          <SectionHeading n={2} title="Analysis" icon={FlaskConical} />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {report.analysis.map((s, i) => (
              <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>

                {/* Question header */}
                <div style={{ padding: "16px 24px", background: "var(--bg-input)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-muted)", color: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.4 }}>{s.question}</h3>
                </div>

                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Methods */}
                  {s.methods && (
                    <div>
                      <PillLabel text="Method" color="#3b82f6" />
                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, fontStyle: "italic" }}>{s.methods}</p>
                    </div>
                  )}

                  {/* Findings */}
                  {s.findings && (
                    <div>
                      <PillLabel text="Findings" color="var(--accent)" />
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{s.findings}</p>
                    </div>
                  )}

                  {/* Conclusion */}
                  {s.conclusion && (
                    <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(234,88,12,0.05)", border: "1px solid rgba(234,88,12,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <Lightbulb size={14} color="var(--accent-light)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 4 }}>Conclusion</span>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s.conclusion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts — inline after analysis body, before conclusions */}
      {hasCharts && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
            <BarChart2 size={18} color="var(--accent-light)" />
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "var(--accent-light)" }}>Supporting Visualizations</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
            {charts.map((chart, i) => <ChartRenderer key={i} chart={chart} />)}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Conclusions / Discussion
          Audience: Client (main takeaways) + Executive (signpost stop)
      ══════════════════════════════════════════════════════════════════════ */}
      {(report.conclusions || actions.length > 0 || report.future_work?.length > 0) && (
        <section>
          <SectionHeading n={3} title="Conclusions & Discussion" icon={CheckCircle2} color="var(--green)" />

          {report.conclusions && (
            <div className="card" style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)", fontSize: 14, lineHeight: 1.85, color: "var(--text-secondary)" }}>
              {report.conclusions}
            </div>
          )}

          {/* Recommended Actions */}
          {actions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                Recommended Actions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {actions.map((action, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <ArrowRight size={15} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{action.action}</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{action.impact}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span className={`badge ${action.priority === "high" ? "badge-red" : action.priority === "medium" ? "badge-orange" : "badge-green"}`}>
                        {action.priority}
                      </span>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{Math.round(action.confidence * 100)}% conf.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Future work */}
          {report.future_work?.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Telescope size={14} color="var(--text-muted)" />
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Future Work & Next Steps</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.future_work.map((fw, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text-secondary)", padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--bg-input)" }}>
                    <HelpCircle size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {fw}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Risk Assessment
      ══════════════════════════════════════════════════════════════════════ */}
      {report.risks?.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "#ef4444" }}>Risks & Assumptions</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {report.risks.map((risk, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 13, color: "rgba(252,165,165,0.85)", lineHeight: 1.65 }}>
                <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                {risk}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          APPENDIX — Technical material for the technical reviewer
      ══════════════════════════════════════════════════════════════════════ */}
      {appendix && (appendix.sql || appendix.notes || appendix.code || appendix.data_quality) && (
        <section style={{ paddingTop: 12, borderTop: "2px dashed var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <ClipboardList size={16} color="var(--text-muted)" />
            <h2 style={{ fontWeight: 800, fontSize: 18, color: "var(--text-muted)" }}>Appendix</h2>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>— technical detail for reviewers</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {appendix.notes && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>A. Methodology</p>
                <div className="card" style={{ padding: "16px 20px", background: "var(--bg-input)" }}>
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)" }}>{appendix.notes}</p>
                </div>
              </div>
            )}

            {appendix.data_quality && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>B. Data Quality Notes</p>
                <div className="card" style={{ padding: "16px 20px", background: "var(--bg-input)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)" }}>{appendix.data_quality}</p>
                </div>
              </div>
            )}

            {appendix.sql && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>C. SQL Queries</p>
                <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <div style={{ background: "var(--bg-input)", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>SQL / DuckDB</div>
                  <pre style={{ background: "#0d0d0d", padding: "16px 20px", fontSize: 12, color: "#f97316", overflowX: "auto", lineHeight: 1.65, margin: 0 }}>{appendix.sql}</pre>
                </div>
              </div>
            )}

            {appendix.code && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>D. Code</p>
                <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <pre style={{ background: "#0d0d0d", padding: "16px 20px", fontSize: 12, color: "#a3e635", overflowX: "auto", lineHeight: 1.65, margin: 0 }}>{appendix.code}</pre>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
