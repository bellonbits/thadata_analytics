"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Sparkles, Loader2, AlertCircle, Clock,
  Download, Trash2, ChevronRight, ChevronDown, BarChart2,
  FileDown, AlignLeft,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ReportView } from "@/components/dashboard/ReportView";
import { apiSvc } from "@/lib/api";
import { Dataset, AnalyzeResponse, SavedAnalysis } from "@/lib/types";
import { toast } from "react-hot-toast";
import { exportPDF, exportDOCX } from "@/lib/exportReport";

const WORD_COUNTS = [
  { label: "Brief (~500 words)",    value: 500  },
  { label: "Standard (~1,000 words)", value: 1000 },
  { label: "Detailed (~2,000 words)", value: 2000 },
  { label: "Comprehensive (~3,500 words)", value: 3500 },
  { label: "Executive (~5,000 words)", value: 5000 },
];

export default function ReportsPage() {
  const [saved, setSaved]           = useState<SavedAnalysis[]>([]);
  const [active, setActive]         = useState<SavedAnalysis | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [datasets, setDatasets]     = useState<Dataset[]>([]);
  const [exporting, setExporting]   = useState<"pdf" | "docx" | null>(null);

  // Form state
  const [problem, setProblem]       = useState("");
  const [datasetId, setDatasetId]   = useState("");
  const [wordCount, setWordCount]   = useState(1000);
  const [includeCharts, setIncludeCharts] = useState(true);

  useEffect(() => {
    apiSvc.getDatasets().then(setDatasets).catch(() => {});
    apiSvc.getAnalyses("report").then(setSaved).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!problem.trim()) { toast.error("Describe what you want to analyze"); return; }
    setAnalyzing(true);
    setError(null);
    try {
      const result = await apiSvc.analyze({
        problem,
        output: "report",
        dataset_id: datasetId || undefined,
        objective: problem,
        constraints: [
          `Write approximately ${wordCount} words total`,
          includeCharts ? "Include chart data for visualizations" : "Do not include chart data — text only",
        ],
        context: { dataset: datasetId, industry: "general", time_range: "recent" },
        parameters: {},
      });

      const savedNew = await apiSvc.saveAnalysis({
        headline: result.headline,
        mode: "report",
        rows_analyzed: result.meta.rows_analyzed,
        confidence: result.meta.confidence_overall,
        data: result,
      });

      setSaved(prev => [savedNew, ...prev]);
      setActive(savedNew);
      setShowForm(false);
      setProblem("");
      toast.success("Report generated");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Report generation failed. Check the backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiSvc.deleteAnalysis(id);
      setSaved(prev => prev.filter(r => r.id !== id));
      if (active?.id === id) setActive(null);
      toast.success("Report deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!active) return;
    setExporting(format);
    try {
      const title = active.headline || "Strategic Report";
      if (format === "pdf") {
        await exportPDF(active.data, title);
        toast.success("PDF downloaded");
      } else {
        await exportDOCX(active.data, title);
        toast.success("DOCX downloaded");
      }
    } catch (e) {
      console.error(e);
      toast.error(`Export failed`);
    } finally {
      setExporting(null);
    }
  };

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
                <FileText size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Reports
              </h2>
              <p className="page-header-sub">AI-generated strategic analysis reports — exported to PDF or Word.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setActive(null); }}>
              <Plus size={14} /> New Report
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: saved.length > 0 && !showForm ? "260px 1fr" : "1fr", gap: 20 }}>

            {/* Left sidebar — saved reports list */}
            {saved.length > 0 && !showForm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Saved Reports ({saved.length})
                </p>
                {saved.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setActive(r)}
                    style={{
                      padding: "14px 16px", borderRadius: "var(--radius-lg)", cursor: "pointer",
                      border: active?.id === r.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: active?.id === r.id ? "var(--accent-muted)" : "var(--bg-card)",
                      transition: "all 0.15s",
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.headline || "Untitled Report"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {new Date(r.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Main content area */}
            <div>

              {/* ── New report form ── */}
              {showForm && (
                <div className="card fade-up" style={{ padding: 32, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={18} color="var(--accent-light)" /> Generate New Report
                    </h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* Problem statement */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        What do you want to analyze?
                      </label>
                      <textarea
                        className="input"
                        style={{ width: "100%", minHeight: 100, resize: "vertical", fontFamily: "inherit", fontSize: 14 }}
                        placeholder="e.g. Analyze our Q4 revenue performance and identify growth opportunities for next year..."
                        value={problem}
                        onChange={e => setProblem(e.target.value)}
                      />
                    </div>

                    {/* Dataset + Word count row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <ChevronDown size={12} /> Dataset (optional)
                        </label>
                        <select className="input" style={{ width: "100%" }} value={datasetId} onChange={e => setDatasetId(e.target.value)}>
                          <option value="">No dataset — AI knowledge only</option>
                          {datasets.map(d => (
                            <option key={d.dataset_id} value={d.dataset_id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <AlignLeft size={12} /> Report Length
                        </label>
                        <select className="input" style={{ width: "100%" }} value={wordCount} onChange={e => setWordCount(Number(e.target.value))}>
                          {WORD_COUNTS.map(w => (
                            <option key={w.value} value={w.value}>{w.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Charts toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "14px 16px", borderRadius: "var(--radius)", border: `1px solid ${includeCharts ? "var(--accent)" : "var(--border)"}`, background: includeCharts ? "var(--accent-muted)" : "var(--bg-input)", transition: "all 0.15s" }}>
                      <input
                        type="checkbox"
                        checked={includeCharts}
                        onChange={e => setIncludeCharts(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: "var(--accent)", flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13, color: includeCharts ? "var(--accent-light)" : "var(--text-secondary)" }}>
                          <BarChart2 size={14} /> Include charts & visualizations
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          AI will generate chart data shown inline with the report findings
                        </p>
                      </div>
                    </label>

                    <button
                      className="btn btn-primary"
                      style={{ justifyContent: "center" }}
                      onClick={handleGenerate}
                      disabled={analyzing}
                    >
                      {analyzing
                        ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                        : <><Sparkles size={15} /> Generate Report</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Loading ── */}
              {analyzing && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <Loader2 size={48} color="var(--accent)" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
                  <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Generating Strategic Report...</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Groq Llama 4 Scout is writing your report — this takes 20–40 seconds.</p>
                </div>
              )}

              {/* ── Error ── */}
              {error && !analyzing && (
                <div className="card" style={{ padding: 24, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <span style={{ fontWeight: 700, color: "#ef4444" }}>Generation Failed</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 14 }}>{error}</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setError(null); setShowForm(true); }}>Try Again</button>
                </div>
              )}

              {/* ── Active report ── */}
              {active && !showForm && !analyzing && (
                <div className="fade-up">
                  {/* Toolbar */}
                  <div className="card" style={{ padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--text-secondary)" }}>{new Date(active.created_at).toLocaleString()}</strong>
                      {" · "}Confidence <strong style={{ color: "var(--green)" }}>{Math.round(active.confidence * 100)}%</strong>
                      {" · "}{active.rows_analyzed.toLocaleString()} rows analyzed
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport("pdf")}
                        disabled={exporting !== null}
                      >
                        {exporting === "pdf"
                          ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                          : <Download size={13} />}
                        Export PDF
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport("docx")}
                        disabled={exporting !== null}
                      >
                        {exporting === "docx"
                          ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                          : <FileDown size={13} />}
                        Export DOCX
                      </button>
                    </div>
                  </div>

                  <ReportView
                    data={active.data}
                    showCharts={!!(active.data.charts?.length)}
                  />
                </div>
              )}

              {/* ── Empty state ── */}
              {!active && !showForm && !analyzing && saved.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                  <FileText size={48} style={{ opacity: 0.12, marginBottom: 16 }} />
                  <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: "var(--text-primary)" }}>No reports yet</p>
                  <p style={{ fontSize: 14, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
                    Generate a detailed AI-written report with custom length and optional visualizations.
                  </p>
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={15} /> Create First Report
                  </button>
                </div>
              )}

              {/* ── Prompt to pick one ── */}
              {!active && !showForm && !analyzing && saved.length > 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  <ChevronRight size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>Select a report from the list, or generate a new one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
