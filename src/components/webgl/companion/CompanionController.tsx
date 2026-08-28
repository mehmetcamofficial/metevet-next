"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Group,
  MathUtils,
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import {
  CompanionAnimationMachine,
  type CompanionState,
} from "./CompanionAnimationMachine";
import { CompanionCat } from "./CompanionCat";
import { CompanionGround } from "./CompanionGround";
import {
  COMPANION_CONFIG,
  COMPANION_EXCLUSION_ZONES,
  COMPANION_MODEL_PATH,
  COMPANION_SCREEN_ANCHORS,
} from "./companion-config";

type ViewportExclusion = {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

function safeViewportPoint(
  clientX: number,
  clientY: number,
  dynamicZones: readonly ViewportExclusion[],
) {
  let x = MathUtils.clamp(clientX / window.innerWidth, 0, 1);
  let y = MathUtils.clamp(clientY / window.innerHeight, 0, 1);
  let clamped = false;

  for (const zone of [...COMPANION_EXCLUSION_ZONES, ...dynamicZones]) {
    if (x < zone.left || x > zone.right || y < zone.top || y > zone.bottom) continue;
    const edges = [
      { distance: x - zone.left, axis: "x", value: Math.max(0, zone.left - 0.015) },
      { distance: zone.right - x, axis: "x", value: Math.min(1, zone.right + 0.015) },
      { distance: y - zone.top, axis: "y", value: Math.max(0, zone.top - 0.015) },
      { distance: zone.bottom - y, axis: "y", value: Math.min(1, zone.bottom + 0.015) },
    ] as const;
    const edge = edges.reduce((nearest, candidate) =>
      candidate.distance < nearest.distance ? candidate : nearest,
    );
    if (edge.axis === "x") x = edge.value;
    else y = edge.value;
    clamped = true;
  }
  return { x, y, clamped };
}

export function CompanionController({
  activeSectionId,
  enabled,
  debugMode,
  onModelVisibleReady,
}: {
  activeSectionId: string;
  enabled: boolean;
  debugMode: boolean;
  onModelVisibleReady: (ready: boolean) => void;
}) {
  const { camera, invalidate } = useThree();
  const root = useRef<Group>(null);
  const ground = useRef<Mesh>(null);
  const machine = useRef(new CompanionAnimationMachine());
  const stateRef = useRef<CompanionState>("IDLE");
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const greetUntilRef = useRef(0);
  const targetRef = useRef(new Vector3());
  const homeRef = useRef(new Vector3());
  const initialized = useRef(false);
  const velocity = useRef(0);
  const movementPending = useRef(false);
  const lastInteraction = useRef(0);
  const pendingPointer = useRef<{ x: number; y: number } | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const intersection = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const lastDiagnostic = useRef("");
  const dynamicExclusions = useRef<ViewportExclusion[]>([]);

  useEffect(() => {
    useGLTF.preload(COMPANION_MODEL_PATH);
  }, []);

  useEffect(() => {
    const screenAnchor = debugMode
      ? ([0, -0.55, 0] as const)
      :
      COMPANION_SCREEN_ANCHORS[
        activeSectionId as keyof typeof COMPANION_SCREEN_ANCHORS
      ] ?? COMPANION_SCREEN_ANCHORS.welcome;
    const clampedAnchor = [
      MathUtils.clamp(
        screenAnchor[0],
        COMPANION_CONFIG.navigationNdc.minX,
        COMPANION_CONFIG.navigationNdc.maxX,
      ),
      MathUtils.clamp(
        screenAnchor[1],
        COMPANION_CONFIG.navigationNdc.minY,
        COMPANION_CONFIG.navigationNdc.maxY,
      ),
      0,
    ] as const;
    homeRef.current.set(...clampedAnchor).unproject(camera);
    homeRef.current.z = 0;
    targetRef.current.copy(homeRef.current);
    if (!initialized.current && root.current) {
      root.current.position.copy(homeRef.current);
      initialized.current = true;
    }
    movementPending.current = true;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    machine.current.requestMovement(performance.now() / 1000);
    if (machine.current.state === "MOVING") movementPending.current = false;
    stateRef.current = machine.current.state;
    if (process.env.NODE_ENV === "development") {
      console.info("[CompanionCat] active stage", {
        section: activeSectionId,
        screenAnchor,
        clampedAnchor,
        worldAnchor: homeRef.current.toArray(),
      });
    }
    window.dispatchEvent(new Event("metevet-companion-revalidate"));
  }, [activeSectionId, camera, debugMode]);

  useEffect(() => {
    const measureExclusions = () => {
      const selectors = [
        "header",
        "[role='dialog']",
        "details[open]",
        "[data-companion-exclusion]",
        "a:focus-visible",
        "button:focus-visible",
      ].join(",");
      dynamicExclusions.current = Array.from(
        document.querySelectorAll<HTMLElement>(selectors),
      )
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            id: element.getAttribute("data-companion-exclusion") ?? `dom-${index}`,
            left: MathUtils.clamp((rect.left - 12) / window.innerWidth, 0, 1),
            top: MathUtils.clamp((rect.top - 12) / window.innerHeight, 0, 1),
            right: MathUtils.clamp((rect.right + 12) / window.innerWidth, 0, 1),
            bottom: MathUtils.clamp((rect.bottom + 12) / window.innerHeight, 0, 1),
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.top < window.innerHeight,
          };
        })
        .filter(({ visible }) => visible)
        .map(({ id, left, top, right, bottom }) => ({
          id,
          left,
          top,
          right,
          bottom,
        }));
    };
    const mutationObserver = new MutationObserver(measureExclusions);
    measureExclusions();
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", measureExclusions);
    window.addEventListener("focusin", measureExclusions);
    return () => {
      mutationObserver.disconnect();
      window.removeEventListener("resize", measureExclusions);
      window.removeEventListener("focusin", measureExclusions);
    };
  }, [activeSectionId]);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const onPointerMove = (event: PointerEvent) => {
      if (
        debugMode ||
        !enabled ||
        !finePointer.matches ||
        event.pointerType !== "mouse"
      ) return;
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      pointerRef.current.active = true;
      pendingPointer.current = { x: event.clientX, y: event.clientY };
      lastInteraction.current = performance.now() / 1000;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        const pending = pendingPointer.current;
        const navigationGround = ground.current;
        const cat = root.current;
        if (!pending || !navigationGround || !cat) return;
        const safe = safeViewportPoint(
          pending.x,
          pending.y,
          dynamicExclusions.current,
        );
        safe.x = MathUtils.clamp(safe.x, 0.09, 0.91);
        safe.y = MathUtils.clamp(safe.y, 0.66, 0.89);
        ndc.set(safe.x * 2 - 1, -(safe.y * 2 - 1));
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(navigationGround, false)[0];
        if (!hit) return;
        intersection.copy(hit.point);
        const side = pointerRef.current.x >= 0 ? -1 : 1;
        intersection.x += side * COMPANION_CONFIG.pointerOffset;
        const minimum = new Vector3(
          COMPANION_CONFIG.navigationNdc.minX,
          COMPANION_CONFIG.navigationNdc.minY,
          0,
        ).unproject(camera);
        const maximum = new Vector3(
          COMPANION_CONFIG.navigationNdc.maxX,
          COMPANION_CONFIG.navigationNdc.maxY,
          0,
        ).unproject(camera);
        intersection.set(
          MathUtils.clamp(intersection.x, minimum.x, maximum.x),
          MathUtils.clamp(intersection.y, minimum.y, maximum.y),
          0,
        );
        if (
          intersection.distanceTo(targetRef.current) <
          COMPANION_CONFIG.destinationDeadZone
        ) return;
        targetRef.current.copy(intersection);
        movementPending.current = true;
        machine.current.requestMovement(performance.now() / 1000);
        if (machine.current.state === "MOVING") movementPending.current = false;
        stateRef.current = machine.current.state;
        if (process.env.NODE_ENV === "development") {
          console.info("[CompanionCat] destination", {
            target: targetRef.current.toArray(),
            clamped: safe.clamped,
            exclusionZoneRejection: safe.clamped,
          });
        }
      }, COMPANION_CONFIG.pointerSettleMs);
    };
    const resetGaze = () => {
      pointerRef.current.active = false;
      pendingPointer.current = null;
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    const greet = () => {
      greetUntilRef.current =
        performance.now() / 1000 + COMPANION_CONFIG.greetSeconds;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetGaze);
    document.documentElement.addEventListener("mouseleave", resetGaze);
    window.addEventListener("metevet-cat-greet", greet);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetGaze);
      document.documentElement.removeEventListener("mouseleave", resetGaze);
      window.removeEventListener("metevet-cat-greet", greet);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [camera, debugMode, enabled, intersection, ndc, raycaster]);

  useFrame((_, frameDelta) => {
    const cat = root.current;
    if (!cat || !enabled) return;
    if (debugMode) {
      cat.visible = true;
      velocity.current = 0;
      invalidate();
      return;
    }
    const now = performance.now() / 1000;
    const delta = Math.min(frameDelta, COMPANION_CONFIG.maximumDelta);
    const state = machine.current.state;

    if (
      now - lastInteraction.current > COMPANION_CONFIG.idleReturnSeconds &&
      targetRef.current.distanceTo(homeRef.current) >=
        COMPANION_CONFIG.destinationDeadZone
    ) {
      targetRef.current.copy(homeRef.current);
      movementPending.current = true;
      machine.current.requestMovement(now);
      if (machine.current.state === "MOVING") movementPending.current = false;
    }

    if (state === "STANDING" && now - machine.current.enteredAt >= 1.5) {
      machine.current.transition("MOVING", now);
      movementPending.current = false;
    } else if (state === "MOVING") {
      direction.subVectors(targetRef.current, cat.position);
      const distance = direction.length();
      if (distance <= COMPANION_CONFIG.arrivalRadius) {
        velocity.current = 0;
        machine.current.transition("ARRIVING", now);
      } else {
        direction.normalize();
        velocity.current = MathUtils.damp(
          velocity.current,
          COMPANION_CONFIG.walkSpeed,
          COMPANION_CONFIG.accelerationDamping,
          delta,
        );
        cat.position.addScaledVector(
          direction,
          Math.min(distance, velocity.current * delta),
        );
        const facing = Math.atan2(direction.x, direction.z);
        cat.rotation.y = MathUtils.damp(
          cat.rotation.y,
          facing,
          COMPANION_CONFIG.rotationDamping,
          delta,
        );
      }
    } else if (state === "ARRIVING") {
      machine.current.transition("SITTING", now);
    } else if (state === "SITTING" && now - machine.current.enteredAt >= 1.5) {
      machine.current.transition("SEATED_IDLE", now);
    } else if (
      state === "SEATED_IDLE" &&
      movementPending.current &&
      targetRef.current.distanceTo(cat.position) >
        COMPANION_CONFIG.arrivalRadius
    ) {
      machine.current.requestMovement(now);
    }

    stateRef.current = machine.current.state;
    if (process.env.NODE_ENV === "development") {
      const diagnostic = `${activeSectionId}:${machine.current.state}`;
      if (lastDiagnostic.current !== diagnostic) {
        lastDiagnostic.current = diagnostic;
        console.info("[CompanionCat] status", {
          state: machine.current.state,
          position: cat.position.toArray(),
          section: activeSectionId,
        });
      }
    }
    invalidate();
  });

  return (
    <>
      <CompanionGround ref={ground} />
      <group
        ref={root}
        visible={enabled}
      >
        <CompanionCat
          stateRef={stateRef}
          pointerRef={pointerRef}
          greetUntilRef={greetUntilRef}
          debugMode={debugMode}
          onModelVisibleReady={onModelVisibleReady}
        />
        {process.env.NODE_ENV === "development" && debugMode ? (
          <>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#ff2525" depthTest={false} />
            </mesh>
            <axesHelper args={[0.55]} />
          </>
        ) : null}
      </group>
    </>
  );
}
