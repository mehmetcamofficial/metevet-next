"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, SRGBColorSpace, TextureLoader } from "three";
import { WEBGL_CONFIG, type WebGLQuality } from "./webgl-config";

export const JOURNEY_STAGES = [
  { id: "welcome", image: "/images/clinic/clinic-reception.png" },
  { id: "examination", image: "/images/clinic/clinic-exam-room.png" },
  { id: "diagnosis", image: "/images/clinic/clinic-treatment-room.png" },
  { id: "recovery", image: "/images/clinic/clinic-waiting.png" },
  { id: "location", image: "/images/clinic/clinic-exterior.png" },
] as const;

export function getJourneyBlend(progress: number) {
  const normalized = MathUtils.clamp(progress, 0, 1);
  let currentIndex = WEBGL_CONFIG.journeyStageStarts.findLastIndex((start) => normalized >= start);
  currentIndex = MathUtils.clamp(currentIndex, 0, JOURNEY_STAGES.length - 1);
  const nextIndex = Math.min(JOURNEY_STAGES.length - 1, currentIndex + 1);
  const start = WEBGL_CONFIG.journeyStageStarts[currentIndex];
  const end = WEBGL_CONFIG.journeyStageStarts[currentIndex + 1] ?? 1;
  const localProgress = (normalized - start) / Math.max(0.001, end - start);
  const blend =
    currentIndex === JOURNEY_STAGES.length - 1
      ? 0
      : MathUtils.smoothstep(localProgress, 0.68, 0.95);
  return { currentIndex, nextIndex, localProgress, blend };
}

export function ClinicJourneyScene({
  quality,
  progress,
}: {
  quality: WebGLQuality;
  progress: number;
}) {
  const loadedTextures = useLoader(
    TextureLoader,
    JOURNEY_STAGES.map((stage) => stage.image),
  );
  const lastLoggedStage = useRef<string | null>(null);
  const textures = useMemo(
    () =>
      loadedTextures.map((loadedTexture) => {
        const texture = loadedTexture.clone();
        texture.colorSpace = SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
      }),
    [loadedTextures],
  );
  const blendState = getJourneyBlend(progress);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const ids = JOURNEY_STAGES.map((stage) => stage.id);
    console.info("[ClinicJourney] duplicate stage-id validation", {
      valid: new Set(ids).size === ids.length,
      ids,
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const activeStage = JOURNEY_STAGES[blendState.currentIndex];
    if (lastLoggedStage.current === activeStage.id) return;
    lastLoggedStage.current = activeStage.id;
    console.info("[ClinicJourney] active stage", {
      id: activeStage.id,
      localProgress: blendState.localProgress,
      activePlaneOpacity: 1 - blendState.blend,
    });
  }, [blendState]);

  useEffect(() => {
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures]);

  return (
    <>
      <hemisphereLight args={["#f7e7c7", "#557266", quality === "high" ? 1.35 : 1]} />
      <pointLight position={[2.8, 2.5, 2]} intensity={quality === "high" ? 4 : 2.5} distance={7} color="#f1d19a" />

      {JOURNEY_STAGES.map((stage, index) => {
        const isCurrent = index === blendState.currentIndex;
        const isNext = index === blendState.nextIndex && index !== blendState.currentIndex;
        const opacity = isCurrent ? 1 - blendState.blend : isNext ? blendState.blend : 0;
        const scale = isCurrent
          ? 1.02 + blendState.blend * 0.025
          : isNext
            ? 1 + blendState.blend * 0.02
            : 1;
        const z = isCurrent ? 0.02 : isNext ? -0.28 : -0.4;

        return (
          <group key={stage.id} position={[0, 0, z]} scale={scale} visible={opacity > 0.001}>
            <mesh>
              <planeGeometry args={[10.8, 6.1]} />
              <meshBasicMaterial
                map={textures[index]}
                toneMapped={false}
                transparent
                opacity={opacity}
                depthWrite={opacity > 0.98}
              />
            </mesh>
            {(stage.id === "examination" || stage.id === "diagnosis") && opacity > 0 ? (
              <group position={[2.7, 1.15, 0.06]}>
                <mesh>
                  <ringGeometry args={[0.3, 0.34, 48]} />
                  <meshBasicMaterial color="#cda85f" transparent opacity={opacity * 0.58} />
                </mesh>
              </group>
            ) : null}
          </group>
        );
      })}

    </>
  );
}
