"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, Database, Trash2, Eye, Sparkles, Loader2,
  AlertTriangle, CheckCircle2, Search, Play, X,
  FileText, Table, Code2, RefreshCw, Link2, ClipboardList,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { apiSvc } from "@/lib/api";
import { Dataset, DatasetDetail, ColumnStat, QueryResult } from "@/lib/types";
import { toast } from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qualityColor(q: number) {
  if (q >= 85) return "var(--green)";
  if (q >= 60) return "#f59e0b";
  return "var(--red)";
}
function qualityLabel(q: number) {
  if (q >= 85) return "Good";
  if (q >= 60) return "Fair";
  return "Poor";
}
function dtypeBadge(dtype: string) {
  if (dtype.includes("int") || dtype.includes("float")) return { label: "Number",  color: "#3b82f6" };
  if (dtype.includes("datetime") || dtype.includes("date")) return { label: "Date", color: "#8b5cf6" };
  if (dtype === "bool") return { label: "Boolean", color: "#f59e0b" };
  return { label: "Text", color: "#6b7280" };
}

function QualityBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <div style={{ flex: 1, height: 4, background: "var(--bg-input)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: qualityColor(value), borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ color: qualityColor(value), fontWeight: 700, minWidth: 30 }}>{value}</span>
    </div>
  );
}

// ─── Dataset Card ─────────────────────────────────────────────────────────────

