"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { damp3 } from "maath/easing";
import { useRef } from "react";
import type { Group } from "three";
import { WEBGL_CONFIG } from "./webgl-config";

export function CameraRig({ progress = 0 }: { progress?: number }) {
  const rig = useRef<Group>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    if (!rig.current) return;
    damp3(
      rig.current.position,
      [
        (progress - 0.5) * 1.35 + pointer.x * WEBGL_CONFIG.pointerInfluence,
        pointer.y * WEBGL_CONFIG.pointerInfluence * 0.5,
        progress * 8,
      ],
      WEBGL_CONFIG.cameraDamping,
      delta,
    );
  });

  return <group ref={rig} />;
}

