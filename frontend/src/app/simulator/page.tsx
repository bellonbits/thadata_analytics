"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Play, Plus, Trash2, Sliders, BarChart2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { apiSvc } from "@/lib/api";
import { KPICard } from "@/components/ui/KPICard";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { AnalyzeResponse, Dataset } from "@/lib/types";

interface Scenario {
  id: string;
  name: string;
  variable: string;
  change: number;
  unit: string;
}



export default function SimulatorPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "1", name: "Base Case", variable: "revenue", change: 10, unit: "%" },
  ]);
  const [objective, setObjective] = useState("What is the projected impact on revenue and profitability if we adjust these variables?");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    apiSvc.getDatasets().then(setDatasets).catch(() => {});
    apiSvc.getScenarios().then(setSavedScenarios).catch(() => {});
  }, []);

  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now().toString(),
      name: "New Variable",
      variable: "",
      change: 0,
      unit: "%",
    }]);
  };

  const removeScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, field: keyof Scenario, value: string | number) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const applyPreset = (preset: Scenario) => {
    setScenarios(prev => [...prev, {
      id: Date.now().toString(),
      name: preset.name,
      variable: preset.variable,
      change: preset.change,
      unit: preset.unit,
    }]);
  };

  const runSimulation = async () => {
    if (!selectedDataset && datasets.length > 0) {
      toast.error("Select a dataset first");
      return;
    }
    setLoading(true);
    setError(null);

    const scenarioDesc = scenarios
      .map(s => `${s.name}: ${s.variable} changes by ${s.change}${s.unit}`)
      .join("; ");

    try {
      const res = await apiSvc.analyze({
        problem: `Strategy simulation: ${objective}. Scenarios: ${scenarioDesc}`,
        output: "strategy",
        dataset_id: selectedDataset || undefined,
        objective,
        constraints: scenarios.map(s => `${s.variable} ${s.change > 0 ? "+" : ""}${s.change}${s.unit}`),
        context: {
          dataset: selectedDataset || "",
          industry: "general",
          time_range: "recent",
        },
        parameters: {},
      });
      setResult(res);

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("analyses").insert({
        user_id: user?.id,
        headline: res.headline,
        mode: "strategy",
        rows_analyzed: res.meta.rows_analyzed,
        confidence: res.meta.confidence_overall,
        data: res,
      });

      toast.success("Simulation complete");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail ?? "Simulation failed. Check backend connection.");
    } finally {
      setLoading(false);
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
                <TrendingUp size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Strategy Simulator
              </h2>
              <p className="page-header-sub">Model what-if scenarios and project business outcomes using AI.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={runSimulation} disabled={loading}>
              {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
              Run Simulation
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

            {/* Controls Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Dataset */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart2 size={14} color="var(--accent-light)" /> Dataset
                </h3>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={selectedDataset}
                  onChange={e => setSelectedDataset(e.target.value)}
                >
                  <option value="">No dataset (AI only)</option>
                  {datasets.map(d => (
                    <option key={d.dataset_id} value={d.dataset_id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Objective */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={14} color="var(--accent-light)" /> Objective
                </h3>
                <textarea
                  className="input"
                  style={{ width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="What outcome are you trying to model?"
                />
              </div>

              {/* Scenarios */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <Sliders size={14} color="var(--accent-light)" /> Variables
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={addScenario} style={{ fontSize: 11, padding: "4px 8px" }}>
                    <Plus size={12} /> Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {scenarios.map(s => (
                    <div key={s.id} style={{ padding: "10px 12px", background: "var(--bg-input)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <input
                          className="input"
                          style={{ flex: 1, fontSize: 12 }}
                          value={s.name}
                          onChange={e => updateScenario(s.id, "name", e.target.value)}
                          placeholder="Label"
                        />
                        <button onClick={() => removeScenario(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          className="input"
                          style={{ flex: 1, fontSize: 12 }}
                          value={s.variable}
                          onChange={e => updateScenario(s.id, "variable", e.target.value)}
                          placeholder="Variable"
                        />
                        <input
                          className="input"
                          style={{ width: 70, fontSize: 12 }}
                          type="number"
                          value={s.change}
                          onChange={e => updateScenario(s.id, "change", Number(e.target.value))}
                        />
                        <input
                          className="input"
                          style={{ width: 44, fontSize: 12 }}
                          value={s.unit}
                          onChange={e => updateScenario(s.id, "unit", e.target.value)}
                          placeholder="%"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presets */}
              {savedScenarios.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Saved Scenarios</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {savedScenarios.map(p => (
                      <button
                        key={p.id}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: "flex-start", fontSize: 12 }}
                        onClick={() => applyPreset(p)}
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div>
              {loading && (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <Loader2 size={48} color="var(--accent)" style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
                  <p style={{ fontWeight: 700, fontSize: 18 }}>Running simulation with Groq AI...</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>Modeling scenarios and projecting outcomes...</p>
                </div>
              )}

              {error && !loading && (
                <div className="card" style={{ padding: 24, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <span style={{ fontWeight: 700, color: "#ef4444" }}>Simulation Failed</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{error}</p>
                </div>
              )}

              {result && !loading && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="card" style={{ padding: "18px 24px", border: "1px solid rgba(234,88,12,0.2)", background: "linear-gradient(135deg, rgba(234,88,12,0.04), transparent)" }}>
                    <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{result.headline}</h2>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
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

                  {result.actions.length > 0 && (
                    <div className="card" style={{ padding: 24, border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.03)" }}>
                      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <TrendingUp size={16} color="var(--green)" /> Strategic Recommendations
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {result.actions.map((action, i) => (
                          <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
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
              )}

              {!result && !loading && !error && (
                <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>
                  <TrendingUp size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Ready to simulate</p>
                  <p style={{ fontSize: 14, marginBottom: 24 }}>Configure your variables and objective, then run the simulation.</p>
                  <button className="btn btn-primary" onClick={runSimulation}>
                    <Play size={15} /> Run Simulation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
