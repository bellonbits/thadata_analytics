"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Mail, Shield, Crown, Eye, Trash2, Send, MoreHorizontal, Check } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-hot-toast";
import { apiSvc } from "@/lib/api";
import { TeamMember, Role } from "@/lib/types";

const AVATAR_COLORS = ["#ea580c", "#7c3aed", "#0891b2", "#16a34a", "#dc2626", "#d97706"];

const ROLE_CONFIG: Record<Role, { label: string; description: string; icon: React.ElementType; color: string }> = {
  owner:   { label: "Owner",   description: "Full access, billing, delete workspace", icon: Crown,  color: "#ea580c" },
  admin:   { label: "Admin",   description: "Manage team, integrations, all data",    icon: Shield, color: "#7c3aed" },
  analyst: { label: "Analyst", description: "Create reports, run analyses, view data", icon: Users,  color: "#0891b2" },
  viewer:  { label: "Viewer",  description: "View shared reports and dashboards only",  icon: Eye,    color: "var(--text-muted)" },
};

export default function TeamPage() {
  const { displayName } = useUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("analyst");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const data = await apiSvc.getTeam();
      setMembers(data);
    } catch (err) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const invite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    try {
      const initials = inviteEmail.slice(0, 2).toUpperCase();
      const newMember = await apiSvc.inviteTeamMember({
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "invited",
        initials,
        color: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      });
      setMembers(prev => [...prev, newMember]);
      setInviteEmail("");
      setShowInvite(false);
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch {
      toast.error("Failed to send invite");
    }
  };

  const changeRole = async (id: string, role: Role) => {
    try {
      const updated = await apiSvc.updateTeamRole(id, role);
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
      setActiveMenu(null);
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (id: string) => {
    try {
      await apiSvc.removeTeamMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      setActiveMenu(null);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const resendInvite = (email: string) => {
    toast.success(`Invite resent to ${email}`);
  };

  const activeMembers  = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status === "invited");

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Topbar />
        <div className="page-container">

          <div className="page-header fade-up">
            <div>
              <h2 className="page-header-title">
                <Users size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Team
              </h2>
              <p className="page-header-sub">Manage your workspace members and their access levels.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
              <Plus size={14} /> Invite Member
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Total Members", value: members.length },
              { label: "Active",         value: activeMembers.length },
              { label: "Pending Invites", value: pendingMembers.length },
              { label: "Admins",          value: members.filter(m => m.role === "owner" || m.role === "admin").length },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{ padding: "16px 20px" }}>
                <p style={{ fontSize: 26, fontWeight: 800 }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Invite form */}
          {showInvite && (
            <div className="card fade-up" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={15} color="var(--accent-light)" /> Invite Team Member
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && invite()}
                />
                <select className="input" style={{ width: 140 }} value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)}>
                  {(Object.keys(ROLE_CONFIG) as Role[]).filter(r => r !== "owner").map(r => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" onClick={invite}>
                  <Send size={13} /> Send Invite
                </button>
              </div>
            </div>
          )}

          {/* Active members */}
          <section className="section" style={{ marginBottom: 28 }}>
            <div className="section-header">
              <h3 className="section-title"><Check size={14} color="var(--green)" /> Active Members ({activeMembers.length})</h3>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Last Active</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.map(m => {
                    const roleCfg = ROLE_CONFIG[m.role];
                    const RoleIcon = roleCfg.icon;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                              {m.initials}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</p>
                              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: roleCfg.color, fontWeight: 600 }}>
                            <RoleIcon size={12} /> {roleCfg.label}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.last_active}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                        <td style={{ position: "relative" }}>
                          {m.role !== "owner" && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: "4px 8px" }}
                                onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {activeMenu === m.id && (
                                <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 50, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 8, width: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                                  <p style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Change Role</p>
                                  {(Object.keys(ROLE_CONFIG) as Role[]).filter(r => r !== "owner" && r !== m.role).map(r => (
                                    <button key={r} className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start", fontSize: 12 }} onClick={() => changeRole(m.id, r)}>
                                      {ROLE_CONFIG[r].label}
                                    </button>
                                  ))}
                                  <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
                                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start", fontSize: 12, color: "var(--red)" }} onClick={() => removeMember(m.id)}>
                                    <Trash2 size={12} /> Remove
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending invites */}
          {pendingMembers.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h3 className="section-title"><Mail size={14} color="var(--accent-light)" /> Pending Invites ({pendingMembers.length})</h3>
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Invited</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMembers.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-input)", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                              {m.initials}
                            </div>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m.email}</p>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: ROLE_CONFIG[m.role].color, fontWeight: 600 }}>{ROLE_CONFIG[m.role].label}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => resendInvite(m.email)}>
                              <Send size={11} /> Resend
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: "var(--red)" }} onClick={() => removeMember(m.id)}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Role legend */}
          <div className="card" style={{ padding: 20, marginTop: 24 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role Permissions</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "var(--radius)", background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} color={cfg.color} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 12, color: cfg.color }}>{cfg.label}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{cfg.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
