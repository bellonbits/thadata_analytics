"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

let globalUserPromise: Promise<{ data: { user: User | null } }> | null = null;
let globalSupabase: any = null;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!globalSupabase) {
      globalSupabase = createClient();
    }
    const supabase = globalSupabase;

    if (!globalUserPromise) {
      globalUserPromise = supabase.auth.getUser();
    }

    globalUserPromise.then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      globalUserPromise = Promise.resolve({ data: { user: sessionUser } });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User";

  return { user, loading, signOut, initials, displayName };
}
