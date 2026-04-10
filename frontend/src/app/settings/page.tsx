"use client";

import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Palette, Database, CreditCard, Key, Save, Eye, EyeOff, Check, AlertTriangle, Zap } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

type Tab = "profile" | "notifications" | "security" | "appearance" | "data" | "billing" | "api";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",       icon: User     },
  { id: "notifications", label: "Notifications", icon: Bell     },
  { id: "security",      label: "Security",      icon: Shield   },
  { id: "appearance",    label: "Appearance",    icon: Palette  },
  { id: "data",          label: "Data & Storage",icon: Database },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "api",           label: "API Keys",      icon: Key      },
];

export default function SettingsPage() {
  const { displayName } = useUser();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [profile, setProfile] = useState({ fullName: displayName, email: "", company: "Thadata Inc.", timezone: "UTC", bio: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState({
    email_reports: true,
    email_alerts: true,
    email_weekly: false,
    push_alerts: true,
    push_insights: false,
    slack_digest: true,
  });

  // Security state
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [passwords, setPasswords]         = useState({ current: "", next: "", confirm: "" });
  const [twoFAEnabled, setTwoFAEnabled]   = useState(false);

  // Appearance state
  const [theme, setTheme]               = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor]   = useState("#ea580c");
  const [compactMode, setCompactMode]   = useState(false);
  const [animationsOn, setAnimationsOn] = useState(true);

  // Data state
  const [autoDelete, setAutoDelete] = useState("never");
  const [exportFormat, setExportFormat] = useState("csv");

  // API keys state
  const [apiKeys, setApiKeys] = useState([
    { id: "1", name: "Production", key: "sk_live_thd_••••••••••••••••••••••••jKp2", created: "2024-01-10", lastUsed: "Today" },
    { id: "2", name: "Development", key: "sk_test_thd_••••••••••••••••••••••••mR9q", created: "2024-02-20", lastUsed: "Yesterday" },
  ]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile(p => ({
          ...p,
          email: user.email ?? "",
          fullName: user.user_metadata?.full_name ?? displayName,
        }));
      }
    };
    loadUser();
  }, [displayName]);

  const saveProfile = async () => {
    setSavingProfile(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { full_name: profile.fullName } });
    await new Promise(r => setTimeout(r, 600));
    setSavingProfile(false);
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (!passwords.next || passwords.next !== passwords.confirm) { toast.error("Passwords don't match"); return; }
    if (passwords.next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    if (error) { toast.error(error.message); return; }
    setPasswords({ current: "", next: "", confirm: "" });
    toast.success("Password updated");
  };

  const generateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `Key ${apiKeys.length + 1}`,
      key: `sk_live_thd_${"•".repeat(24)}${Math.random().toString(36).slice(-4)}`,
      created: new Date().toLocaleDateString(),
      lastUsed: "Never",
    };
    setApiKeys(prev => [...prev, newKey]);
    toast.success("API key generated");
  };

  const revokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success("API key revoked");
  };

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontWeight: 800, fontSize: 16 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</p>}
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
        background: value ? "var(--accent)" : "var(--border)", position: "relative",
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 0.2s",
      }} />
    </div>
  );

  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Topbar />
        <div className="page-container">

          <div className="page-header fade-up">
            <div>
              <h2 className="page-header-title">
                <Settings size={20} style={{ color: "var(--accent-light)", display: "inline", marginRight: 8 }} />
                Settings
              </h2>
              <p className="page-header-sub">Manage your account, preferences, and workspace configuration.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>

            {/* Tab nav */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`nav-item ${tab === id ? "active" : ""}`}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", justifyContent: "flex-start" }}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="card" style={{ padding: 32 }}>

              {/* Profile */}
              {tab === "profile" && (
                <div>
                  <SectionHeader title="Profile" subtitle="Your personal information and display settings." />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Full Name">
                      <input className="input" style={{ width: "100%" }} value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} />
                    </Field>
                    <Field label="Email Address">
                      <input className="input" style={{ width: "100%", opacity: 0.7 }} value={profile.email} disabled />
                    </Field>
                    <Field label="Company">
                      <input className="input" style={{ width: "100%" }} value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} />
                    </Field>
                    <Field label="Timezone">
                      <select className="input" style={{ width: "100%" }} value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Bio" hint="Short description shown to your team members.">
                    <textarea className="input" style={{ width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your team about yourself..." />
                  </Field>
                  <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? <><Save size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
                  </button>
                </div>
              )}

              {/* Notifications */}
              {tab === "notifications" && (
                <div>
                  <SectionHeader title="Notifications" subtitle="Control how and when you receive updates." />
                  {[
                    { key: "email_reports", label: "Email: Report completion",   hint: "Receive an email when a report finishes generating." },
                    { key: "email_alerts",  label: "Email: Alert triggers",     hint: "Get emailed when an alert threshold is breached." },
                    { key: "email_weekly",  label: "Email: Weekly digest",      hint: "Weekly summary of your team's analyses and insights." },
                    { key: "push_alerts",   label: "Push: Critical alerts",     hint: "Browser push notifications for critical severity alerts." },
                    { key: "push_insights", label: "Push: New insights",        hint: "Get notified when AI surfaces a high-confidence insight." },
                    { key: "slack_digest",  label: "Slack: Daily digest",       hint: "Daily summary sent to your connected Slack channel." },
                  ].map(({ key, label, hint }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{label}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{hint}</p>
                      </div>
                      <Toggle value={notifs[key as keyof typeof notifs]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => toast.success("Notification preferences saved")}>
                    <Save size={13} /> Save Preferences
                  </button>
                </div>
              )}

              {/* Security */}
              {tab === "security" && (
                <div>
                  <SectionHeader title="Security" subtitle="Manage your password and two-factor authentication." />

                  <div style={{ marginBottom: 32 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Change Password</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
                      <div style={{ position: "relative" }}>
                        <input className="input" style={{ width: "100%", paddingRight: 40 }} type={showCurrentPw ? "text" : "password"} placeholder="Current password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                          {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input className="input" style={{ width: "100%", paddingRight: 40 }} type={showNewPw ? "text" : "password"} placeholder="New password (min 8 chars)" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} />
                        <button onClick={() => setShowNewPw(!showNewPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                          {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <input className="input" style={{ width: "100%" }} type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                      <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={changePassword}>
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: 14 }}>Two-Factor Authentication</h4>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Add an extra layer of security to your account.</p>
                      </div>
                      <Toggle value={twoFAEnabled} onChange={v => { setTwoFAEnabled(v); toast(v ? "2FA enabled" : "2FA disabled"); }} />
                    </div>
                    {twoFAEnabled && (
                      <div className="card" style={{ marginTop: 16, padding: 16, border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
                        <Check size={16} color="var(--green)" />
                        <p style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>Two-factor authentication is active</p>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginTop: 24 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 12 }}>Danger Zone</h4>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => toast.error("Please contact support to delete your account.")}>
                      <AlertTriangle size={13} /> Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {tab === "appearance" && (
                <div>
                  <SectionHeader title="Appearance" subtitle="Customize how Thadata looks and feels." />

                  <Field label="Theme">
                    <div style={{ display: "flex", gap: 10 }}>
                      {(["dark", "light", "system"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => { setTheme(t); if (t === "light") toast("Light mode coming soon"); }}
                          className={`btn btn-sm ${theme === t ? "btn-primary" : "btn-ghost"}`}
                          style={{ textTransform: "capitalize" }}
                        >
                          {theme === t && <Check size={12} />} {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Accent Color">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {["#ea580c", "#7c3aed", "#0891b2", "#16a34a", "#dc2626", "#d97706"].map(c => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c)}
                          style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: accentColor === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", outline: "none" }}
                        />
                      ))}
                    </div>
                  </Field>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>Compact Mode</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Reduces padding and spacing for denser information display.</p>
                    </div>
                    <Toggle value={compactMode} onChange={setCompactMode} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>Animations</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Enable fade-in and transition animations.</p>
                    </div>
                    <Toggle value={animationsOn} onChange={setAnimationsOn} />
                  </div>

                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => toast.success("Appearance settings saved")}>
                    <Save size={13} /> Save
                  </button>
                </div>
              )}

              {/* Data */}
              {tab === "data" && (
                <div>
                  <SectionHeader title="Data & Storage" subtitle="Manage how your data is stored and retained." />

                  <Field label="Auto-delete old analyses" hint="Automatically remove analyses older than the selected period.">
                    <select className="input" style={{ width: 200 }} value={autoDelete} onChange={e => setAutoDelete(e.target.value)}>
                      <option value="never">Never</option>
                      <option value="30d">After 30 days</option>
                      <option value="90d">After 90 days</option>
                      <option value="1y">After 1 year</option>
                    </select>
                  </Field>

                  <Field label="Default export format">
                    <div style={{ display: "flex", gap: 8 }}>
                      {["csv", "xlsx", "json"].map(f => (
                        <button key={f} onClick={() => setExportFormat(f)} className={`btn btn-sm ${exportFormat === f ? "btn-primary" : "btn-ghost"}`} style={{ textTransform: "uppercase", fontSize: 12 }}>
                          {exportFormat === f && <Check size={11} />} {f}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-input)", marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>Storage Usage</p>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>2.4 GB / 10 GB</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "24%", background: "var(--accent)", borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>24% used · 7.6 GB available</p>
                  </div>

                  <button className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={() => toast.success("Data preferences saved")}>
                    <Save size={13} /> Save
                  </button>
                </div>
              )}

              {/* Billing */}
              {tab === "billing" && (
                <div>
                  <SectionHeader title="Billing" subtitle="Manage your subscription and payment details." />

                  <div className="card" style={{ padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(234,88,12,0.25)", background: "rgba(234,88,12,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Zap size={16} color="var(--accent)" />
                          <span style={{ fontWeight: 800, fontSize: 16 }}>Pro Plan</span>
                          <span className="badge badge-orange">Active</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>$49/month · Up to 10 users · 10 GB storage · Unlimited analyses</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => toast("Contact sales to upgrade")}>Upgrade</button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Payment Method</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                      <CreditCard size={20} color="var(--text-muted)" />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>•••• •••• •••• 4242</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Expires 12/26</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => toast("Payment method update coming soon")}>Update</button>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Billing History</h4>
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {[
                            { date: "Apr 1, 2026", desc: "Pro Plan – Monthly", amount: "$49.00", status: "paid" },
                            { date: "Mar 1, 2026", desc: "Pro Plan – Monthly", amount: "$49.00", status: "paid" },
                            { date: "Feb 1, 2026", desc: "Pro Plan – Monthly", amount: "$49.00", status: "paid" },
                          ].map((r, i) => (
                            <tr key={i}>
                              <td style={{ fontSize: 13 }}>{r.date}</td>
                              <td style={{ fontSize: 13 }}>{r.desc}</td>
                              <td style={{ fontWeight: 600, fontSize: 13 }}>{r.amount}</td>
                              <td><span className="badge badge-green">{r.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys */}
              {tab === "api" && (
                <div>
                  <SectionHeader title="API Keys" subtitle="Manage keys for programmatic access to the Thadata API." />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <button className="btn btn-primary btn-sm" onClick={generateApiKey}>
                      <Key size={13} /> Generate New Key
                    </button>
                  </div>

                  <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Name</th><th>Key</th><th>Created</th><th>Last Used</th><th></th></tr>
                      </thead>
                      <tbody>
                        {apiKeys.map(k => (
                          <tr key={k.id}>
                            <td style={{ fontWeight: 600, fontSize: 13 }}>{k.name}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <code style={{ fontSize: 11, background: "var(--bg-input)", padding: "3px 8px", borderRadius: "var(--radius)", fontFamily: "monospace", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                  {showKeys[k.id] ? k.key.replace(/•+/, "actual_secret_here") : k.key}
                                </code>
                                <button onClick={() => setShowKeys(p => ({ ...p, [k.id]: !p[k.id] }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
                                  {showKeys[k.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.created}</td>
                            <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.lastUsed}</td>
                            <td>
                              <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", fontSize: 11 }} onClick={() => revokeKey(k.id)}>
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="card" style={{ padding: 16, border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.04)" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        Keep your API keys secret. Do not commit them to source control or share them publicly. If a key is compromised, revoke it immediately and generate a new one.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
