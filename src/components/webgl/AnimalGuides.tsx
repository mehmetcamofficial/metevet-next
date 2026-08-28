"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, Vector2, Vector3 } from "three";

const MAX_HEAD_ROTATION = MathUtils.degToRad(10);
const MAX_BODY_ROTATION = MathUtils.degToRad(3);
const DOG_SCALE = 0.3;
const CAT_SCALE = 0.26;
const ANIMAL_Z_MIN = 0.48;
const ANIMAL_Z_MAX = 0.78;

const DOG_WAYPOINTS = [
  [-2.8, -2, 0.7],
  [-2.9, -2.05, 0.58],
  [-3.2, -2.05, 0.7],
  [-2.85, -2.05, 0.64],
  [-3.05, -2.05, 0.6],
] as const;

const CAT_WAYPOINTS = [
  [2.6, -2.05, 0.72],
  [2.85, -2.1, 0.72],
  [3.2, -2.1, 0.58],
  [2.9, -2.1, 0.68],
  [3.1, -2.1, 0.62],
] as const;

const _wpA = new Vector3();
const _wpB = new Vector3();
const _wpResult = new Vector3();

function waypointPosition(points: readonly (readonly [number, number, number])[], progress: number) {
  const scaled = MathUtils.clamp(progress, 0, 1) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const alpha = scaled - index;
  _wpA.set(...points[index]);
  _wpB.set(...points[index + 1]);
  _wpResult.copy(_wpA).lerp(_wpB, alpha);
  _wpResult.x = MathUtils.clamp(_wpResult.x, -3.4, 3.4);
  _wpResult.y = MathUtils.clamp(_wpResult.y, -2.2, -1.9);
  _wpResult.z = MathUtils.clamp(_wpResult.z, ANIMAL_Z_MIN, ANIMAL_Z_MAX);
  return _wpResult;
}

function ContactShadow() {
  return (
    <mesh position={[0, -0.15, -0.08]} scale={[1.45, 0.34, 1]}>
      <circleGeometry args={[0.72, 24]} />
      <meshBasicMaterial color="#18352d" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

function DogGuide({ groupRef, headRef }: { groupRef: React.RefObject<Group | null>; headRef: React.RefObject<Group | null> }) {
  return (
    <group ref={groupRef} scale={DOG_SCALE} position={[...DOG_WAYPOINTS[0]]}>
      <ContactShadow />
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.48, 1.05, 8, 16]} />
        <meshStandardMaterial color="#a77d58" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.62, 0.42]} scale={[0.55, 0.82, 0.18]}>
        <sphereGeometry args={[0.45, 14, 10]} />
        <meshStandardMaterial color="#efe2ca" roughness={0.88} />
      </mesh>
      <mesh position={[0.52, 0.65, -0.18]} rotation={[0, 0, -0.75]}>
        <capsuleGeometry args={[0.1, 0.72, 6, 10]} />
        <meshStandardMaterial color="#b88b62" roughness={0.86} />
      </mesh>
      <group ref={headRef} position={[0, 1.45, 0.08]}>
        <mesh>
          <sphereGeometry args={[0.52, 18, 14]} />
          <meshStandardMaterial color="#b88b62" roughness={0.82} />
        </mesh>
        <mesh position={[-0.42, 0.2, -0.02]} rotation={[0, 0, 0.35]}>
          <coneGeometry args={[0.22, 0.55, 10]} />
          <meshStandardMaterial color="#896344" roughness={0.88} />
        </mesh>
        <mesh position={[0.42, 0.2, -0.02]} rotation={[0, 0, -0.35]}>
          <coneGeometry args={[0.22, 0.55, 10]} />
          <meshStandardMaterial color="#896344" roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

function CatGuide({ groupRef, headRef }: { groupRef: React.RefObject<Group | null>; headRef: React.RefObject<Group | null> }) {
  return (
    <group ref={groupRef} scale={CAT_SCALE} position={[...CAT_WAYPOINTS[0]]}>
      <ContactShadow />
      <mesh position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.42, 1.15, 8, 16]} />
        <meshStandardMaterial color="#789584" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.68, 0.38]} scale={[0.5, 0.78, 0.16]}>
        <sphereGeometry args={[0.4, 14, 10]} />
        <meshStandardMaterial color="#e9dfc9" roughness={0.9} />
      </mesh>
      <mesh position={[0.46, 0.55, -0.15]} rotation={[0, 0, -0.82]}>
        <capsuleGeometry args={[0.08, 0.8, 6, 10]} />
        <meshStandardMaterial color="#698777" roughness={0.88} />
      </mesh>
      <group ref={headRef} position={[0, 1.48, 0.05]}>
        <mesh>
          <sphereGeometry args={[0.48, 18, 14]} />
          <meshStandardMaterial color="#86a392" roughness={0.84} />
        </mesh>
        <mesh position={[-0.3, 0.38, 0]} rotation={[0, 0, -0.08]}>
          <coneGeometry args={[0.2, 0.48, 10]} />
          <meshStandardMaterial color="#698777" roughness={0.88} />
        </mesh>
        <mesh position={[0.3, 0.38, 0]} rotation={[0, 0, 0.08]}>
          <coneGeometry args={[0.2, 0.48, 10]} />
          <meshStandardMaterial color="#698777" roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

