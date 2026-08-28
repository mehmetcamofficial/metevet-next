"use client";

import { Line } from "@react-three/drei";

export function ContactMapScene() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#f3d49a" />
      <group rotation={[-0.08, 0, -0.04]}>
        <Line points={[[-2.2, -1.1, 0.14], [-0.8, -0.2, 0.14], [0.4, -0.5, 0.14], [1.5, 0.7, 0.14]]} color="#cda85f" lineWidth={3} />
        <mesh position={[1.5, 0.7, 0.35]}>
          <sphereGeometry args={[0.22, 24, 16]} />
          <meshStandardMaterial color="#123a30" emissive="#cda85f" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </>
  );
}
