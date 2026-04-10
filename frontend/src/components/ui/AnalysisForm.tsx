"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Database, Brain, Sparkles, Send, Loader2, X, BarChart2 } from "lucide-react";
import { OutputMode } from "@/lib/types";
import { toast } from "react-hot-toast";
import { apiSvc } from "@/lib/api";

interface AnalysisFormProps {
  onAnalyze: (config: { problem: string; mode: OutputMode; dataset_id?: string }) => void;
  isLoading: boolean;
}

const MODES: { id: OutputMode; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",     desc: "KPIs, charts & visual summary",         icon: BarChart2  },
  { id: "report",    label: "Full Report",   desc: "Deep strategic analysis + appendix",     icon: Brain      },
  { id: "insights",  label: "Smart Insights",desc: "Actionable bullets with impact scores",  icon: Sparkles   },
  { id: "strategy",  label: "Strategy",      desc: "Decisions, trade-offs & recommendations", icon: Database  },
];

export function AnalysisForm({ onAnalyze, isLoading }: AnalysisFormProps) {
  const [problem,    setProblem]    = useState("");
  const [mode,       setMode]       = useState<OutputMode>("dashboard");
  const [datasetId,  setDatasetId]  = useState<string | undefined>();
  const [filename,   setFilename]   = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const result = await apiSvc.uploadFile(files[0]);
      setDatasetId(result.dataset_id);
      setFilename(files[0].name);
      toast.success(`✓ ${files[0].name} ingested — ${result.row_count.toLocaleString()} rows`);
    } catch {
      toast.error("Upload failed. Check the file is a valid CSV or Excel.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv":                                                                    [".csv"],
      "application/vnd.ms-excel":                                                    [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":           [".xlsx"],
    },
    multiple: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) { toast.error("Describe the business problem first."); return; }
    onAnalyze({ problem, mode, dataset_id: datasetId });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Step 1: Problem ─────────────────────────────────────── */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          1 · Business Question
        </label>
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          rows={4}
          className="input"
          placeholder="e.g. Analyze Q1 sales performance — why did retention drop in March and which customer segments are at highest churn risk?"
          style={{ resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {/* ── Step 2: Data ─────────────────────────────────────────── */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          2 · Data Source
        </label>

        {datasetId ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: "var(--radius)",
            background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Database size={16} color="var(--green)" />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--green)" }}>{filename}</p>
                <p style={{ fontSize: 11, color: "rgba(34,197,94,0.6)", marginTop: 1 }}>Dataset ID: {datasetId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setDatasetId(undefined); setFilename(null); }}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--green)", padding: "6px" }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "36px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              cursor: "pointer", transition: "all 0.2s",
              background: isDragActive ? "var(--accent-muted)" : "transparent",
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <Loader2 size={28} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Processing file...</p>
              </>
            ) : (
              <>
                <Upload size={28} color={isDragActive ? "var(--accent)" : "var(--text-muted)"} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {isDragActive ? "Drop to upload" : "Click or drag & drop CSV / XLSX"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Max 50 MB · No dataset needed for general questions</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Step 3: Output Mode ──────────────────────────────────── */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          3 · Output Format
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  padding: "14px 12px", borderRadius: "var(--radius)", cursor: "pointer",
                  transition: "all 0.15s", textAlign: "left",
                  border: active ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  background: active ? "var(--accent-muted)" : "var(--bg-card)",
                }}
              >
                <Icon size={16} color={active ? "var(--accent-light)" : "var(--text-muted)"} />
                <p style={{ fontWeight: 700, fontSize: 13, marginTop: 8, color: active ? "var(--accent-light)" : "var(--text-primary)" }}>{m.label}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading || uploading}
        className="btn btn-primary btn-lg"
        style={{ justifyContent: "center" }}
      >
        {isLoading ? (
          <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating Analysis...</>
        ) : (
          <><Send size={16} /> Run AI Analysis</>
        )}
      </button>

    </form>
  );
}
