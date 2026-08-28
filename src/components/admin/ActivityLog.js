"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ActivityLog() {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    getSupabaseClient()
      .from("activity_log")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.warn("activity_log:", error.message);
          setLogs([]);
          return;
        }
        setLogs(data ?? []);
      });
  }, []);

  if (logs === null) return null;
  if (!logs.length) return <p className="text-sm text-muted">No activity logged yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="circuit-card flex items-center justify-between gap-3 p-3 text-sm">
          <div>
            <span className="font-bold uppercase tracking-wide">{log.action}</span>
            {log.detail && <span className="text-muted"> — {log.detail}</span>}
          </div>
          <div className="shrink-0 text-right text-xs text-muted">
            <p>{log.profiles?.name ?? "admin"}</p>
            <p>{new Date(log.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
