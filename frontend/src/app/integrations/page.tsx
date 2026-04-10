"use client";

import { useState, useEffect } from "react";
import { Plug2, Check, ExternalLink, Search, Zap, Database, BarChart2, MessageSquare, ShoppingCart, CreditCard, Mail, Globe, RefreshCw, Lock } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { toast } from "react-hot-toast";
import { apiSvc } from "@/lib/api";
import { Integration } from "@/lib/types";

const iconMap: Record<string, React.ElementType> = {
  Database, BarChart2, CreditCard, ShoppingCart, MessageSquare, Mail, Zap, Globe
};

const CATEGORIES = ["All", "Database", "Analytics", "CRM", "E-commerce", "Payments", "Notifications", "Automation", "Developer"];

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const data = await apiSvc.getIntegrations();
      setIntegrations(data);
    } catch {
      toast.error("Failed to load integrations");
    }
  };

  const filtered = integrations.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || i.category === category;
    return matchSearch && matchCat;
  });

  const connected = integrations.filter(i => i.status === "connected");

  const connect = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    if (integration.status === "coming_soon") {
      toast("Coming soon! Join the waitlist.", { icon: "🔔" });
      return;
    }
    setConnecting(id);
    try {
      const newStatus = integration.status === "connected" ? "available" : "connected";
      const updated = await apiSvc.updateIntegration(id, newStatus);
      setIntegrations(prev => prev.map(i => i.id === id ? updated : i));
      toast.success(newStatus === "connected" ? "Integration connected!" : "Integration disconnected");
    } catch {
      toast.error("Failed to update integration");
    } finally {
      setConnecting(null);
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
                <Plug2 size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Integrations
              </h2>
              <p className="page-header-sub">Connect your data sources, analytics tools, and notification channels.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
              <Check size={14} color="var(--green)" />
              <span><strong style={{ color: "var(--green)" }}>{connected.length}</strong> connected</span>
            </div>
          </div>

          {/* Connected integrations */}
          {connected.length > 0 && (
            <section className="section" style={{ marginBottom: 32 }}>
              <div className="section-header">
                <h3 className="section-title"><Check size={14} color="var(--green)" /> Active Connections</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {connected.map(i => {
                  const Icon = iconMap[i.icon] || Plug2;
                  return (
                    <div key={i.id} className="card" style={{ padding: "16px 18px", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: `${i.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={18} color={i.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</p>
                        {i.last_sync && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <RefreshCw size={10} /> Synced {i.last_sync}
                          </p>
                        )}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, flexShrink: 0 }} onClick={() => connect(i.id)}>
                        Disconnect
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Search and filter */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div className="input-icon-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search className="icon" size={14} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search integrations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`btn btn-sm ${category === c ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: 12 }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Integration cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(i => {
              const status = i.status;
              const isConnected = status === "connected";
              const isComingSoon = status === "coming_soon";
              const isConnecting = connecting === i.id;
              const Icon = iconMap[i.icon] || Plug2;

              return (
                <div key={i.id} className="card fade-up" style={{ padding: "20px 22px", opacity: isComingSoon ? 0.65 : 1, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius)", background: `${i.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${i.color}25` }}>
                      <Icon size={20} color={i.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</span>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-muted)" }}>{i.category}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{i.description}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {isConnected ? (
                      <span style={{ fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Check size={12} /> Connected
                        {i.last_sync && <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>· {i.last_sync}</span>}
                      </span>
                    ) : isComingSoon ? (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Lock size={11} /> Coming soon
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      className={`btn btn-sm ${isConnected ? "btn-ghost" : isComingSoon ? "btn-ghost" : "btn-secondary"}`}
                      onClick={() => connect(i.id)}
                      disabled={isConnecting}
                      style={{ fontSize: 12 }}
                    >
                      {isConnecting ? (
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
                      ) : isConnected ? (
                        "Manage"
                      ) : isComingSoon ? (
                        "Notify me"
                      ) : (
                        <>Connect <ExternalLink size={11} /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <Plug2 size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>No integrations match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
