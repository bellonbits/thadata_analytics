"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Sparkles, RotateCcw, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Brain, Download, Clock, TrendingUp,
  FileText, Lightbulb, Plus,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AnalysisForm } from "@/components/ui/AnalysisForm";
import { KPICard } from "@/components/ui/KPICard";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ReportView } from "@/components/dashboard/ReportView";
import { apiSvc } from "@/lib/api";
import { AnalyzeResponse, OutputMode, SavedAnalysis } from "@/lib/types";
import { toast } from "react-hot-toast";
import { useUser } from "@/hooks/useUser";



export default function DashboardPage() {
  const { displayName } = useUser();
  const [showPrompt, setShowPrompt]           = useState(false);
  const [isAnalyzing, setIsAnalyzing]         = useState(false);
  const [analysisResult, setAnalysisResult]   = useState<AnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError]     = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses]   = useState<SavedAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(true);
  const [activeAnalysis, setActiveAnalysis]   = useState<SavedAnalysis | null>(null);

  // Load recent analyses from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setLoadingHistory(true);
      try {
        const data = await apiSvc.getAnalyses();
        if (data && data.length > 0) {
          setRecentAnalyses(data);
          setActiveAnalysis(data[0]);
          setAnalysisResult(data[0].data);
        }
      } catch {
        // silently fail — user may not have run any analyses yet
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  const handleAnalyze = async ({ problem, mode, dataset_id }: { problem: string; mode: OutputMode; dataset_id?: string }) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setActiveAnalysis(null);
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

      const saved = await apiSvc.saveAnalysis({
        headline: result.headline,
        mode: result.mode,
        rows_analyzed: result.meta.rows_analyzed,
        confidence: result.meta.confidence_overall,
        data: result,
      });

      const newItem = saved ?? {
        id: Date.now().toString(),
        headline: result.headline,
        mode: result.mode,
        created_at: new Date().toISOString(),
        rows_analyzed: result.meta.rows_analyzed,
        confidence: result.meta.confidence_overall,
        data: result,
      };

      setRecentAnalyses(prev => [newItem, ...prev]);
      setActiveAnalysis(newItem);
      setAnalysisResult(result);
      setShowPrompt(false);
      toast.success("Analysis complete");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setAnalysisError(e?.response?.data?.detail ?? "Analysis failed. Please check the backend connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setActiveAnalysis(null);
    setShowPrompt(false);
  };

  const selectAnalysis = (item: SavedAnalysis) => {
    setActiveAnalysis(item);
    setAnalysisResult(item.data);
    setAnalysisError(null);
    setShowPrompt(false);
  };

  const hasResult = analysisResult && !isAnalyzing;
  const isEmpty   = !loadingHistory && recentAnalyses.length === 0 && !isAnalyzing && !analysisResult;

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Topbar />
        <div className="page-container">

          {/* Header */}
          <div className="page-header fade-up">
            <div>
              <h2 className="page-header-title">
                <LayoutDashboard size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                {hasResult ? activeAnalysis?.headline ?? "Analysis Results" : `Welcome back${displayName ? `, ${displayName.split(" ")[0]}` : ""}`}
              </h2>
              <p className="page-header-sub">
                {hasResult
                  ? `${activeAnalysis?.mode?.toUpperCase()} · ${analysisResult.meta.rows_analyzed.toLocaleString()} rows · ${(analysisResult.meta.confidence_overall * 100).toFixed(0)}% confidence`
                  : "AI-powered analytics for your business data"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {hasResult && (
                <button className="btn btn-secondary btn-sm" onClick={resetAnalysis}>
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button
                className={`btn btn-sm ${showPrompt ? "btn-secondary" : "btn-primary"}`}
                onClick={() => setShowPrompt(!showPrompt)}
              >
                <Sparkles size={14} />
                {showPrompt ? "Hide" : "New Analysis"}
                {showPrompt ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* AI Analysis Panel */}
          {showPrompt && (
            <div className="card fade-up" style={{ padding: "28px 32px", marginBottom: 24, border: "1px solid rgba(234,88,12,0.2)", boxShadow: "0 0 40px rgba(234,88,12,0.06)" }}>
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Sparkles size={17} color="var(--accent-light)" /> Run AI Analysis
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Upload your data, describe your business question, and get an AI-generated analysis powered by Groq.
                </p>
              </div>
              <AnalysisForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            </div>
          )}

          {/* Loading */}
          {isAnalyzing && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Loader2 size={48} color="var(--accent)" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Analyzing with Groq AI...</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Processing your dataset and generating insights</p>
            </div>
          )}

          {/* Error */}
          {analysisError && !isAnalyzing && (
            <div className="card" style={{ padding: 24, marginBottom: 20, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <AlertCircle size={20} color="#ef4444" />
                <span style={{ fontWeight: 700, color: "#ef4444" }}>Analysis Failed</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 14 }}>{analysisError}</p>
              <button className="btn btn-secondary btn-sm" onClick={() => { setAnalysisError(null); setShowPrompt(true); }}>
                Try Again
              </button>
            </div>
          )}

          {/* Analysis Result */}
          {hasResult && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Meta bar */}
              <div className="card" style={{ padding: "16px 22px", border: "1px solid rgba(234,88,12,0.2)", background: "linear-gradient(135deg, rgba(234,88,12,0.04), transparent)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span>Mode: <strong style={{ color: "var(--accent-light)" }}>{analysisResult.mode.toUpperCase()}</strong></span>
                  <span>Rows: <strong style={{ color: "var(--text-secondary)" }}>{analysisResult.meta.rows_analyzed.toLocaleString()}</strong></span>
                  <span>Confidence: <strong style={{ color: "var(--green)" }}>{(analysisResult.meta.confidence_overall * 100).toFixed(0)}%</strong></span>
                  <span>Freshness: <strong style={{ color: "var(--text-secondary)" }}>{analysisResult.meta.data_freshness}</strong></span>
                  {analysisResult.meta.warnings.length > 0 && (
                    <span style={{ color: "#f59e0b" }}>⚠ {analysisResult.meta.warnings.length} warning{analysisResult.meta.warnings.length > 1 ? "s" : ""}</span>
                  )}
                </div>
                {activeAnalysis && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> {new Date(activeAnalysis.created_at).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Route to correct view */}
              {analysisResult.mode === "report" ? (
                <ReportView data={analysisResult} />
              ) : analysisResult.mode === "dashboard" ? (
                <DashboardView data={analysisResult} />
              ) : (
                // insights / strategy — show KPIs + Charts + Insights + Actions
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {analysisResult.kpis.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                      {analysisResult.kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
                    </div>
                  )}

                  {analysisResult.charts.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 18 }}>
                      {analysisResult.charts.map((chart, i) => <ChartRenderer key={i} chart={chart} />)}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    {analysisResult.insights.length > 0 && (
                      <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                          <Brain size={16} color="#a78bfa" /> Key Insights
                        </h3>
                        <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {analysisResult.insights.map((ins, i) => (
                            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-muted)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{ins}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.actions.length > 0 && (
                      <div className="card" style={{ padding: 24, border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)" }}>
                        <h3 style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                          <TrendingUp size={16} color="var(--green)" /> Recommended Actions
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {analysisResult.actions.map((action, i) => (
                            <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{action.action}</span>
                                <span className={`badge ${action.priority === "high" ? "badge-red" : action.priority === "medium" ? "badge-orange" : "badge-green"}`}>{action.priority}</span>
                              </div>
                              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{action.impact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Analyses History */}
          {recentAnalyses.length > 0 && !isAnalyzing && (
            <section className="section" style={{ marginTop: hasResult ? 32 : 0 }}>
              <div className="section-header">
                <h3 className="section-title"><Clock size={14} color="var(--accent-light)" /> Recent Analyses</h3>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setShowPrompt(true)}>
                  <Plus size={12} /> New
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {recentAnalyses.map(item => {
                  const isActive = activeAnalysis?.id === item.id;
                  const ModeIcon = item.mode === "report" ? FileText : item.mode === "insights" ? Lightbulb : item.mode === "strategy" ? TrendingUp : LayoutDashboard;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectAnalysis(item)}
                      style={{
                        padding: "14px 16px", borderRadius: "var(--radius-lg)", cursor: "pointer",
                        border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: isActive ? "rgba(234,88,12,0.06)" : "var(--bg-card)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "var(--radius)", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ModeIcon size={14} color="var(--accent)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.headline || "Untitled"}
                          </p>
                          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                            <span className="badge badge-orange" style={{ fontSize: 10 }}>{item.mode}</span>
                            <span style={{ color: "var(--green)", fontWeight: 600 }}>{Math.round(item.confidence * 100)}%</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Loading history skeleton */}
          {loadingHistory && !isAnalyzing && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--radius-lg)" }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>
              <LayoutDashboard size={56} style={{ opacity: 0.1, marginBottom: 20 }} />
              <p style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, color: "var(--text-primary)" }}>
                Your dashboard awaits
              </p>
              <p style={{ fontSize: 14, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
                Upload a dataset and run your first AI analysis to see KPIs, charts, insights, and recommendations here.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="btn btn-primary" onClick={() => setShowPrompt(true)}>
                  <Sparkles size={15} /> Run Analysis
                </button>
                <a href="/datasources" className="btn btn-secondary">
                  <Download size={15} /> Upload Data
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
