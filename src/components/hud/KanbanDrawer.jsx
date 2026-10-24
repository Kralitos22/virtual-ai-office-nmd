"use client";

import React from "react";
import useStore from "@/store/useStore";
import { KANBAN_COLUMNS } from "@/constants/agentsData";

const COLUMN_STYLE = {
  TODO: "border-slate-600/60",
  ONGOING: "border-sky-600/60",
  WAITING_APPROVAL: "border-amber-600/60 bg-amber-950/30",
  DONE: "border-emerald-600/60",
};
const COLUMN_LABEL = {
  TODO: "To Do",
  ONGOING: "Ongoing",
  WAITING_APPROVAL: "Waiting Approval",
  DONE: "Done",
};

export default function KanbanDrawer() {
  const [open, setOpen] = React.useState(false);
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);
  const nameOf = (id) => agents.find((a) => a.id === id)?.name || id;

  const byColumn = (col) =>
    tasks
      .filter((t) => t.column === col)
      .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Tombol buka laci */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-10 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition"
      >
        ☰ Kanban ({tasks.length})
      </button>

      {/* Overlay + Drawer */}
      <div className={`fixed inset-0 z-30 ${open ? "" : "pointer-events-none hidden"}`}>
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[380px] max-w-[92vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/15 text-slate-100 shadow-2xl transition-transform ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Kanban Alur Kerja</h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="px-4 py-3 space-y-5 overflow-y-auto max-h-[calc(100vh-70px)]">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col === "WAITING_APPROVAL" ? "bg-amber-400" : col === "DONE" ? "bg-emerald-400" : col === "ONGOING" ? "bg-sky-400" : "bg-slate-500"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    {COLUMN_LABEL[col]} ({byColumn(col).length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {byColumn(col).map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-lg border bg-slate-950/60 px-3 py-2 text-xs ${COLUMN_STYLE[col]}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-200">{nameOf(t.agentId)}</span>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--"}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400 leading-snug">{t.title}</p>
                    </div>
                  ))}
                  {byColumn(col).length === 0 && (
                    <p className="text-[11px] text-slate-600 italic">Kosong</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
