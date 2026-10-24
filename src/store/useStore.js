import { create } from "zustand";
import { AGENT_STATES, INITIAL_AGENTS, WAR_ROOM_SEATS, KANBAN_COLUMNS } from "../constants/agentsData";

// Iterator kursi War Room (round-robin utk agent masuk meeting)
let seatCursor = 0;
const allocateSeat = () => WAR_ROOM_SEATS[seatCursor++ % WAR_ROOM_SEATS.length];

const makeTask = (agentId, title, column, meta = {}) => ({
  id: `TASK-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
  agentId,
  title,
  column, // TODO | ONGOING | WAITING_APPROVAL | DONE
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...meta,
});

const seedTasks = () => {
  const tasks = [];
  INITIAL_AGENTS.forEach((a) => {
    // Satu task aktif per agent yg bukan IDLE murni
    if (a.status === AGENT_STATES.WORKING) {
      tasks.push(makeTask(a.id, a.task, "ONGOING"));
    } else if (a.status === AGENT_STATES.IDLE) {
      tasks.push(makeTask(a.id, a.task, "TODO"));
    }
  });
  return tasks;
};

// Store Zustand final & scalable
const useStore = create((set, get) => ({
  agents: INITIAL_AGENTS,
  tasks: seedTasks(),
  approvalQueue: [], // daftar task menunggu approval Komisaris
  selectedAgentId: null,
  autonomyMode: "PILOT", // PILOT | CRUISE | TURBO
  wsConnected: false,
  lastSocketLog: null,
  beams: [], // WorkflowBeam animasi
  agentPulse: {}, // signal inject/nod => { agentId, token }
  notification: null, // toast global

  // ===== Komisaris selection =====
  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  clearSelectedAgent: () => set({ selectedAgentId: null }),

  setAutonomyMode: (mode) => set({ autonomyMode: mode }),

  // ===== Helper update satu agent =====
  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === agentId ? { ...a, ...updates } : a)),
    })),

  // Terapkan status + task + posisi target (lazy movement via useFrame)
  applyAgentState: (payload) =>
    set((state) => {
      const { agent_id, status, task, requires_approval, targetPosition } = payload;
      // Paksa WAITING_APPROVAL jika requires_approval true (Bab 10C PRD)
      const finalStatus = requires_approval ? AGENT_STATES.WAITING_APPROVAL : status;
      let seat = null;
      if (finalStatus === AGENT_STATES.IN_MEETING) seat = allocateSeat();
      const agents = state.agents.map((a) => {
        if (a.id !== agent_id) return a;
        return {
          ...a,
          status: finalStatus,
          task: task || a.task,
          requires_approval: Boolean(requires_approval),
          targetPosition: finalStatus === AGENT_STATES.IN_MEETING ? seat : targetPosition || a.homePosition,
          seat: finalStatus === AGENT_STATES.IN_MEETING ? seat : null,
        };
      });

      // Update approval queue
      let approvalQueue = state.approvalQueue;
      if (requires_approval) {
        const existing = approvalQueue.find((q) => q.agentId === agent_id);
        const entry = {
          agentId: agent_id,
          title: task || "Butuh persetujuan",
          submittedAt: Date.now(),
        };
        approvalQueue = existing
          ? approvalQueue.map((q) => (q.agentId === agent_id ? entry : q))
          : [...approvalQueue, entry];
      } else {
        approvalQueue = approvalQueue.filter((q) => q.agentId !== agent_id);
      }

      // Sinkron kanban task column
      const tasks = state.tasks.map((t) => {
        if (t.agentId !== agent_id) return t;
        let column = "ONGOING";
        if (finalStatus === AGENT_STATES.WAITING_APPROVAL) column = "WAITING_APPROVAL";
        else if (finalStatus === AGENT_STATES.IDLE) column = "TODO";
        return { ...t, column, title: task || t.title, updatedAt: Date.now() };
      });

      return { agents, approvalQueue, tasks, lastSocketLog: payload };
    }),

  // ===== Kendali Komisaris (Approve/Reject/Pause/Resume) =====
  approveTask: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, status: AGENT_STATES.WORKING, requires_approval: false, task: `✅ Disetujui: lanjut ${a.task.replace(/^✅.*:/, "")}` }
          : a
      ),
      approvalQueue: state.approvalQueue.filter((q) => q.agentId !== agentId),
      tasks: state.tasks.map((t) =>
        t.agentId === agentId ? { ...t, column: "ONGOING", updatedAt: Date.now() } : t
      ),
    })),

  rejectTask: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, status: AGENT_STATES.WORKING, requires_approval: false, task: `🔄 Revisi: perbaiki ${a.task.replace(/^🔄.*:/, "")}` }
          : a
      ),
      approvalQueue: state.approvalQueue.filter((q) => q.agentId !== agentId),
      tasks: state.tasks.map((t) =>
        t.agentId === agentId ? { ...t, column: "ONGOING", updatedAt: Date.now() } : t
      ),
    })),

  pauseAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, status: AGENT_STATES.IDLE, task: "⏸ Dihentikan sementara (Paused by Karlitos)" }
          : a
      ),
    })),

  resumeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, status: AGENT_STATES.WORKING, task: "▶ Melanjutkan tugas operasional" }
          : a
      ),
    })),

  // ===== Inject Instruction (memicu animasi nod) =====
  injectInstruction: (agentId, instruction) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, status: AGENT_STATES.WORKING, task: `💬 ${instruction}` }
          : a
      ),
      agentPulse: {
        ...state.agentPulse,
        [agentId]: (state.agentPulse[agentId] || 0) + 1, // bump token utk nod animasi
      },
      notification: {
        type: "inject",
        text: `Instruksi terkirim ke ${state.agents.find((x) => x.id === agentId)?.name || agentId}`,
        ts: Date.now(),
      },
    })),

  clearNotification: () => set({ notification: null }),

  // ===== Workflow Beam (tugas berpindah antar agent) =====
  fireBeam: (fromAgentId, toAgentId, taskTitle) => {
    const beamId = `BEAM-${Date.now()}-${Math.floor(Math.random() * 999)}`;
    const beam = {
      id: beamId,
      from: fromAgentId,
      to: toAgentId,
      task: taskTitle || "Task",
      born: Date.now(),
      ttl: 2600, // ms, garis hilang setelah ~2.6s
    };
    set((state) => ({ beams: [...state.beams.slice(-8), beam] }));
    // auto-clean
    setTimeout(() => {
      set((state) => ({ beams: state.beams.filter((b) => b.id !== beamId) }));
    }, beam.ttl);
    return beamId;
  },

  // ===== Socket.io (Backend Ready) =====
  setWsConnected: (v) => set({ wsConnected: v }),
  // Handler dipanggil socketClient, menyatukan event orchestration
  handleSocketEvent: (payload) => {
    const st = get();
    switch (payload.event) {
      case "AGENT_STATUS_UPDATE":
        st.applyAgentState(payload);
        break;
      case "TASK_HANDOFF": {
        // payload: { from_agent_id, to_agent_id, task }
        st.fireBeam(payload.from_agent_id, payload.to_agent_id, payload.task);
        const nameOf = (id) => st.agents.find((a) => a.id === id)?.name || id;
        set({
          notification: {
            type: "handoff",
            text: `${nameOf(payload.from_agent_id)} → ${nameOf(payload.to_agent_id)}: ${payload.task}`,
            ts: Date.now(),
          },
        });
        break;
      }
      case "COMMISSIONER_INJECT":
        st.injectInstruction(payload.agent_id, payload.instruction);
        break;
      default:
        set({ lastSocketLog: payload });
    }
  },

  // ===== Kanban =====
  moveTask: (taskId, column) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, column, updatedAt: Date.now() } : t)),
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, makeTask(task.agentId, task.title, task.column || "TODO")],
    })),
}));

export default useStore;
export { AGENT_STATES, KANBAN_COLUMNS };
