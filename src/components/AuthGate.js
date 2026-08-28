"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Servo from "@/components/Servo";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <Servo label="Checking credentials" />;

  if (user === null) {
    return (
      <div className="circuit-card mx-auto max-w-md p-8 text-center">
        <p className="font-display mb-2 text-xl font-bold uppercase tracking-tight">Members only</p>
        <p className="mb-5 text-sm text-muted">Sign in with your club account to see this page.</p>
        <Link href="/login" className="push-btn primary rounded-lg px-5 py-2 text-sm font-medium">
          Go to sign in
        </Link>
      </div>
    );
  }

  return children;
}
