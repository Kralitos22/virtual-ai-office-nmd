"use client";

import React, { useEffect } from "react";
import OfficeCanvas from "@/components/canvas/OfficeCanvas";
import ControlPanel from "@/components/hud/ControlPanel";
import TopBarHUD from "@/components/hud/TopBarHUD";
import KanbanDrawer from "@/components/hud/KanbanDrawer";
import ApprovalQueueHUD from "@/components/hud/ApprovalQueueHUD";
import useStore from "@/store/useStore";
import { connectSocket, disconnectSocket } from "@/services/socketClient";

// SCRIPTED DEMO — simulasi alur kerja Bab 5 & 10C PRD (digantikan backend Socket.io sungguhan di produksi)
export default function HomePage() {
  const handleSocketEvent = useStore((s) => s.handleSocketEvent);
  const fireBeam = useStore((s) => s.fireBeam);

  // 1. Coba konek Socket.io server (jika VITE_SOCKET_URL diset). Tanpa itu → demo mode.
  // 2. Jalankan skenario demo berurutan dengan TASK_HANDOFF + AGENT_STATUS_UPDATE.
  useEffect(() => {
    const store = useStore.getState();
    if (!connectSocket({ store })) {
      console.log("[SOCKET] no VITE_SOCKET_URL → demo mode");
    }
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    const timers = [];

    // Detik 1.5: Anton validasi lead → buat Client Fact Sheet → handoff ke Rina (beam)
    timers.push(setTimeout(() => {
      console.log("[DEMO] Anton selesai validasi lead, buat Client Fact Sheet, kirim ke Rina");
      handleSocketEvent({
        event: "TASK_HANDOFF",
        from_agent_id: "NMD-SLS-001",
        to_agent_id: "NMD-MGT-001",
        task: "Client Fact Sheet",
      });
    }, 1500));

    // Detik 2: payload contoh Bab 10C (Nadia menulis caption IG)
    timers.push(setTimeout(() => {
      handleSocketEvent({
        event: "AGENT_STATUS_UPDATE",
        agent_id: "NMD-SMM-002",
        status: "WORKING",
        task: "Menulis Caption IG",
        requires_approval: false,
      });
    }, 2200));

    // Detik 5: Nadia selesai draf → butuh approval
    timers.push(setTimeout(() => {
      handleSocketEvent({
        event: "AGENT_STATUS_UPDATE",
        agent_id: "NMD-SMM-002",
        status: "WORKING",
        task: "Caption IG siap — menunggu Acc Komisaris",
        requires_approval: true,
      });
    }, 5200));

    // Detik 7: Rina + Hermes + Axel + Sofi masuk War Room (IN_MEETING; agent akan berjalan)
    const meeting = [
      { agent_id: "NMD-MGT-001", name: "Rina" },
      { agent_id: "NMD-EXEC-02", name: "Hermes" },
      { agent_id: "NMD-WEB-001", name: "Axel" },
      { agent_id: "NMD-SMM-001", name: "Sofi" },
    ];
    timers.push(setTimeout(() => {
      console.log("[DEMO] Rapat inisiasi di War Room");
      meeting.forEach((m) =>
        handleSocketEvent({
          event: "AGENT_STATUS_UPDATE",
          agent_id: m.agent_id,
          status: "IN_MEETING",
          task: "Diskusi Brief Proyek Baru",
          requires_approval: false,
        })
      );
    }, 7200));

    // Detik 10: Tania kirim invoice → butuh approval Komisaris
    timers.push(setTimeout(() => {
      handleSocketEvent({
        event: "AGENT_STATUS_UPDATE",
        agent_id: "NMD-MGT-003",
        status: "WORKING",
        task: "Invoice Klien #INV-2026 siap dikirim (butuh persetujuan)",
        requires_approval: true,
      });
    }, 10200));

    // Detik 12: Dimas kirim jadwal post ke Komisaris sebagai dokumen PENDING
    timers.push(setTimeout(() => {
      handleSocketEvent({
        event: "AGENT_STATUS_UPDATE",
        agent_id: "NMD-SMM-005",
        status: "WORKING",
        task: "Jadwal Post — PENDING approval Komisaris",
        requires_approval: true,
      });
    }, 12400));

    // Detik 15: Sofi → Nadia handoff (beam) dan Mike → Brand QA handoff (beam)
    timers.push(setTimeout(() => {
      handleSocketEvent({ event: "TASK_HANDOFF", from_agent_id: "NMD-SMM-001", to_agent_id: "NMD-SMM-002", task: "Brief Riset Tren" });
    }, 15000));
    timers.push(setTimeout(() => {
      handleSocketEvent({ event: "TASK_HANDOFF", from_agent_id: "NMD-SMM-004", to_agent_id: "NMD-MGT-002", task: "Konten Reels utk QA" });
    }, 15600));

    return () => timers.forEach(clearTimeout);
  }, [handleSocketEvent, fireBeam]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Layer 3D isometrik kantor */}
      <OfficeCanvas />

      {/* HUD Komisaris: TopBar + Mode Otonomi + Approval badge */}
      <TopBarHUD />
      <ApprovalQueueHUD />

      {/* Panel kendali agent terpilih */}
      <ControlPanel />

      {/* Kanban drawer */}
      <KanbanDrawer />
    </main>
  );
}
