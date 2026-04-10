"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Database, FileText, Lightbulb, TrendingUp,
  Bell, Plug2, Users, Settings, LogOut,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard",    badge: null },
  { href: "/datasources",  icon: Database,        label: "Data Sources", badge: "12" },
  { href: "/reports",      icon: FileText,        label: "Reports",      badge: null },
  { href: "/insights",     icon: Lightbulb,       label: "AI Insights",  badge: null },
  { href: "/simulator",    icon: TrendingUp,      label: "Simulator",    badge: null },
  { href: "/alerts",       icon: Bell,            label: "Alerts",       badge: "5"  },
  { href: "/integrations", icon: Plug2,           label: "Integrations", badge: null },
  { href: "/team",         icon: Users,           label: "Team",         badge: null },
  { href: "/settings",     icon: Settings,        label: "Settings",     badge: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useUser();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: "16px 14px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Image src="/logo.png" alt="Thadata Analytics" width={180} height={64} priority style={{ objectFit: "contain" }} />
        </Link>
      </div>

      {/* Team selector */}
      <div style={{ padding: "12px 14px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "8px 12px",
          cursor: "pointer", marginBottom: 12, border: "1px solid var(--border)", fontSize: 13,
        }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Growth Team</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={16} />
              <span>{label}</span>
              {badge && <span className="badge-count">{badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <button className="nav-item" style={{ color: "var(--text-muted)", width: "100%", background: "none", border: "none", cursor: "pointer" }} onClick={signOut}>
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
