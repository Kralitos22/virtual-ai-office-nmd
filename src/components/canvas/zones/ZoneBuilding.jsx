"use client";

import React from "react";
import { Text, Edges } from "@react-three/drei";
import * as THREE from "three";

// Meja kerja sederhana utk tiap agent: permukaan meja + monitor kecil + kursi
function Desk({ atY = 0 }) {
  return (
    <group position={[0, atY, 0]}>
      {/* Kaki meja */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.16, 0.5, 0.16]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>
      {/* Permukaan meja */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Monitor kecil menyala */}
      <mesh castShadow position={[0.1, 0.68, -0.22]}>
        <boxGeometry args={[0.55, 0.38, 0.06]} />
        <meshStandardMaterial color="#111827" emissive="#7dd3fc" emissiveIntensity={0.7} />
      </mesh>
      {/* Kursi di belakang meja */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0.55]}>
        <boxGeometry args={[0.6, 0.6, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0.56]}>
        <boxGeometry args={[0.62, 0.06, 0.2]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>
    </group>
  );
}

// Sekat / partisi antar ruangan — frame transparan (kaca) tipis
function Partitions({ color, borderColor, w, h, d }) {
  const walls = [
    { pos: [0, 0, d / 2], s: [w, h, 0.06] },
    { pos: [0, 0, -d / 2], s: [w, h, 0.06] },
    { pos: [w / 2, 0, 0], s: [0.06, h, d] },
    { pos: [-w / 2, 0, 0], s: [0.06, h, d] },
  ];
  return walls.map((wall, idx) => (
    <mesh key={idx} position={wall.pos} receiveShadow castShadow>
      <boxGeometry args={wall.s} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.12}
        metalness={0.4}
        roughness={0.2}
        side={THREE.DoubleSide}
      />
      <Edges scale={1} threshold={15} color={borderColor || "#ffffff"} />
    </mesh>
  ));
}

// Meja bundar digital The War Room
function WarRoomTable() {
  const seats = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    seats.push([Math.cos(ang) * 2.6, 0.25, Math.sin(ang) * 2.6]);
  }
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.12, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#8b5cf6"
          emissiveIntensity={0.55}
          roughness={0.2}
          metalness={0.8}
        />
        <Edges color="#a78bfa" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.6, 1.0, 0.5, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {seats.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
    </group>
  );
}

// Komponen zona ruangan: lantai + sekat/partisi + meja kerja tiap agent + War Room table
export default function ZoneBuilding({ zone }) {
  const [w, h, d] = zone.size;
  const [zx, , zz] = zone.position;
  const isElevated = zone.isElevated;
  const tableY = isElevated ? 2.6 : 0;

  return (
    <group position={[zx, 0, zz]}>
      {/* Lantai zona (karpet penanda) */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial color={zone.color} transparent opacity={0.35} roughness={0.8} />
      </mesh>

      {/* Meja kerja utk setiap agent di zona ini */}
      {zone.desks?.map((dp, i) => (
        <group key={i} position={[dp[0] - zx, 0, dp[2] - zz]}>
          <Desk atY={tableY} />
        </group>
      ))}

      {/* Sekat / partisi — khusus non-elevated */}
      {!isElevated && (
        <group position={[0, h / 2, 0]}>
          <Partitions color={zone.color} borderColor={zone.borderColor} w={w} h={h} d={d} />
        </group>
      )}

      {/* War Room table */}
      {zone.hasRoundTable && (
        <group position={[0, -h / 2 + 0.4, 0]}>
          <WarRoomTable />
        </group>
      )}

      {/* Label nama zona */}
      <Text
        position={[0, h + 0.2, 0]}
        fontSize={0.42}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        outlineWidth={0.04}
        outlineColor="#0f172a"
      >
        {zone.name}
      </Text>
    </group>
  );
}
