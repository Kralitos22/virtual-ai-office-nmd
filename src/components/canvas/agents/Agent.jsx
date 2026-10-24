"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Edges } from "@react-three/drei";
import * as THREE from "three";
import useStore, { AGENT_STATES } from "@/store/useStore";
import { OFFICE_BOUNDS, WAR_ROOM_CENTER } from "@/constants/agentsData";

// Pathfinding sederhana: interpolasi dengan waypoint koridor
// Agent bergerak menyusuri lantai (y=0), lewat titik tengah koridor agar tidak menembus dinding.
function buildPath(from, to) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  if (a.distanceTo(b) < 0.05) return [b];

  const path = [];
  // Anchor horizontal dulu (ke x target), lalu vertical di akhir — simulasikan lewat koridor
  // Titik belok di tengah: tetap di y=0 (lantai), tanpa menembus dinding zona di ketinggian.
  // Offset kecil ke y=0.05 agar tidak tenggelam.
  const mid = new THREE.Vector3(b.x, 0.05, a.z);
  if (a.distanceTo(mid) > 0.8) path.push(mid.clone());
  path.push(new THREE.Vector3(b.x, 0.05, b.z));
  return path;
}

const WALK_SPEED = 4.5;
const NOD_TIME = 0.9; // durasi anggukan saat menerima instruksi

