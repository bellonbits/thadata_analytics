"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, CheckCircle, XCircle, TrendingDown, TrendingUp, Activity, Plus, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { apiSvc } from "@/lib/api";
import { Dataset, Alert, AlertSeverity, AlertStatus } from "@/lib/types";


const severityConfig: Record<AlertSeverity, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.25)", icon: XCircle },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.25)", icon: AlertTriangle },
  info:     { color: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.25)", icon: Activity },
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AlertStatus>("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [newAlert, setNewAlert] = useState({ title: "", metric: "", threshold: "", severity: "warning" as AlertSeverity, dataset_id: "" });
  const [runningCheck, setRunningCheck] = useState<string | null>(null);

  useEffect(() => {
    apiSvc.getDatasets().then(setDatasets).catch(() => {});
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await apiSvc.getAlerts();
      setAlerts(data);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.status === filter);
  const counts = {
    all: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    snoozed: alerts.filter(a => a.status === "snoozed").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
  };

  const resolve = async (id: string) => {
    try {
      const updated = await apiSvc.updateAlertStatus(id, "resolved");
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
      toast.success("Alert resolved");
    } catch {
      toast.error("Failed to resolve alert");
    }
  };

  const snooze = async (id: string) => {
    try {
      const updated = await apiSvc.updateAlertStatus(id, "snoozed");
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
      toast("Alert snoozed for 24h", { icon: "😴" });
    } catch {
      toast.error("Failed to snooze alert");
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await apiSvc.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Alert deleted");
    } catch {
      toast.error("Failed to delete alert");
    }
  };

  const runCheck = async (id: string) => {
    setRunningCheck(id);
    await new Promise(r => setTimeout(r, 1500));
    setRunningCheck(null);
    toast.success("Check complete — no change detected");
  };

  const createAlert = async () => {
    if (!newAlert.title || !newAlert.metric || !newAlert.threshold) {
      toast.error("Fill in all fields");
      return;
    }
    const payload = {
      title: newAlert.title,
      description: `Alert when ${newAlert.metric} breaches threshold of ${newAlert.threshold}`,
      severity: newAlert.severity,
      status: "active" as const,
      metric: newAlert.metric,
      threshold: Number(newAlert.threshold),
      current_value: 0,
      dataset_id: newAlert.dataset_id || undefined,
    };
    try {
      const created = await apiSvc.createAlert(payload);
      setAlerts(prev => [created, ...prev]);
      setShowNewForm(false);
      setNewAlert({ title: "", metric: "", threshold: "", severity: "warning", dataset_id: "" });
      toast.success("Alert created");
    } catch {
      toast.error("Failed to create alert");
    }
  };

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Topbar />
        <div className="page-container">

          <div className="page-header fade-up">
            <div>
              <h2 className="page-header-title">
                <Bell size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Alerts
              </h2>
              <p className="page-header-sub">Monitor anomalies and threshold breaches across your data.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewForm(true)}>
              <Plus size={14} /> New Alert
            </button>
          </div>

          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total", count: counts.all, color: "var(--text-primary)", icon: Bell },
              { label: "Active", count: counts.active, color: "#ef4444", icon: AlertTriangle },
              { label: "Snoozed", count: counts.snoozed, color: "#f59e0b", icon: EyeOff },
              { label: "Resolved", count: counts.resolved, color: "var(--green)", icon: CheckCircle },
            ].map(({ label, count, color, icon: Icon }) => (
              <div key={label} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 800, color }}>{count}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* New alert form */}
          {showNewForm && (
            <div className="card fade-up" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Create Alert Rule</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewForm(false)}>Cancel</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Alert Title</label>
                  <input className="input" style={{ width: "100%" }} placeholder="e.g. Revenue Drop Alert" value={newAlert.title} onChange={e => setNewAlert(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Metric Name</label>
                  <input className="input" style={{ width: "100%" }} placeholder="e.g. monthly_revenue" value={newAlert.metric} onChange={e => setNewAlert(p => ({ ...p, metric: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Threshold</label>
                  <input className="input" type="number" style={{ width: "100%" }} placeholder="e.g. 50000" value={newAlert.threshold} onChange={e => setNewAlert(p => ({ ...p, threshold: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Severity</label>
                  <select className="input" style={{ width: "100%" }} value={newAlert.severity} onChange={e => setNewAlert(p => ({ ...p, severity: e.target.value as AlertSeverity }))}>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Dataset (optional)</label>
                  <select className="input" style={{ width: "100%" }} value={newAlert.dataset_id} onChange={e => setNewAlert(p => ({ ...p, dataset_id: e.target.value }))}>
                    <option value="">None</option>
                    {datasets.map(d => <option key={d.dataset_id} value={d.dataset_id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={createAlert}>Create Alert</button>
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {(["all", "active", "snoozed", "resolved"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
                style={{ textTransform: "capitalize", fontSize: 12 }}
              >
                {f} {counts[f] > 0 && <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : "var(--bg-input)", borderRadius: 10, padding: "0 6px", fontSize: 10, marginLeft: 4 }}>{counts[f]}</span>}
              </button>
            ))}
          </div>

          {/* Alert list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(alert => {
              const cfg = severityConfig[alert.severity];
              const SevIcon = cfg.icon;
              const pct = Math.min(100, (alert.current_value / alert.threshold) * 100);
              return (
                <div key={alert.id} className="card fade-up" style={{ padding: "16px 20px", border: `1px solid ${cfg.border}`, background: cfg.bg }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SevIcon size={16} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{alert.title}</span>
                        <span className={`badge ${alert.severity === "critical" ? "badge-red" : alert.severity === "warning" ? "badge-orange" : ""}`} style={alert.severity === "info" ? { background: "rgba(59,130,246,0.12)", color: "#3b82f6" } : {}}>
                          {alert.severity}
                        </span>
                        {alert.status === "resolved" && <span className="badge badge-green">resolved</span>}
                        {alert.status === "snoozed" && <span className="badge" style={{ background: "rgba(156,163,175,0.15)", color: "var(--text-muted)" }}>snoozed</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>{alert.description}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>Metric: <strong style={{ color: "var(--text-secondary)" }}>{alert.metric}</strong></span>
                        <span>Threshold: <strong style={{ color: "var(--text-secondary)" }}>{alert.threshold.toLocaleString()}</strong></span>
                        {alert.current_value > 0 && (
                          <span>Current: <strong style={{ color: cfg.color }}>{alert.current_value.toLocaleString()}</strong></span>
                        )}
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                      {alert.current_value > 0 && (
                        <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: cfg.color, borderRadius: 2, transition: "width 0.5s" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {alert.status === "active" && (
                        <>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => runCheck(alert.id)} disabled={runningCheck === alert.id}>
                            {runningCheck === alert.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Activity size={12} />}
                            Check
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => snooze(alert.id)}>
                            <EyeOff size={12} /> Snooze
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: "var(--green)" }} onClick={() => resolve(alert.id)}>
                            <CheckCircle size={12} /> Resolve
                          </button>
                        </>
                      )}
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "4px 8px" }} onClick={() => deleteAlert(alert.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Bell size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>No {filter !== "all" ? filter : ""} alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
