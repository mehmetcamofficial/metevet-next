"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { damp3 } from "maath/easing";
import { useRef } from "react";
import { WEBGL_CONFIG } from "./webgl-config";

export function ScrollCamera({ progress }: { progress: number }) {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);
  const invalidate = useThree((state) => state.invalidate);
  const lastLoggedStage = useRef(-1);

  useFrame((_, delta) => {
    const target: [number, number, number] = [
      -0.2 + progress * 0.4 + pointer.x * WEBGL_CONFIG.pointerInfluence,
      0.2 + pointer.y * 0.05,
      6.4 - progress * 0.5,
    ];
    damp3(camera.position, target, WEBGL_CONFIG.cameraDamping, delta);
    camera.lookAt(0, 0, 0);
    const stageIndex = Math.min(4, Math.floor(progress * 5));
    if (process.env.NODE_ENV === "development" && lastLoggedStage.current !== stageIndex) {
      lastLoggedStage.current = stageIndex;
      console.info("[ClinicJourney] camera position", camera.position.toArray());
    }
    if (camera.position.distanceTo({ x: target[0], y: target[1], z: target[2] } as never) > 0.005) {
      invalidate();
    }
  });

  return null;
}