export default function Agent({ agent }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [nodUntil, setNodUntil] = useState(0); // timestamp kapan anggukan selesai

  const selectedAgentId = useStore((s) => s.selectedAgentId);
  const selectAgent = useStore((s) => s.selectAgent);
  const agentPulse = useStore((s) => s.agentPulse?.[agent.id] || 0);

  const isSelected = selectedAgentId === agent.id;
  const isWaiting = agent.status === AGENT_STATES.WAITING_APPROVAL;
  const isInMeeting = agent.status === AGENT_STATES.IN_MEETING;
  const isWorking = agent.status === AGENT_STATES.WORKING;

  // Motion: ref berisi posisi saat ini, target, dan daftar waypoint
  const motion = useRef({
    current: new THREE.Vector3(...agent.position),
    target: new THREE.Vector3(...(agent.targetPosition || agent.homePosition)),
    waypoints: [],
    wpIndex: 0,
    wasWalking: false,
  });

  // Trigger anggukan saat inject instruction masuk
  useEffect(() => {
    if (agentPulse > 0) {
      setNodUntil(Date.now() + NOD_TIME * 1000);
    }
  }, [agentPulse]);

  // Warna badan berdasarkan State Machine
  const getBodyColor = () => {
    if (isWaiting) return "#ef4444";
    if (isSelected) return "#38bdf8";
    if (isInMeeting) return "#a855f7";
    if (isWorking) return "#10b981";
    return agent.baseColor || "#64748b";
  };

  useFrame((state, delta) => {
    const g = groupRef.current;
    const body = bodyRef.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();

    // ----- Re-target bila target berubah -----
    const desiredTarget = agent.targetPosition || agent.homePosition;
    const targetVec = new THREE.Vector3(...desiredTarget);
    if (!motion.current.target.equals(targetVec)) {
      motion.current.target.copy(targetVec);
      // set waypoints dari posisi lantai saat ini
      motion.current.waypoints = buildPath(
        [motion.current.current.x, motion.current.current.y, motion.current.current.z],
        desiredTarget
      );
      motion.current.wpIndex = 0;
    }

    // ----- Walk along waypoints -----
    const wp = motion.current.waypoints;
    const curr = motion.current.current;
    let nowWalking = false;

    if (wp.length && motion.current.wpIndex < wp.length && agent.status === AGENT_STATES.WALKING) {
      const next = wp[motion.current.wpIndex];
      const dir = new THREE.Vector3().subVectors(next, curr);
      const dist = dir.length();
      const step = WALK_SPEED * delta;
      if (dist > step) {
        curr.add(dir.normalize().multiplyScalar(step));
        nowWalking = true;
      } else {
        curr.copy(next);
        motion.current.wpIndex++;
        if (motion.current.wpIndex >= wp.length) {
          motion.current.waypoints = [];
        }
      }
    } else if (wp.length === 0 || agent.status !== AGENT_STATES.WALKING) {
      // Lerp lembut menuju target akhir (kalau bukan walking, bawa pulang)
      const home = agent.status === AGENT_STATES.WALKING
        ? curr
        : new THREE.Vector3(...(agent.targetPosition || agent.homePosition));
      const homeDist = curr.distanceTo(home);
      if (homeDist > 0.02) {
        curr.lerp(home, delta * (agent.status === AGENT_STATES.WALKING ? 5 : 4));
        // Walking true ketika bergerak dan status WALKING
        nowWalking = agent.status === AGENT_STATES.WALKING && homeDist > 0.1;
      }
    }

    g.position.copy(curr);
    // Orientasi hadap arah gerak
    if (nowWalking && motion.current.lastX !== undefined) {
      const dx = curr.x - motion.current.lastX;
      const dz = curr.z - motion.current.lastZ;
      if (Math.abs(dx) + Math.abs(dz) > 0.01) {
        const targetYaw = Math.atan2(dx, dz);
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetYaw, delta * 8);
      }
    }
    motion.current.lastX = curr.x;
    motion.current.lastZ = curr.z;
    motion.current.wasWalking = nowWalking;

    // ----- Animasi tubuh per status -----
    if (!body) return;
    const bobbing = nowWalking
      ? Math.abs(Math.sin(t * 11)) * 0.14
      : 0;
    body.position.y = 0.6 + bobbing + Math.sin(t * 2) * 0.03;

    // Anggukan saat menerima instruksi (inject)
    const nodding = Date.now() < nodUntil;
    if (nodding) {
      body.rotation.x = Math.sin((Date.now() - (nodUntil - NOD_TIME * 1000)) / (NOD_TIME * 1000) * Math.PI * 2) * 0.25;
    } else {
      body.rotation.x = isWorking ? Math.sin(t * 12) * 0.06 : 0;
    }

    // Ayunan tangan saat walking / bekerja
    if (leftArmRef.current && rightArmRef.current) {
      const swingAmp = nowWalking ? 0.55 : isWorking ? 0.15 : 0;
      leftArmRef.current.rotation.x = Math.sin(t * 11) * swingAmp;
      rightArmRef.current.rotation.x = Math.sin(t * 11 + Math.PI) * swingAmp;
    }

    g.rotation.z = nowWalking ? Math.sin(t * 11) * 0.04 : 0;
    // slight lean saat bekerja
    if (isWorking) g.rotation.z += Math.sin(t * 8) * 0.02;
    g.rotation.z = THREE.MathUtils.clamp(g.rotation.z, -0.1, 0.1);
  });

  // Guard: jika status bukan walking, pastikan agent perlahan pulang/ke target setiap frame
  // (sudah ditangani lerp di atas)

  return (
    <group
      ref={groupRef}
      position={agent.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectAgent(agent.id);
      }}
    >
      {/* Ring di lantai saat dipilih / hover / waiting */}
      {(isSelected || hovered || isWaiting) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color={isWaiting ? "#f59e0b" : "#38bdf8"} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Badan + Kepala + Tangan */}
      <group ref={bodyRef} position={[0, 0.6, 0]}>
        {/* Badan */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.9, 16]} />
          <meshStandardMaterial
            color={getBodyColor()}
            roughness={0.3}
            metalness={0.2}
            emissive={isWaiting ? "#ef4444" : "#000000"}
            emissiveIntensity={isWaiting ? 0.45 : 0}
          />
          <Edges color={isSelected ? "#ffffff" : "#1e293b"} />
        </mesh>
        {/* Kepala */}
        <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Tangan kiri */}
        <mesh ref={leftArmRef} castShadow position={[-0.38, 0.1, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
          <meshStandardMaterial color={getBodyColor()} roughness={0.4} />
        </mesh>
        {/* Tangan kanan */}
        <mesh ref={rightArmRef} castShadow position={[0.38, 0.1, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
          <meshStandardMaterial color={getBodyColor()} roughness={0.4} />
        </mesh>
      </group>

      {/* Ikon Pending saat WAITING_APPROVAL */}
      {isWaiting && (
        <Html position={[0, 2.4, 0]} center distanceFactor={28} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/50 animate-bounce whitespace-nowrap border-2 border-white">
            <span>⚠️ PENDING APPROVAL</span>
          </div>
        </Html>
      )}

      {/* Chat bubble saat IN_MEETING */}
      {isInMeeting && !isWaiting && (
        <Html position={[0, 2.2, 0]} center distanceFactor={28} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="px-2.5 py-1 rounded-2xl bg-violet-600/90 text-white font-semibold text-xs shadow-md border border-violet-300/40 animate-pulse whitespace-nowrap">
            💬 Diskusi Proyek...
          </div>
        </Html>
      )}

      {/* Ikon menerima instruksi (brief flash) */}
      {Date.now() < nodUntil && !isWaiting && (
        <Html position={[0, 2.6, 0]} center distanceFactor={28} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow">
            📥 Menerima Instruksi
          </div>
        </Html>
      )}

      {/* Floating ID Card */}
      {hovered && (
        <Html position={[0, 2.6, 0]} center zIndexRange={[100, 0]}>
          <div className="pointer-events-none w-56 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-600/80 p-3 text-left shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {agent.id}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">{agent.division}</span>
            </div>
            <p className="text-sm font-bold text-white leading-tight">{agent.name}</p>
            <p className="text-xs text-sky-400 font-medium mt-0.5">{agent.role}</p>
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex flex-col gap-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono font-semibold text-emerald-400">{agent.status}</span>
              </div>
              <div className="text-slate-300 truncate">
                <span className="text-slate-400">Task: </span>
                {agent.task}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
