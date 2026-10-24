"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrthographicCamera,
  MapControls,
  Grid,
  Text,
  Edges,
  ContactShadows,
  Html,
  Line,
  Sphere,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import useStore from "@/store/useStore";
import ZoneBuilding from "./zones/ZoneBuilding";
import WorkflowBeam from "./effects/WorkflowBeam";
import Agent from "./agents/Agent";

// ====== PENCAHAYAAN DINAMIS ======
function DynamicLights() {
  const inMeeting = useStore((s) => s.agents.some((a) => a.status === "IN_MEETING"));
  const lights = useMemo(
    () => [
      // Spot War Room menyala saat rapat
      { pos: [-11, 5.5, 0], color: "#a78bfa", intensity: inMeeting ? 45 : 0 },
      // Lampu meja kerja pendingin di tiap divisi
      { pos: [8.5, 3, -8], color: "#10b981", intensity: 12 },
      { pos: [-9, 3, 8], color: "#ec4899", intensity: 12 },
      { pos: [9.5, 3, 4], color: "#3b82f6", intensity: 12 },
      { pos: [4, 3, 12], color: "#14b8a6", intensity: 12 },
    ],
    [inMeeting]
  );

  return lights.map((l, i) => (
    <pointLight key={i} position={l.pos} color={l.color} intensity={l.intensity} distance={14} decay={1.6} />
  ));
}

// ====== FLOOR ======
function OfficeFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[38, 36]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.26, 0]} receiveShadow>
        <boxGeometry args={[38.4, 0.5, 36.4]} />
        <meshStandardMaterial color="#1e293b" />
        <Edges color="#334155" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[38, 36]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#334155"
        fadeDistance={65}
        fadeStrength={1}
      />
    </group>
  );
}

// ====== ZONE DEFINITIONS (denah PRD Bab 3) ======
const OFFICE_ZONES = [
  {
    id: "ZONE-KOMISARIS",
    name: "Ruang Komisaris VIP\n(Karlitos - Overlook Balcony)",
    position: [0, 3.5, -13],
    size: [10, 2.5, 5],
    color: "#f59e0b",
    opacity: 0.35,
    borderColor: "#fbbf24",
    isElevated: true,
    desks: [[0, 3.3, -13]],
  },
  {
    id: "ZONE-CEO",
    name: "Ruang Kaca CEO\n(Hermes - Orkestrator)",
    position: [0, 1.5, 0],
    size: [6, 3, 6],
    color: "#38bdf8",
    opacity: 0.25,
    borderColor: "#7dd3fc",
    desks: [[0, 1.1, 0]],
  },
  {
    id: "ZONE-WAR-ROOM",
    name: "The War Room\n(Ruang Meeting Utama)",
    position: [-11, 1.25, 0],
    size: [8, 2.5, 8],
    color: "#8b5cf6",
    opacity: 0.22,
    borderColor: "#a78bfa",
    hasRoundTable: true,
    desks: [],
  },
  {
    id: "ZONE-MGT-FINANCE",
    name: "Manajemen & Finance\n(Rina, Brand QA, Tania)",
    position: [11, 1.0, -7],
    size: [9, 2, 7],
    color: "#10b981",
    opacity: 0.22,
    borderColor: "#34d399",
    desks: [
      [8.5, 0, -8],
      [11, 0, -6],
      [13.5, 0, -8],
    ],
  },
  {
    id: "ZONE-SMM",
    name: "SMM - Creative Hub\n(Sofi, Nadia, Davi, Mike, Dimas, Misel, Reza)",
    position: [-10, 1.0, 10],
    size: [12, 2, 8],
    color: "#ec4899",
    opacity: 0.22,
    borderColor: "#f472b6",
    desks: [
      [-14, 0, 8],
      [-11.5, 0, 8],
      [-9, 0, 8],
      [-6.5, 0, 8],
      [-13, 0, 11.5],
      [-10, 0, 11.5],
      [-7, 0, 11.5],
    ],
  },
  {
    id: "ZONE-DEV-LAB",
    name: "Web/App - Dev Lab\n(Axel & Bagas)",
    position: [11, 1.0, 4],
    size: [9, 2, 8],
    color: "#3b82f6",
    opacity: 0.22,
    borderColor: "#60a5fa",
    desks: [
      [9.5, 0, 4],
      [12.5, 0, 4],
    ],
  },
  {
    id: "ZONE-SALES",
    name: "Lobi Depan - Ruang Sales\n(Anton - Lead Entry)",
    position: [4, 1.0, 12],
    size: [7, 2, 5],
    color: "#14b8a6",
    opacity: 0.22,
    borderColor: "#2dd4bf",
    desks: [[4, 0, 12]],
  },
];

// ====== CONTROLLED CAMERA BOUNDS (pan terbatas ke office) ======
function BoundedCamera() {
  const cameraRef = useRef();
  const [pos, setPos] = useState([28, 28, 28]);

  useFrame(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    // Clamp posisi kamera agar tidak keluar area kantor
    const cx = THREE.MathUtils.clamp(cam.position.x, -24, 24);
    const cy = THREE.MathUtils.clamp(cam.position.y, 4, 42);
    const cz = THREE.MathUtils.clamp(cam.position.z, -24, 24);
    if (cx !== cam.position.x || cy !== cam.position.y || cz !== cam.position.z) {
      cam.position.set(cx, cy, cz);
    }
    setPos([cx, cy, cz]); // trigger re-render tipis (tidak perlu, biar MapControls aware)
  });

  return (
    <OrthographicCamera ref={cameraRef} makeDefault position={pos} zoom={22} near={-100} far={200} />
  );
}

export default function OfficeCanvas() {
  const agents = useStore((s) => s.agents);
  const beams = useStore((s) => s.beams);
  const clearSelectedAgent = useStore((s) => s.clearSelectedAgent);
  const autonomyMode = useStore((s) => s.autonomyMode);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={() => clearSelectedAgent()} camera={{ zoom: 22, position: [28, 28, 28], near: -100, far: 200 }}>
        {/* Kamera isometrik terbatas */}
        <BoundedCamera />

        {/* Kontrol: pan/zoom dibatasi dalam bounding box */}
        <MapControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          minZoom={10}
          maxZoom={60}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          target={[0, 0, 0]}
          screenSpacePanning={false}
        />

        {/* Pencahayaan */}
        <ambientLight intensity={0.75} color="#e2e8f0" />
        <directionalLight
          castShadow
          position={[20, 35, 15]}
          intensity={1.4}
          color="#ffffff"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <directionalLight position={[-20, 15, -15]} intensity={0.45} color="#38bdf8" />

        {/* Lantai & Zona */}
        <OfficeFloor />
        <group>
          {OFFICE_ZONES.map((zone) => (
            <ZoneBuilding key={zone.id} zone={zone} />
          ))}
        </group>

        {/* Agent miniatur */}
        <group>
          {agents.map((agent) => (
            <Agent key={agent.id} agent={agent} />
          ))}
        </group>

        {/* Workflow Beam */}
        <WorkflowBeam beams={beams} agents={agents} />

        {/* Lampu dinamis + bayangan lembut */}
        <DynamicLights />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.4} scale={45} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
