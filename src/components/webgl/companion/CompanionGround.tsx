"use client";

import { forwardRef } from "react";
import type { Mesh } from "three";
export const CompanionGround = forwardRef<Mesh>(function CompanionGround(_, ref) {
  return (
    <mesh ref={ref} position={[0, 0, 0]} visible={false}>
      <planeGeometry args={[30, 8]} />
      <meshBasicMaterial depthWrite={false} transparent opacity={0} />
    </mesh>
  );
});
