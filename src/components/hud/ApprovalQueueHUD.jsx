"use client";

import React from "react";
import useStore from "@/store/useStore";

// Approval Queue HUD — notifikasi global di bawah Top Bar
// Tampil ketika ada >= 1 agent WAITING_APPROVAL; telusuri daftar item.

export default function ApprovalQueueHUD() {
  const approvalQueue = useStore((s) => s.approvalQueue);
  const agents = useStore((s) => s.agents);
  const selectAgent = useStore((s) => s.selectAgent);

  if (!approvalQueue.length) return null;
  const nameOf = (id) => agents.find((a) => a.id === id)?.name || id;

  return (
    <div className="pointer-events-auto fixed left-4 bottom-4 z-10 max-w-sm rounded-lg border border-rose-500/40 bg-slate-900/85 p-3 shadow-2xl backdrop-blur-xl text-slate-100">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
          Approval Queue ({approvalQueue.length})
        </p>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {approvalQueue.map((q) => (
          <button
            key={q.agentId}
            onClick={() => selectAgent(q.agentId)}
            className="w-full flex items-start justify-between gap-2 rounded-lg border border-rose-500/20 bg-rose-950/30 px-2.5 py-2 text-left hover:bg-rose-950/50 transition"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{nameOf(q.agentId)}</p>
              <p className="text-[11px] text-slate-300 truncate">{q.title}</p>
            </div>
            <span className="text-rose-300 text-xs font-mono shrink-0">🔔</span>
          </button>
        ))}
      </div>
    </div>
  );
}