export function AnimalGuides({ progress, activeStageId }: { progress: number; activeStageId: string }) {
  const dog = useRef<Group>(null);
  const dogHead = useRef<Group>(null);
  const cat = useRef<Group>(null);
  const catHead = useRef<Group>(null);
  const finePointer = useRef(false);
  const selectedGuide = useRef<"cat" | "dog">("dog");
  const lastLoggedStage = useRef<string | null>(null);
  const pointer = useMemo(() => new Vector2(), []);
  const dogTarget = useMemo(() => new Vector3(), []);
  const catTarget = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    finePointer.current = query.matches;
    const update = () => {
      finePointer.current = query.matches;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.current || event.pointerType !== "mouse") return;
      pointer.set(
        MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
        MathUtils.clamp(-(event.clientY / window.innerHeight) * 2 + 1, -1, 1),
      );
    };
    const resetPointer = () => pointer.set(0, 0);
    const savedGuide = window.sessionStorage.getItem("metevet-guide");
    selectedGuide.current = savedGuide === "cat" ? "cat" : "dog";
    const onGuideChange = (event: Event) => {
      const choice = (event as CustomEvent<"cat" | "dog">).detail;
      if (choice === "cat" || choice === "dog") selectedGuide.current = choice;
    };
    query.addEventListener("change", update);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("mouseleave", resetPointer);
    window.addEventListener("metevet-guide-change", onGuideChange);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("mouseleave", resetPointer);
      window.removeEventListener("metevet-guide-change", onGuideChange);
    };
  }, [pointer]);

  useFrame((_, delta) => {
    dogTarget.copy(waypointPosition(DOG_WAYPOINTS, progress));
    catTarget.copy(waypointPosition(CAT_WAYPOINTS, progress));
    if (dog.current) dog.current.visible = selectedGuide.current === "dog";
    if (cat.current) cat.current.visible = selectedGuide.current === "cat";
    const damping = 1 - Math.exp(-delta * 3.2);
    dog.current?.position.lerp(dogTarget, damping);
    cat.current?.position.lerp(catTarget, damping);

    const targetHeadY = finePointer.current
      ? MathUtils.clamp(pointer.x * MAX_HEAD_ROTATION, -MAX_HEAD_ROTATION, MAX_HEAD_ROTATION)
      : 0;
    const targetHeadX = finePointer.current
      ? MathUtils.clamp(-pointer.y * MAX_HEAD_ROTATION * 0.5, -MAX_HEAD_ROTATION, MAX_HEAD_ROTATION)
      : 0;
    const targetBodyY = finePointer.current
      ? MathUtils.clamp(pointer.x * MAX_BODY_ROTATION, -MAX_BODY_ROTATION, MAX_BODY_ROTATION)
      : 0;

    for (const head of [dogHead.current, catHead.current]) {
      if (!head) continue;
      head.rotation.y = MathUtils.damp(head.rotation.y, targetHeadY, 4.5, delta);
      head.rotation.x = MathUtils.damp(head.rotation.x, targetHeadX, 4.5, delta);
    }
    for (const body of [dog.current, cat.current]) {
      if (body) body.rotation.y = MathUtils.damp(body.rotation.y, targetBodyY, 4.5, delta);
    }

    if (process.env.NODE_ENV === "development" && lastLoggedStage.current !== activeStageId) {
      lastLoggedStage.current = activeStageId;
      console.info("[ClinicJourney] animal positions", {
        stage: activeStageId,
        dog: dog.current?.position.toArray(),
        cat: cat.current?.position.toArray(),
      });
    }
  });

  return (
    <>
      <DogGuide groupRef={dog} headRef={dogHead} />
      <CatGuide groupRef={cat} headRef={catHead} />
    </>
  );
}
