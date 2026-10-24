"use client";

import React from "react";
import useStore from "@/store/useStore";

const MODES = [
  { id: "PILOT", label: "Pilot", desc: "Satu-satu, konfirmasi manual" },
  { id: "CRUISE", label: "Cruise", desc: "Setengah otonom, tetap diawasi" },
  { id: "TURBO", label: "Turbo", desc: "Otonom penuh, laporan berkala" },
];

export default function TopBarHUD() {
  const autonomyMode = useStore((s) => s.autonomyMode);
  const setAutonomyMode = useStore((s) => s.setAutonomyMode);
  const wsConnected = useStore((s) => s.wsConnected);
  const approvalQueue = useStore((s) => s.approvalQueue);
  const agents = useStore((s) => s.agents);
  const working = agents.filter((a) => a.status === "WORKING").length;

  return (
    <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="glass-panel rounded-xl border border-slate-700/60 bg-slate-900/75 px-4 py-3 backdrop-blur-md text-slate-100 shadow-lg">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <h1 className="text-sm font-bold tracking-wider uppercase">PT NEBULA MOTION DIGITAL</h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Virtual AI Office — 15 Agent {wsConnected ? "• Live WebSocket" : "• Demo Mode"}
        </p>
      </div>

      {/* Mode Otonomi */}
      <div className="pointer-events-auto flex rounded-xl border border-slate-700/60 bg-slate-900/75 backdrop-blur-md p-1 shadow-lg w-fit">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setAutonomyMode(m.id)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${
              autonomyMode === m.id
                ? "bg-sky-500/25 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Approval queue badge global + working count */}
      <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs shadow-lg transition ${
        approvalQueue.length > 0
          ? "border-rose-500/40 bg-rose-950/50 text-rose-200"
          : "border-slate-700/60 bg-slate-900/60 text-slate-300"
      }`}>
        {approvalQueue.length > 0 && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
          </span>
        )}
        <span className="font-mono text-[11px]">
          {approvalQueue.length > 0
            ? `⚠ PERHATIAN: ${approvalQueue.length} agent menunggu persetujuanmu`
            : `✓ Semua agent bekerja (${working} WORKING)`}
        </span>
      </div>
    </div>
  );
}
