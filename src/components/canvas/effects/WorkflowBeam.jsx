"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";

// Workflow Beam: visualisasi perpindahan tugas antar agent.
// Setiap beam punya from/to (agentId) + born (timestamp) + ttl.
// Garis cahaya & partikel terbang dari meja pengirim ke meja penerima, lalu hilang.

function Beam({ beam, fromPos, toPos, now }) {
  const progress = Math.min(1, (now - beam.born) / 700); // 0.7s mengembang
  const done = now - beam.born > beam.ttl;
  const lineRef = useRef();

  const alpha = done ? 0 : 1 - Math.max(0, (now - beam.born - 2000) / 600); // fade-out jelang akhir
  const mid = useMemo(() => {
    const m = new THREE.Vector3().lerpVectors(fromPos, toPos, 0.5);
    m.y += 2.2; // arched di atas meja
    return m;
  }, [fromPos, toPos]);

  // Kurva bezier
  const points = useMemo(() => {
    return [fromPos.clone(), mid, toPos.clone()];
  }, [fromPos, toPos]);

  useFrame(() => {
    if (lineRef.current) {
      const mat = lineRef.current.material;
      if (mat) mat.opacity = Math.max(0, alpha);
    }
  });

  if (done) return null;
  if (progress <= 0.02) return null; // belum mulai

  return (
    <group>
      {/* Garis cahaya utama */}
      <Line
        points={points}
        color={beam.color || "#38bdf8"}
        lineWidth={2}
        transparent
        opacity={alpha}
      />
      {/* Partikel terbang (bola kecil) */}
      <group position={fromPos}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={alpha} />
        </mesh>
      </group>
    </group>
  );
}

export default function WorkflowBeam({ beams, agents }) {
  const clock = useRef(performance.now());

  useFrame(() => {
    clock.current = performance.now();
  });

  if (!beams || !beams.length) return null;
  const now = clock.current;

  return (
    <group>
      {beams.map((beam) => {
        const fromAgent = agents.find((a) => a.id === beam.from);
        const toAgent = agents.find((a) => a.id === beam.to);
        if (!fromAgent || !toAgent) return null;
        const fromPos = new THREE.Vector3(...(fromAgent.desks?.[0] || fromAgent.homePosition || fromAgent.position));
        const toPos = new THREE.Vector3(...(toAgent.desks?.[0] || toAgent.homePosition || toAgent.position));
        return <Beam key={beam.id} beam={beam} fromPos={fromPos} toPos={toPos} now={now} />;
      })}
    </group>
  );
}