function DatasetCard({ ds, onView, onDelete }: { ds: Dataset; onView: (id: string) => void; onDelete: (id: string) => void }) {
  const avgQuality = ds.warnings.length === 0 ? 92 : ds.warnings.length === 1 ? 74 : 55;
  return (
    <div
      className="card"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, transition: "all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,88,12,0.35)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Database size={18} color="var(--accent-light)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ds.name}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{ds.dataset_id}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ label: "Rows", val: ds.rows.toLocaleString() }, { label: "Columns", val: String(ds.columns) }].map(k => (
          <div key={k.label} style={{ background: "var(--bg-input)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
            <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontWeight: 800, fontSize: 20 }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Data Quality</span>
          <span style={{ color: qualityColor(avgQuality), fontWeight: 700 }}>{qualityLabel(avgQuality)}</span>
        </div>
        <QualityBar value={avgQuality} />
      </div>

      {ds.warnings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ds.warnings.slice(0, 2).map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "#f59e0b" }}>
              <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {w}
            </div>
          ))}
          {ds.warnings.length > 2 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+{ds.warnings.length - 2} more</span>}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--green)" }}>
          <CheckCircle2 size={13} /> No data quality issues
        </div>
      )}

      <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => onView(ds.dataset_id)}>
          <Eye size={13} /> Inspect
        </button>
        <Link href={`/insights?dataset_id=${ds.dataset_id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
          <Sparkles size={13} /> Analyze
        </Link>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "6px 8px" }} onClick={() => onDelete(ds.dataset_id)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Schema Inspector ─────────────────────────────────────────────────────────

function SchemaTable({ stats }: { stats: ColumnStat[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Column</th><th>Type</th><th>Null %</th><th>Unique</th><th>Min / Max</th><th>Sample Values</th><th>Quality</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(col => {
            const badge = dtypeBadge(col.dtype);
            return (
              <tr key={col.name}>
                <td style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", fontSize: 12 }}>{col.name}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: `${badge.color}18`, color: badge.color }}>{badge.label}</span>
                </td>
                <td style={{ color: col.null_pct > 15 ? "#f59e0b" : "var(--text-secondary)" }}>{col.null_pct.toFixed(1)}%</td>
                <td>{col.unique.toLocaleString()} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({col.unique_pct.toFixed(0)}%)</span></td>
                <td style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                  {col.min != null && col.max != null ? `${String(col.min).slice(0, 12)} → ${String(col.max).slice(0, 12)}` : "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {col.sample_values.map(String).join(", ")}
                </td>
                <td style={{ minWidth: 100 }}><QualityBar value={col.quality} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table" style={{ minWidth: Math.max(700, columns.length * 120) }}>
        <thead><tr>{columns.map(c => <th key={c} style={{ fontFamily: "monospace", fontSize: 11 }}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c} style={{ fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row[c] == null ? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>null</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SQLPanel({ datasetId }: { datasetId: string }) {
  const [sql, setSql]         = useState(`SELECT *\nFROM dataset\nLIMIT 20`);
  const [result, setResult]   = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const run = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await apiSvc.queryDataset(datasetId, sql);
      setResult(r);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setError(ax?.response?.data?.detail ?? "Query failed");
    } finally { setRunning(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <textarea
          value={sql} onChange={e => setSql(e.target.value)} rows={5} spellCheck={false}
          style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius)", background: "#0d0d0d", border: "1px solid var(--border)", color: "#f97316", fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, outline: "none", resize: "vertical" }}
          onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
          Table: <strong style={{ color: "var(--accent-light)" }}>dataset</strong>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={run} disabled={running} style={{ alignSelf: "flex-start" }}>
        {running ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} fill="currentColor" />}
        {running ? "Running..." : "Run Query"}
      </button>
      {error && <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#ef4444", fontFamily: "monospace" }}>{error}</div>}
      {result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 12, color: "var(--text-muted)" }}>
            <CheckCircle2 size={13} color="var(--green)" /> {result.row_count.toLocaleString()} rows returned
          </div>
          <div style={{ overflowX: "auto", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <PreviewTable columns={result.columns} rows={result.rows} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dataset Inspector Modal ──────────────────────────────────────────────────

type InspectTab = "schema" | "preview" | "sql";

function DatasetInspector({ datasetId, onClose }: { datasetId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InspectTab>("schema");

  useEffect(() => {
    setLoading(true);
    apiSvc.getDataset(datasetId)
      .then(setDetail)
      .catch(() => toast.error("Failed to load dataset details"))
      .finally(() => setLoading(false));
  }, [datasetId]);

  const tabs: { id: InspectTab; label: string; icon: React.ElementType }[] = [
    { id: "schema", label: "Schema", icon: Table },
    { id: "preview", label: "Preview", icon: FileText },
    { id: "sql", label: "SQL Query", icon: Code2 },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.75)", padding: "48px 24px", overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 1000, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Database size={17} color="var(--accent-light)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 800, fontSize: 16 }}>{detail?.filename ?? datasetId}</h3>
            {detail && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{detail.row_count.toLocaleString()} rows · {detail.col_count} columns · ID: {datasetId}</p>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 8 }}><X size={16} /></button>
        </div>

        {detail?.warnings && detail.warnings.length > 0 && (
          <div style={{ padding: "10px 24px", background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.15)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {detail.warnings.map((w, i) => (
              <span key={i} style={{ fontSize: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={11} /> {w}</span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 7, borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent", color: active ? "var(--accent-light)" : "var(--text-muted)", transition: "all 0.15s" }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, color: "var(--text-muted)" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Loading dataset details...
            </div>
          ) : detail ? (
            <>
              {tab === "schema"  && <SchemaTable stats={detail.column_stats} />}
              {tab === "preview" && <PreviewTable columns={detail.columns} rows={detail.preview} />}
              {tab === "sql"     && <SQLPanel datasetId={datasetId} />}
            </>
          ) : (
            <p style={{ color: "var(--red)", fontSize: 14 }}>Failed to load dataset.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Connection Methods ───────────────────────────────────────────────────────

type ConnectTab = "file" | "database" | "paste";

const DB_EXAMPLES: Record<string, string> = {
  postgresql: "postgresql://user:password@host:5432/dbname",
  mysql:      "mysql+pymysql://user:password@host:3306/dbname",
  sqlite:     "sqlite:///path/to/database.db",
  mssql:      "mssql+pyodbc://user:password@host/dbname?driver=ODBC+Driver+17+for+SQL+Server",
  bigquery:   "bigquery://project/dataset",
};

function FileUploadPanel({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      setProgress(`Processing ${file.name}…`);
      try {
        const result = await apiSvc.uploadFile(file);
        toast.success(`✓ ${file.name} — ${result.row_count.toLocaleString()} rows, ${result.col_count} columns`);
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { detail?: string } } };
        toast.error(`✗ ${file.name}: ${ax?.response?.data?.detail ?? "Upload failed"}`);
      }
    }
    setUploading(false);
    setProgress(null);
    onUploaded();
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      style={{ border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-xl)", padding: "56px 32px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: isDragActive ? "var(--accent-muted)" : "rgba(255,255,255,0.01)" }}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 size={36} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>{progress}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            <Upload size={28} color={isDragActive ? "var(--accent)" : "var(--text-muted)"} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: isDragActive ? "var(--accent-light)" : "var(--text-primary)" }}>
            {isDragActive ? "Drop files to upload" : "Drag & drop your data files"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            CSV or Excel (.csv, .xlsx, .xls) · Multiple files supported · Max 50 MB each
          </p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
            Browse files
          </button>
        </div>
      )}
    </div>
  );
}

function DatabasePanel({ onUploaded }: { onUploaded: () => void }) {
  const [dbType, setDbType]   = useState("postgresql");
  const [dbUrl, setDbUrl]     = useState("");
  const [query, setQuery]     = useState("SELECT *\nFROM your_table\nLIMIT 10000");
  const [name, setName]       = useState("my_dataset");
  const [loading, setLoading] = useState(false);
  const [tested, setTested]   = useState<boolean | null>(null);

  const handleDbTypeChange = (type: string) => {
    setDbType(type);
    setDbUrl(DB_EXAMPLES[type] || "");
  };

  const test = async () => {
    if (!dbUrl.trim()) { toast.error("Enter a database URL"); return; }
    setLoading(true);
    try {
      // Quick test: run a simple query
      await apiSvc.ingestDatabase({ db_url: dbUrl, query: "SELECT 1 as test", name: "test" });
      setTested(true);
      toast.success("Connection successful!");
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      setTested(false);
      toast.error(ax?.response?.data?.detail ?? "Connection failed");
    } finally { setLoading(false); }
  };

  const connect = async () => {
    if (!dbUrl.trim()) { toast.error("Enter a database URL"); return; }
    if (!query.trim()) { toast.error("Enter a SQL query"); return; }
    setLoading(true);
    try {
      const result = await apiSvc.ingestDatabase({ db_url: dbUrl, query, name: name || "db_dataset" });
      toast.success(`✓ Connected — ${result.row_count.toLocaleString()} rows, ${result.col_count} columns imported`);
      onUploaded();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      toast.error(ax?.response?.data?.detail ?? "Connection failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* DB type selector */}
      <div>
        <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Database Type
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(DB_EXAMPLES).map(type => (
            <button
              key={type}
              onClick={() => handleDbTypeChange(type)}
              className={`btn btn-sm ${dbType === type ? "btn-primary" : "btn-ghost"}`}
              style={{ textTransform: "capitalize", fontSize: 12 }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Connection URL */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
          Connection URL
        </label>
        <input
          className="input"
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
          placeholder={DB_EXAMPLES[dbType]}
          value={dbUrl}
          onChange={e => setDbUrl(e.target.value)}
          type="text"
          autoComplete="off"
          spellCheck={false}
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          Format: <code style={{ color: "var(--accent-light)" }}>{DB_EXAMPLES[dbType]}</code>
        </p>
      </div>

      {/* Dataset name */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
          Dataset Name
        </label>
        <input
          className="input"
          style={{ width: "100%", maxWidth: 320 }}
          placeholder="e.g. sales_data"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      {/* SQL Query */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
          SQL Query
        </label>
        <textarea
          className="input"
          style={{ width: "100%", fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, minHeight: 120, resize: "vertical", color: "#f97316" }}
          value={query}
          onChange={e => setQuery(e.target.value)}
          spellCheck={false}
          placeholder="SELECT * FROM your_table LIMIT 10000"
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
          Query results will be imported as a dataset. Keep under 100k rows for best performance.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn btn-secondary btn-sm" onClick={test} disabled={loading}>
          {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Link2 size={13} />}
          Test Connection
        </button>
        <button className="btn btn-primary" onClick={connect} disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Database size={14} />}
          {loading ? "Connecting..." : "Import Data"}
        </button>
        {tested === true && <span style={{ fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={13} /> Connected</span>}
        {tested === false && <span style={{ fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={13} /> Failed</span>}
      </div>

      {/* Help */}
      <div className="card" style={{ padding: 16, border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", marginBottom: 8 }}>Supported databases</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {[
            ["PostgreSQL", "postgresql://user:pass@host/db"],
            ["MySQL", "mysql+pymysql://user:pass@host/db"],
            ["SQLite", "sqlite:///./local.db"],
            ["MSSQL", "mssql+pyodbc://..."],
            ["BigQuery", "bigquery://project/dataset"],
          ].map(([label, ex]) => (
            <div key={label} style={{ fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{label}:</span>{" "}
              <code style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{ex}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PastePanel({ onUploaded }: { onUploaded: () => void }) {
  const [csv, setCsv]         = useState("");
  const [name, setName]       = useState("pasted_data");
  const [loading, setLoading] = useState(false);

  const rowCount = csv.trim() ? csv.trim().split("\n").length - 1 : 0;
  const colCount = csv.trim() ? (csv.trim().split("\n")[0]?.split(",").length ?? 0) : 0;

  const ingest = async () => {
    if (!csv.trim()) { toast.error("Paste some CSV data first"); return; }
    setLoading(true);
    try {
      // Convert pasted text to a File blob
      const blob = new Blob([csv], { type: "text/csv" });
      const file = new File([blob], `${name || "pasted_data"}.csv`, { type: "text/csv" });
      const result = await apiSvc.uploadFile(file);
      toast.success(`✓ Imported — ${result.row_count.toLocaleString()} rows, ${result.col_count} columns`);
      setCsv("");
      onUploaded();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      toast.error(ax?.response?.data?.detail ?? "Import failed");
    } finally { setLoading(false); }
  };

  const SAMPLE = `date,product,revenue,units,region
2024-01-01,Widget A,12400,310,North
2024-01-02,Widget B,9800,245,South
2024-01-03,Widget A,14200,355,East
2024-01-04,Widget C,7600,190,West
2024-01-05,Widget B,11100,278,North`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Dataset Name</label>
        <input className="input" style={{ width: "100%", maxWidth: 320 }} placeholder="e.g. sales_jan" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Paste CSV Data</label>
          <button
            style={{ fontSize: 11, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setCsv(SAMPLE)}
          >
            Load sample data
          </button>
        </div>
        <textarea
          className="input"
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, minHeight: 240, resize: "vertical", color: "var(--text-secondary)" }}
          value={csv}
          onChange={e => setCsv(e.target.value)}
          placeholder={"date,product,revenue,units\n2024-01-01,Widget A,12400,310\n2024-01-02,Widget B,9800,245\n..."}
          spellCheck={false}
        />
        {csv.trim() && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
            Detected: <strong style={{ color: "var(--text-secondary)" }}>{rowCount} rows</strong> · <strong style={{ color: "var(--text-secondary)" }}>{colCount} columns</strong>
          </p>
        )}
      </div>

      <button className="btn btn-primary" onClick={ingest} disabled={loading || !csv.trim()} style={{ alignSelf: "flex-start" }}>
        {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={14} />}
        {loading ? "Importing..." : "Import Data"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataSourcesPage() {
  const [datasets,   setDatasets]   = useState<Dataset[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [connectTab, setConnectTab] = useState<ConnectTab>("file");
  const [showConnect, setShowConnect] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiSvc.getDatasets();
      setDatasets(data);
    } catch {
      toast.error("Could not load datasets — is the backend running?");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await apiSvc.deleteDataset(id);
      toast.success("Dataset deleted");
      setDatasets(prev => prev.filter(d => d.dataset_id !== id));
    } catch { toast.error("Failed to delete dataset"); }
    finally { setDeleting(null); }
  };

  const filtered = datasets.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.dataset_id.toLowerCase().includes(search.toLowerCase())
  );

  const CONNECT_TABS: { id: ConnectTab; label: string; icon: React.ElementType }[] = [
    { id: "file",     label: "Upload File",   icon: Upload        },
    { id: "database", label: "Database URL",  icon: Database      },
    { id: "paste",    label: "Paste CSV",     icon: ClipboardList },
  ];

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
                <Database size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Data Sources
              </h2>
              <p className="page-header-sub">Connect CSV files, Excel sheets, or live databases.</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              Refresh
            </button>
          </div>

          {/* Summary KPIs */}
          {datasets.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }} className="fade-up">
              {[
                { label: "Datasets",   value: datasets.length.toString(),                                           color: "var(--accent-light)" },
                { label: "Total Rows", value: datasets.reduce((s, d) => s + d.rows, 0).toLocaleString(),           color: "var(--text-primary)" },
                { label: "Columns",    value: datasets.reduce((s, d) => s + d.columns, 0).toString(),              color: "var(--text-primary)" },
                { label: "Warnings",   value: datasets.reduce((s, d) => s + d.warnings.length, 0).toString(),
                  color: datasets.reduce((s, d) => s + d.warnings.length, 0) > 0 ? "#f59e0b" : "var(--green)" },
              ].map(k => (
                <div key={k.label} className="kpi-card" style={{ padding: "14px 18px" }}>
                  <div className="kpi-card-label">{k.label}</div>
                  <div className="kpi-card-value" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Connect Panel */}
          <div className="card fade-up" style={{ marginBottom: 28, overflow: "hidden" }}>
            {/* Panel header */}
            <div
              style={{ padding: "16px 24px", borderBottom: showConnect ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setShowConnect(v => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link2 size={16} color="var(--accent-light)" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Connect Data Source</span>
              </div>
              <ChevronDown size={16} color="var(--text-muted)" style={{ transform: showConnect ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </div>

            {showConnect && (
              <div>
                {/* Method tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                  {CONNECT_TABS.map(t => {
                    const Icon = t.icon;
                    const active = connectTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setConnectTab(t.id)}
                        style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 7, borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent", color: active ? "var(--accent-light)" : "var(--text-muted)", transition: "all 0.15s" }}
                      >
                        <Icon size={14} /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Panel content */}
                <div style={{ padding: 28 }}>
                  {connectTab === "file"     && <FileUploadPanel onUploaded={() => { load(); }} />}
                  {connectTab === "database" && <DatabasePanel   onUploaded={() => { load(); }} />}
                  {connectTab === "paste"    && <PastePanel      onUploaded={() => { load(); }} />}
                </div>
              </div>
            )}
          </div>

          {/* Dataset List */}
          <section className="fade-up">
            <div className="section-header">
              <h3 className="section-title">
                <Database size={15} style={{ color: "var(--accent-light)" }} />
                Datasets
                {datasets.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: "var(--bg-input)", padding: "1px 8px", borderRadius: 99, color: "var(--text-muted)" }}>{datasets.length}</span>}
              </h3>
              {datasets.length > 0 && (
                <div className="input-icon-wrap" style={{ width: 240 }}>
                  <Search className="icon" size={14} />
                  <input className="input" style={{ height: 36, paddingLeft: 36, fontSize: 13 }} placeholder="Search datasets..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading datasets...
              </div>
            )}

            {!loading && datasets.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Database size={44} style={{ opacity: 0.15, marginBottom: 16 }} />
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No datasets yet</p>
                <p style={{ fontSize: 13 }}>Upload a file, paste CSV data, or connect a database above.</p>
              </div>
            )}

            {!loading && filtered.length === 0 && datasets.length > 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
                No datasets match "{search}"
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filtered.map(ds => (
                  <div key={ds.dataset_id} style={{ opacity: deleting === ds.dataset_id ? 0.4 : 1, transition: "opacity 0.2s" }}>
                    <DatasetCard ds={ds} onView={setInspecting} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {inspecting && <DatasetInspector datasetId={inspecting} onClose={() => setInspecting(null)} />}
    </div>
  );
}
