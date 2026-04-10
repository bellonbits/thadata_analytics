"use client";

import { Search, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export function Topbar() {
  const { displayName, initials } = useUser();
  const user = { name: displayName, initials };
  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <div className="input-icon-wrap">
          <Search className="icon" size={15} />
          <input
            className="input"
            style={{ height: 36, fontSize: 13 }}
            placeholder="Search reports, metrics, datasets..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Add Data CTA */}
        <Link href="/datasources" className="btn btn-primary btn-sm" style={{ fontSize: 13 }}>
          <Plus size={15} />
          Add Data
        </Link>

        {/* Notifications */}
        <div className="icon-btn">
          <Bell size={16} />
          <span className="notif-dot" />
        </div>

        {/* Avatar */}
        <div className="topbar-avatar" title={user.name}>
          {user.initials}
        </div>
      </div>
    </header>
  );
}
