"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ClinicJourneyScene } from "./ClinicJourneyScene";
import { ContactMapScene } from "./ContactMapScene";
import { PortraitDepthScene } from "./PortraitDepthScene";
import { ScrollCamera } from "./ScrollCamera";
import { ServicesObjectScene } from "./ServicesObjectScene";
import { WEBGL_CONFIG, type WebGLQuality, type WebGLSceneKind } from "./webgl-config";

export default function SceneCanvas({
  scene,
  progress,
  quality,
  active,
}: {
  scene: WebGLSceneKind;
  progress: number;
  quality: WebGLQuality;
  active: boolean;
}) {
  const dpr = quality === "high" ? WEBGL_CONFIG.desktopDpr : WEBGL_CONFIG.mobileDpr;

  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.2, 6.4], fov: scene === "portrait" ? 35 : 40, near: 0.1, far: 100 }}
      dpr={[1, dpr]}
      frameloop={active ? "demand" : "never"}
      gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance" }}
      shadows={quality === "high"}
      className="pointer-events-none"
    >
      <Suspense fallback={null}>
        <ScrollCamera progress={progress} />
        {scene === "clinic" ? <ClinicJourneyScene quality={quality} progress={progress} /> : null}
        {scene === "portrait" ? <PortraitDepthScene /> : null}
        {scene === "services" ? <ServicesObjectScene progress={progress} /> : null}
        {scene === "contact" ? <ContactMapScene /> : null}
      </Suspense>
    </Canvas>
  );
}
