"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useRef } from "react";
import { OrthographicCamera } from "three";
import { COMPANION_CONFIG, COMPANION_SCREEN_ANCHORS } from "./companion-config";

export function CompanionCamera() {
  const { camera, size, invalidate } = useThree();
  const cameraRef = useRef(camera);

  useEffect(() => {
    cameraRef.current = camera;
    const companionCamera = cameraRef.current;
    if (!(companionCamera instanceof OrthographicCamera)) return;
    const halfHeight = COMPANION_CONFIG.orthographicHalfHeight;
    const halfWidth = halfHeight * (size.width / Math.max(1, size.height));
    companionCamera.left = -halfWidth;
    companionCamera.right = halfWidth;
    companionCamera.top = halfHeight;
    companionCamera.bottom = -halfHeight;
    companionCamera.near = 0.1;
    companionCamera.far = 50;
    companionCamera.position.set(0, 0, 10);
    companionCamera.lookAt(0, 0, 0);
    companionCamera.updateProjectionMatrix();
    invalidate();

    if (process.env.NODE_ENV === "development") {
      const validation = Object.entries(COMPANION_SCREEN_ANCHORS).map(
        ([id, anchor]) => ({
          id,
          anchor,
          insideNdc:
            Math.abs(anchor[0]) < 1 &&
            Math.abs(anchor[1]) < 1 &&
            Math.abs(anchor[2]) < 1,
        }),
      );
      console.info("[CompanionCamera] configured", {
        type: companionCamera.type,
        position: companionCamera.position.toArray(),
        zoom: companionCamera.zoom,
        near: companionCamera.near,
        far: companionCamera.far,
        bounds: {
          left: companionCamera.left,
          right: companionCamera.right,
          top: companionCamera.top,
          bottom: companionCamera.bottom,
        },
        anchors: validation,
      });
    }
  }, [camera, invalidate, size.height, size.width]);

  return null;
}
