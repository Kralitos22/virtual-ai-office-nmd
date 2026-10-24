"use client";

import React, { useState } from "react";
import useStore, { AGENT_STATES } from "@/store/useStore";

export default function ControlPanel() {
  const [instructionText, setInstructionText] = useState("");
  const [message, setMessage] = useState(null);

  const agents = useStore((s) => s.agents);
  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const clearSelectedAgent = useStore((s) => s.clearSelectedAgent);
  const approveTask = useStore((s) => s.approveTask);
  const rejectTask = useStore((s) => s.rejectTask);
  const pauseAgent = useStore((s) => s.pauseAgent);
  const resumeAgent = useStore((s) => s.resumeAgent);
  const injectInstruction = useStore((s) => s.injectInstruction);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  if (!selectedAgent) return null;

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleApprove = () => {
    approveTask(selectedAgent.id);
    flash(`✅ ${selectedAgent.name} disetujui`);
  };
  const handleReject = () => {
    rejectTask(selectedAgent.id);
    flash(`🔄 ${selectedAgent.name} revisi`);
  };
  const handlePause = () => {
    pauseAgent(selectedAgent.id);
    flash(`⏸ ${selectedAgent.name} dijeda`);
  };
  const handleResume = () => {
    resumeAgent(selectedAgent.id);
    flash(`▶ ${selectedAgent.name} dilanjutkan`);
  };
  const handleInject = (e) => {
    e.preventDefault();
    if (!instructionText.trim()) return;
    injectInstruction(selectedAgent.id, instructionText.trim());
    flash(`📥 Instruksi terkirim ke ${selectedAgent.name}`);
    setInstructionText("");
  };

  const statusStyle =
    selectedAgent.status === AGENT_STATES.WAITING_APPROVAL
      ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
      : "bg-emerald-500/20 text-emerald-400";

  return (
    <aside className="fixed right-6 top-6 z-20 w-96 max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/75 p-5 text-slate-100 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300 border border-amber-500/30">
              {selectedAgent.id}
            </span>
            <span className="text-xs text-slate-400">{selectedAgent.division}</span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-white">{selectedAgent.name}</h2>
          <p className="text-xs font-medium text-sky-400">{selectedAgent.role}</p>
        </div>
        <button
          onClick={clearSelectedAgent}
          className="rounded-lg bg-white/5 p-1.5 text-slate-400 hover:bg-white/15 hover:text-white transition"
          title="Tutup Panel"
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="my-4 rounded-xl bg-slate-950/60 p-3 border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Status Agent:</span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded ${statusStyle}`}>
            {selectedAgent.status}
          </span>
        </div>
        <div className="mt-2 text-xs">
          <span className="text-slate-400 block mb-0.5">Tugas Saat Ini:</span>
          <p className="font-medium text-slate-200 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            {selectedAgent.task}
          </p>
        </div>
      </div>

      {/* Toast flash */}
      {message && (
        <div className="mb-3 rounded-lg bg-sky-500/15 border border-sky-500/30 px-3 py-2 text-xs text-sky-200">
          {message}
        </div>
      )}

      {/* Aksi */}
      <div className="mb-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Kendali Eksekusi Komisaris
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={handleApprove} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition">
            ✓ Approve
          </button>
          <button onClick={handleReject} className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 border border-rose-400/30 transition">
            ✕ Reject
          </button>
          <button onClick={handlePause} className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600/70 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white border border-amber-400/30 transition">
            ⏸ Pause
          </button>
          <button onClick={handleResume} className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600/70 hover:bg-sky-500 px-3 py-2 text-xs font-bold text-white border border-sky-400/30 transition">
            ▶ Resume
          </button>
        </div>
      </div>

      {/* Inject */}
      <form onSubmit={handleInject} className="border-t border-white/10 pt-3">
        <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Inject Instruction (Interupsi Real-Time)
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            placeholder={`Contoh: ubah gaya bahasa menjadi formal`}
            className="w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 py-2 text-xs font-bold text-white shadow-lg transition"
          >
            Kirim Instruksi ke {selectedAgent.name}
          </button>
        </div>
      </form>
    </aside>
  );
}
