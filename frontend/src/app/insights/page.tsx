"use client";

import { useState, useEffect } from "react";
import { Lightbulb, Sparkles, Plus, Loader2, AlertCircle, Clock, Trash2, Brain, Zap } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AnalysisForm } from "@/components/ui/AnalysisForm";
import { KPICard } from "@/components/ui/KPICard";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { apiSvc } from "@/lib/api";
import { AnalyzeResponse, OutputMode, SavedAnalysis } from "@/lib/types";
import { toast } from "react-hot-toast";



export default function InsightsPage() {
  const [saved, setSaved]         = useState<SavedAnalysis[]>([]);
  const [active, setActive]       = useState<SavedAnalysis | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const loadInsights = async () => {
    try {
      const data = await apiSvc.getAnalyses("insights,dashboard,strategy");
      setSaved(data);
    } catch {
      // noop
    }
  };

  useEffect(() => { loadInsights(); }, []);

  const handleAnalyze = async ({ problem, mode, dataset_id }: { problem: string; mode: OutputMode; dataset_id?: string }) => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await apiSvc.analyze({
        problem,
        output: mode,
        dataset_id,
        objective: problem,
        constraints: [],
        context: { dataset: dataset_id ?? "", industry: "general", time_range: "recent" },
        parameters: {},
      });

      const newItem = await apiSvc.saveAnalysis({
        headline: result.headline,
        mode: result.mode,
        rows_analyzed: result.meta.rows_analyzed,
        confidence: result.meta.confidence_overall,
        data: result,
      });

      setSaved(prev => [newItem, ...prev]);
      setActive(newItem);
      setShowForm(false);
      toast.success("Analysis complete");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Analysis failed. Check backend connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiSvc.deleteAnalysis(id);
      setSaved(prev => prev.filter(r => r.id !== id));
      if (active?.id === id) setActive(null);
    } catch {
      toast.error("Failed to delete analysis");
    }
  };

  const result = active?.data;

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Topbar />
        <div className="page-container">

          <div className="page-header fade-up">
            <div>
              <h2 className="page-header-title">
                <Lightbulb size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                AI Insights
              </h2>
              <p className="page-header-sub">Run analyses, explore patterns, and save actionable insights from your data.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setActive(null); }}>
              <Plus size={14} /> New Analysis
            </button>
          </div>

          {/* New analysis form */}
          {showForm && (
            <div className="card fade-up" style={{ padding: 32, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={18} color="var(--accent-light)" /> Run New Analysis
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              <AnalysisForm onAnalyze={handleAnalyze} isLoading={analyzing} />
            </div>
          )}

          {analyzing && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Loader2 size={48} color="var(--accent)" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 18 }}>Analyzing data with Groq AI...</p>
            </div>
          )}

          {error && !analyzing && (
            <div className="card" style={{ padding: 24, marginBottom: 20, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <AlertCircle size={18} color="#ef4444" />
                <span style={{ fontWeight: 700, color: "#ef4444" }}>Analysis Failed</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{error}</p>
            </div>
          )}

          {/* Active result */}
          {result && !showForm && !analyzing && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
              <div className="card" style={{ padding: "18px 24px", border: "1px solid rgba(234,88,12,0.2)", background: "linear-gradient(135deg, rgba(234,88,12,0.04), transparent)" }}>
                <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{result.headline}</h2>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span>Mode: <strong style={{ color: "var(--accent-light)" }}>{result.mode.toUpperCase()}</strong></span>
                  <span>Confidence: <strong style={{ color: "var(--green)" }}>{(result.meta.confidence_overall * 100).toFixed(0)}%</strong></span>
                  <span>Rows: <strong>{result.meta.rows_analyzed.toLocaleString()}</strong></span>
                </div>
              </div>

              {result.kpis.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {result.kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
                </div>
              )}

              {result.charts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 18 }}>
                  {result.charts.map((chart, i) => <ChartRenderer key={i} chart={chart} />)}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {result.insights.length > 0 && (
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Brain size={16} color="#a78bfa" /> Key Insights
                    </h3>
                    <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {result.insights.map((ins, i) => (
                        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-muted)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{ins}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.actions.length > 0 && (
                  <div className="card" style={{ padding: 24, border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)" }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Zap size={16} color="var(--green)" /> Recommended Actions
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.actions.map((action, i) => (
                        <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{action.action}</span>
                            <span className={`badge ${action.priority === "high" ? "badge-red" : action.priority === "medium" ? "badge-orange" : "badge-green"}`}>{action.priority}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{action.impact}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                            Confidence: <strong style={{ color: "var(--green)" }}>{Math.round(action.confidence * 100)}%</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {saved.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h3 className="section-title"><Clock size={15} style={{ color: "var(--accent-light)" }} /> Recent Analyses</h3>
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Headline</th>
                      <th>Mode</th>
                      <th>Confidence</th>
                      <th>Rows</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saved.map(r => (
                      <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => { setActive(r); setShowForm(false); }}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.headline || "—"}</td>
                        <td><span className="badge badge-orange">{r.mode}</span></td>
                        <td style={{ color: "var(--green)", fontWeight: 700 }}>{Math.round(r.confidence * 100)}%</td>
                        <td>{r.rows_analyzed.toLocaleString()}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "4px 8px" }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!showForm && !analyzing && saved.length === 0 && !result && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
              <Lightbulb size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No analyses yet</p>
              <p style={{ fontSize: 14, marginBottom: 20 }}>Upload data and run your first AI analysis.</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Sparkles size={15} /> Run Analysis
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
