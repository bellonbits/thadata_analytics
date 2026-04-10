"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AnalysisForm } from "@/components/ui/AnalysisForm";
import { ReportView } from "@/components/dashboard/ReportView";
import { apiSvc } from "@/lib/api";
import { AnalyzeResponse } from "@/lib/types";
import { Loader2, Sparkles, FileText, AlertCircle } from "lucide-react";

export default function ReportPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async ({ problem, mode, dataset_id }: { problem: string; mode: any; dataset_id?: string }) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiSvc.analyze({
        problem,
        output: "report",
        dataset_id,
        objective: problem,
        constraints: [],
        context: { dataset: dataset_id ?? "uploaded", industry: "general", time_range: "recent" },
        parameters: {},
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Report generation failed.");
    } finally {
      setIsAnalyzing(false);
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
                <FileText size={22} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                {result ? "Analysis Report" : "Generate a Report"}
              </h2>
              <p className="page-header-sub">Upload your dataset and define your questions — the AI will produce a structured strategic report.</p>
            </div>
            {result && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setResult(null); setError(null); }}>
                ← New Report
              </button>
            )}
          </div>

          {/* Form (shown when no result) */}
          {!result && !isAnalyzing && (
            <section className="section fade-up" style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "32px",
            }}>
              <div style={{ marginBottom: 24 }}>
                <h3 className="section-title" style={{ fontSize: 17, marginBottom: 4 }}>
                  <Sparkles size={18} style={{ color: "var(--accent-light)" }} />
                  Configure Your Report
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Describe your business problem in detail for the best strategic output.
                </p>
              </div>
              <AnalysisForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            </section>
          )}

          {/* Loading */}
          {isAnalyzing && (
            <section className="section fade-up" style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <Loader2 size={52} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>Generating Strategic Report...</h3>
                <p style={{ color: "var(--text-muted)", maxWidth: 360, fontSize: 14 }}>
                  Compiling analysis sections, findings, and recommendations. This may take 20–40 seconds.
                </p>
              </div>
            </section>
          )}

          {/* Error */}
          {error && !isAnalyzing && (
            <section className="section fade-up">
              <div className="card" style={{ padding: 24, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <AlertCircle size={20} style={{ color: "#ef4444" }} />
                  <h4 style={{ fontWeight: 700, color: "#ef4444" }}>Report Failed</h4>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>{error}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setError(null)}>Try Again</button>
              </div>
            </section>
          )}

          {/* Report result */}
          {result && !isAnalyzing && (
            <section className="section fade-up">
              <ReportView data={result} />
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
