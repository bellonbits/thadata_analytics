"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, BarChart2, TrendingUp, Sparkles, Lock, Mail, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed]     = useState(false);
  const [resending, setResending]         = useState(false);
  const [resent, setResent]               = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmed(false);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmed(true);
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const resendConfirmation = async () => {
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResent(true);
  };

  return (
    <div className="auth-bg" style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Left panel */}
      <div className="auth-panel">
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", marginBottom: 48 }}>
          <Image src="/logo.png" alt="Thadata Analytics" width={200} height={68} style={{ objectFit: "contain" }} />
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Sign in to your analytics workspace</p>
        </div>

        {/* Social login */}
        <button className="social-btn" style={{ marginBottom: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <button className="social-btn" style={{ marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          Continue with GitHub
        </button>

        <div className="auth-divider">or sign in with email</div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="auth-form-label">Email address</label>
            <div className="input-icon-wrap">
              <Mail className="icon" size={15}/>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="auth-form-label" style={{ margin: 0 }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none" }}>Forgot password?</Link>
            </div>
            <div className="input-icon-wrap" style={{ position: "relative" }}>
              <Lock className="icon" size={15}/>
              <input
                type={showPwd ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="remember" style={{ accentColor: "var(--accent)", width: 14, height: 14 }}/>
            <label htmlFor="remember" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>Remember me for 30 days</label>
          </div>

          {unconfirmed && (
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 13 }}>
              <p style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>Email not confirmed</p>
              <p style={{ color: "var(--text-secondary)", marginBottom: 10 }}>
                Please check your inbox and click the confirmation link before signing in.
              </p>
              {resent ? (
                <p style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>✓ Confirmation email resent — check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={resending}
                  style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                >
                  {resending ? "Sending..." : "Resend confirmation email →"}
                </button>
              )}
            </div>
          )}

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
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%", animation: "spin 1s linear infinite" }}/>
                Signing in...
              </span>
            ) : (
              <><ArrowRight size={16}/> Sign in</>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 28 }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 600 }}>Create one free →</Link>
        </p>
      </div>

      {/* Right visual */}
      <div className="auth-visual">
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 12 }}>
              Your data, <span style={{ color: "var(--accent-light)" }}>intelligently</span> analyzed.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              Drop a CSV, describe your goal, and get instant KPIs, charts, and strategic recommendations powered by Groq AI.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: BarChart2,  color: "#ea580c", title: "Instant Dashboards",        desc: "KPIs, trends and charts auto-generated from your data" },
              { icon: Sparkles,   color: "#8b5cf6", title: "AI Recommendations",        desc: "Groq-powered insights with confidence scores and impact estimates" },
              { icon: TrendingUp, color: "#22c55e", title: "Strategy Simulator",         desc: "Model 'what-if' scenarios from a simple slider panel" },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card" style={{ border: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={f.color}/>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{f.title}</h4>
                    <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
