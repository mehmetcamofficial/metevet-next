"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect } from "react";
import { TextureLoader } from "three";

export function PortraitDepthScene() {
  const texture = useLoader(TextureLoader, "/images/onur-metehan-cakir.jpg");
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 4, 4]} intensity={2.2} color="#f3d49a" />
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4, 5]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0.9, -0.2, 0.35]}>
        <ringGeometry args={[1.35, 1.7, 48]} />
        <meshStandardMaterial color="#cda85f" transparent opacity={0.13} />
      </mesh>
    </>
  );
}
