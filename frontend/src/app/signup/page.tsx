"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Zap, CheckCircle2, ArrowRight, Mail, Lock, User, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const plans = [
  { id: "starter",    label: "Starter",    price: "Free",    desc: "5 datasets · 10 analyses/mo" },
  { id: "pro",        label: "Pro",        price: "$29/mo",  desc: "Unlimited · AI reports · Export" },
  { id: "enterprise", label: "Enterprise", price: "Custom",  desc: "SSO · SLA · Dedicated support" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [plan, setPlan] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, plan } },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="auth-bg" style={{ minHeight: "100vh", background: "var(--bg-base)", flexDirection: "row-reverse" }}>
      {/* Form panel */}
      <div className="auth-panel" style={{ borderRight: "none", borderLeft: "1px solid var(--border)" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", marginBottom: 36 }}>
          <Image src="/logo.png" alt="Thadata Analytics" width={200} height={68} style={{ objectFit: "contain" }} />
        </Link>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>Start analyzing your data in minutes. No credit card required.</p>
        </div>

        {/* Social buttons */}
        <button className="social-btn" style={{ marginBottom: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign up with Google
        </button>

        <div className="auth-divider">or create account with email</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name + Company row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="auth-form-label">Full name</label>
              <div className="input-icon-wrap">
                <User className="icon" size={14}/>
                <input type="text" className="input" placeholder="Jane Smith" required style={{ height: 42 }} value={fullName} onChange={e => setFullName(e.target.value)}/>
              </div>
            </div>
            <div>
              <label className="auth-form-label">Company</label>
              <div className="input-icon-wrap">
                <Building2 className="icon" size={14}/>
                <input type="text" className="input" placeholder="Acme Inc." style={{ height: 42 }}/>
              </div>
            </div>
          </div>

          <div>
            <label className="auth-form-label">Work email</label>
            <div className="input-icon-wrap">
              <Mail className="icon" size={14}/>
              <input type="email" className="input" placeholder="jane@company.com" required style={{ height: 42 }} value={email} onChange={e => setEmail(e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="auth-form-label">Password</label>
            <div className="input-icon-wrap" style={{ position: "relative" }}>
              <Lock className="icon" size={14}/>
              <input
                type={showPwd ? "text" : "password"}
                className="input"
                placeholder="min. 8 characters"
                required
                style={{ paddingRight: 42, height: 42 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          {/* Plan selector */}
          <div>
            <label className="auth-form-label">Choose a plan</label>
            <div style={{ display: "flex", gap: 8 }}>
              {plans.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: "var(--radius)", fontSize: 12,
                    fontWeight: 600, cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                    border: plan === p.id ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    background: plan === p.id ? "var(--accent-muted)" : "var(--bg-card)",
                    color: plan === p.id ? "var(--accent-light)" : "var(--text-secondary)",
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: plan === p.id ? "var(--accent-light)" : "var(--text-primary)" }}>{p.price}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)", marginTop: 2 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* TOS */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <input type="checkbox" id="tos" required style={{ accentColor: "var(--accent)", width: 14, height: 14, marginTop: 2, flexShrink: 0 }}/>
            <label htmlFor="tos" style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              I agree to the{" "}
              <Link href="/terms" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Privacy Policy</Link>
            </label>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: "center" }}
          >
            {loading ? "Creating account..." : <><ArrowRight size={16}/> Create account</>}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>

      {/* Left visual */}
      <div className="auth-visual">
        <div style={{ maxWidth: 440, width: "100%" }}>
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent-light)", background: "var(--accent-muted)", padding: "5px 12px", borderRadius: 99, marginBottom: 20 }}>
              <Zap size={13} fill="currentColor"/> Trusted by 3,800+ data teams worldwide
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 16 }}>
              Go from raw data to <span style={{ color: "var(--accent-light)" }}>live insights</span> in under 60 seconds.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
              Upload any CSV or connect your warehouse. Thadata's AI automatically profiles your data, surfaces anomalies, and generates board-ready reports—no SQL required.
            </p>
          </div>

          {/* Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Instant KPI dashboards from any dataset",
              "AI-written strategic reports with citations",
              "Groq Llama 4 Scout – fastest inference on the market",
              "SOC2 ready · End-to-end encryption",
              "Unlimited uploads on Pro & Enterprise",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                <CheckCircle2 size={17} style={{ color: "var(--accent-light)", flexShrink: 0 }}/>
                {item}
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="card" style={{ marginTop: 36, padding: "18px 20px", borderColor: "rgba(234,88,12,0.15)" }}>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14, fontStyle: "italic" }}>
              "Thadata replaced three separate BI tools and our weekly analyst meeting. We get better answers in 30 seconds."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#ea580c,#c2410c)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>S</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Sarah K.</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Head of Growth, TechFlow</div>
              </div>
              <div style={{ marginLeft: "auto", color: "#f59e0b", fontSize: 14 }}>★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
