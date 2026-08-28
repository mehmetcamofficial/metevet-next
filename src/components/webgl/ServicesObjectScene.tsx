"use client";

import { Float, RoundedBox } from "@react-three/drei";

export function ServicesObjectScene({ progress }: { progress: number }) {
  const rotation = progress * Math.PI * 0.7;
  return (
    <>
      <ambientLight intensity={0.8} />
      <spotLight position={[4, 6, 4]} intensity={32} angle={0.5} color="#f1d9a8" />
      <group rotation={[0.15, rotation, 0]}>
        <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.18}>
          <mesh position={[-1.6, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.5, 1.8, 24]} />
            <meshPhysicalMaterial color="#dcece6" transmission={0.45} transparent opacity={0.82} roughness={0.25} />
          </mesh>
          <mesh position={[-1.6, 1.45, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 24]} />
            <meshStandardMaterial color="#b8a37b" metalness={0.7} roughness={0.3} />
          </mesh>
        </Float>
        <mesh position={[0.1, 0.2, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.12, 16, 48]} />
          <meshStandardMaterial color="#cda85f" metalness={0.55} roughness={0.32} />
        </mesh>
        <RoundedBox args={[1.4, 1.1, 0.65]} radius={0.25} position={[1.7, -0.25, 0.2]}>
          <meshStandardMaterial color="#123a30" roughness={0.78} />
        </RoundedBox>
      </group>
    </>
  );
}

