// ============================================================
// DATA STATIS 13 AGENT + KOMISARIS + CEO (Bab 4 & 10 PRD)
// Single Source of Truth — jangan edit sembarangan.
// ============================================================

export const AGENT_STATES = {
  IDLE: "IDLE",
  WALKING: "WALKING",
  WORKING: "WORKING",
  IN_MEETING: "IN_MEETING",
  WAITING_APPROVAL: "WAITING_APPROVAL",
};

// Kursi melingkar di meja bundar The War Room (zona X=-11)
export const WAR_ROOM_SEATS = [
  [-11, 0, -2.8],
  [-8.2, 0, 0],
  [-11, 0, 2.8],
  [-13.8, 0, 0],
  [-9.0, 0, -2.0],
  [-9.0, 0, 2.0],
];

// Batas pan kamera (bounding box office) & biar agent gak jalan ke luar lantai
export const OFFICE_BOUNDS = {
  minX: -16,
  maxX: 16,
  minZ: -15,
  maxZ: 15,
};

export const WAR_ROOM_CENTER = [-11, 0, 0];

// Koordinat 13 agent sesuai meja divisi di denah
export const INITIAL_AGENTS = [
  // ===== Divisi Eksekutif =====
  {
    id: "NMD-EXEC-01",
    name: "Karlitos",
    role: "Komisaris",
    division: "Eksekutif",
    homePosition: [0, 2.35, -13],
    position: [0, 2.35, -13],
    status: AGENT_STATES.IDLE,
    task: "Memantau operasional dari balkon VIP",
    requires_approval: false,
    baseColor: "#f59e0b",
    desk: [0, 0.9, -13], // koordinat depan balkon
  },
  {
    id: "NMD-EXEC-02",
    name: "Hermes",
    role: "CEO / Orkestrator",
    division: "Eksekutif",
    homePosition: [0, 0, 0],
    position: [0, 0, 0],
    status: AGENT_STATES.WORKING,
    task: "Orkestrasi kebutuhan stakeholder",
    requires_approval: false,
    baseColor: "#38bdf8",
    desk: [0, 0, 0],
  },

  // ===== Divisi Manajemen & Keuangan =====
  {
    id: "NMD-MGT-001",
    name: "Rina",
    role: "PM + BA + Helpdesk",
    division: "Manajemen & Keuangan",
    homePosition: [8.5, 0, -8],
    position: [8.5, 0, -8],
    status: AGENT_STATES.WORKING,
    task: "Mendistribusikan task ke divisi",
    requires_approval: false,
    baseColor: "#10b981",
    desk: [8.5, 0, -8],
  },
  {
    id: "NMD-MGT-002",
    name: "Brand QA",
    role: "Gatekeeper Kreatif",
    division: "Manajemen & Keuangan",
    homePosition: [11, 0, -6],
    position: [11, 0, -6],
    status: AGENT_STATES.IDLE,
    task: "Menyortir kualitas output kreatif",
    requires_approval: false,
    baseColor: "#10b981",
    desk: [11, 0, -6],
  },
  {
    id: "NMD-MGT-003",
    name: "Tania",
    role: "Finance & Admin",
    division: "Manajemen & Keuangan",
    homePosition: [13.5, 0, -8],
    position: [13.5, 0, -8],
    status: AGENT_STATES.WORKING,
    task: "Mengurus penagihan (invoice) & arus kas",
    requires_approval: false,
    baseColor: "#10b981",
    desk: [13.5, 0, -8],
  },

  // ===== Divisi Sales =====
  {
    id: "NMD-SLS-001",
    name: "Anton",
    role: "Sales",
    division: "Sales",
    homePosition: [4, 0, 12],
    position: [4, 0, 12],
    status: AGENT_STATES.IDLE,
    task: "Menunggu lead klien baru di lobi",
    requires_approval: false,
    baseColor: "#14b8a6",
    desk: [4, 0, 12],
  },

  // ===== Divisi SMM (Creative Hub) =====
  {
    id: "NMD-SMM-001",
    name: "Sofi",
    role: "Planner + SEO",
    division: "SMM (Creative Hub)",
    homePosition: [-14, 0, 8],
    position: [-14, 0, 8],
    status: AGENT_STATES.WORKING,
    task: "Meriset strategi tren kalender",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-14, 0, 8],
  },
  {
    id: "NMD-SMM-002",
    name: "Nadia",
    role: "Copywriter",
    division: "SMM (Creative Hub)",
    homePosition: [-11.5, 0, 8],
    position: [-11.5, 0, 8],
    status: AGENT_STATES.IDLE,
    task: "Menunggu brief headline & skrip",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-11.5, 0, 8],
  },
  {
    id: "NMD-SMM-003",
    name: "Davi",
    role: "Designer Motion Basic",
    division: "SMM (Creative Hub)",
    homePosition: [-9, 0, 8],
    position: [-9, 0, 8],
    status: AGENT_STATES.WORKING,
    task: "Mendesain spanduk & carousel",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-9, 0, 8],
  },
  {
    id: "NMD-SMM-004",
    name: "Mike",
    role: "Foto + Video + Motion",
    division: "SMM (Creative Hub)",
    homePosition: [-6.5, 0, 8],
    position: [-6.5, 0, 8],
    status: AGENT_STATES.WORKING,
    task: "Mengedit aset Reels dan TikTok",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-6.5, 0, 8],
  },
  {
    id: "NMD-SMM-005",
    name: "Dimas",
    role: "Community Manager",
    division: "SMM (Creative Hub)",
    homePosition: [-13, 0, 11.5],
    position: [-13, 0, 11.5],
    status: AGENT_STATES.IDLE,
    task: "Mengatur jadwal & draf balasan",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-13, 0, 11.5],
  },
  {
    id: "NMD-SMM-006",
    name: "Misel",
    role: "Ads Manager",
    division: "SMM (Creative Hub)",
    homePosition: [-10, 0, 11.5],
    position: [-10, 0, 11.5],
    status: AGENT_STATES.WORKING,
    task: "Memantau pergerakan grafik ROAS",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-10, 0, 11.5],
  },
  {
    id: "NMD-SMM-007",
    name: "Reza",
    role: "Analyst",
    division: "SMM (Creative Hub)",
    homePosition: [-7, 0, 11.5],
    position: [-7, 0, 11.5],
    status: AGENT_STATES.IDLE,
    task: "Merangkum wawasan menjadi laporan",
    requires_approval: false,
    baseColor: "#ec4899",
    desk: [-7, 0, 11.5],
  },

  // ===== Divisi Web/App (Dev Lab) =====
  {
    id: "NMD-WEB-001",
    name: "Axel",
    role: "Full Stack + Backend",
    division: "Web/App (Dev Lab)",
    homePosition: [9.5, 0, 4],
    position: [9.5, 0, 4],
    status: AGENT_STATES.WORKING,
    task: "Mengetik kode aplikasi & API",
    requires_approval: false,
    baseColor: "#3b82f6",
    desk: [9.5, 0, 4],
  },
  {
    id: "NMD-WEB-002",
    name: "Bagas",
    role: "QA Tester",
    division: "Web/App (Dev Lab)",
    homePosition: [12.5, 0, 4],
    position: [12.5, 0, 4],
    status: AGENT_STATES.IDLE,
    task: "Menguji situs web lintas peramban",
    requires_approval: false,
    baseColor: "#3b82f6",
    desk: [12.5, 0, 4],
  },
];

export const KANBAN_COLUMNS = [
  "TODO",
  "ONGOING",
  "WAITING_APPROVAL",
  "DONE",
];
