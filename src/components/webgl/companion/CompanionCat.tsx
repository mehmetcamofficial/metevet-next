"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  AnimationAction,
  Bone,
  Box3,
  DoubleSide,
  Euler,
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from "three";
import type { CompanionState } from "./CompanionAnimationMachine";
import {
  COMPANION_CLIPS,
  COMPANION_CONFIG,
  COMPANION_MODEL_PATH,
} from "./companion-config";
import {
  clampWorldGaze,
  createGazeProjectionWorkspace,
  getGazeDistanceInfluence,
  getCompanionTargetCssHeight,
  getTouchIdleGaze,
  projectPointerToWorldTarget,
  slerpGazeQuaternion,
  worldTargetToGaze,
} from "./companion-motion";

function setQuaternionFromGaze(
  quaternion: Quaternion,
  euler: Euler,
  yaw: number,
  pitch: number,
  roll = 0,
) {
  quaternion.setFromEuler(euler.set(pitch, yaw, roll, "YXZ"));
}

function gazeRegion(value: number) {
  if (value < -0.33) return -1;
  if (value > 0.33) return 1;
  return 0;
}

function clipForState(state: CompanionState) {
  if (state === "MOVING") return COMPANION_CLIPS.walk;
  if (state === "SITTING") return COMPANION_CLIPS.sit;
  if (state === "SEATED_IDLE") return COMPANION_CLIPS.sittingIdle;
  if (state === "STANDING") return COMPANION_CLIPS.stand;
  return COMPANION_CLIPS.idle;
}

export function CompanionCat({
  stateRef,
  pointerRef,
  greetUntilRef,
  debugMode,
  onModelVisibleReady,
}: {
  stateRef: React.RefObject<CompanionState>;
  pointerRef: React.RefObject<{ x: number; y: number; active: boolean }>;
  greetUntilRef: React.RefObject<number>;
  debugMode: boolean;
  onModelVisibleReady: (ready: boolean) => void;
}) {
  const { camera, gl, invalidate } = useThree();
  const normalizationRoot = useRef<Group>(null);
  const orientationRoot = useRef<Group>(null);
  const gltf = useGLTF(COMPANION_MODEL_PATH);
  const clonedScene = useMemo(() => {
    const instance = clone(gltf.scene);
    instance.name = "MeteVetCompanionCatClone";
    instance.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    });
    return instance;
  }, [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, clonedScene);
  const actionsRef = useRef(actions);
  const activeAction = useRef<AnimationAction | null>(null);
  const activeState = useRef<CompanionState | null>(null);
  const head = useRef<Bone | Object3D | null>(null);
  const neck = useRef<Bone | Object3D | null>(null);
  const leftEye = useRef<Bone | Object3D | null>(null);
  const rightEye = useRef<Bone | Object3D | null>(null);
  const finePointer = useRef(false);
  const lastDiagnosticRegion = useRef("");
  const gazeWorkspace = useMemo(() => createGazeProjectionWorkspace(), []);
  const gazeMath = useMemo(
    () => ({
      headPosition: new Vector3(),
      gazePlanePoint: new Vector3(),
      cameraDirection: new Vector3(),
      worldTarget: new Vector3(),
      orientationQuaternion: new Quaternion(),
      localDirection: new Vector3(),
      inverseOrientation: new Quaternion(),
      euler: new Euler(0, 0, 0, "YXZ"),
      targets: {
        neck: new Quaternion(),
        head: new Quaternion(),
        leftEye: new Quaternion(),
        rightEye: new Quaternion(),
      },
      offsets: {
        neck: new Quaternion(),
        head: new Quaternion(),
        leftEye: new Quaternion(),
        rightEye: new Quaternion(),
      },
    }),
    [],
  );

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const update = () => {
      finePointer.current = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    actionsRef.current = actions;
    head.current = clonedScene.getObjectByName("Head_22") ?? null;
    neck.current = clonedScene.getObjectByName("Neck_23") ?? null;
    leftEye.current = clonedScene.getObjectByName("Eye.L_18") ?? null;
    rightEye.current = clonedScene.getObjectByName("Eye.R_19") ?? null;
    const importedFloor = clonedScene.getObjectByName("Cube_41");
    const previousFloorVisibility = importedFloor?.visible;
    if (importedFloor) importedFloor.visible = false;
    const meshRecords: Array<{
      mesh: Mesh;
      frustumCulled: boolean;
      renderOrder: number;
      material: Mesh["material"];
      visibility: boolean;
    }> = [];
    clonedScene.traverse((object) => {
      if (!(object instanceof Mesh)) {
        if (debugMode) object.visible = true;
        return;
      }
      meshRecords.push({
        mesh: object,
        frustumCulled: object.frustumCulled,
        renderOrder: object.renderOrder,
        material: object.material,
        visibility: object.visible,
      });
      object.visible = true;
      object.frustumCulled = false;
      object.renderOrder = 100;
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        material.depthTest = false;
        material.needsUpdate = true;
      }
    });

    let diagnosticFrame = 0;
    const normalizeAndValidate = () => {
      const normalized = normalizationRoot.current;
      if (!normalized) return;
      clonedScene.updateMatrixWorld(true);
      const rawBox = new Box3().setFromObject(clonedScene);
      const rawSize = rawBox.getSize(new Vector3());
      const rawCenter = rawBox.getCenter(new Vector3());
      const boundsValid =
        Number.isFinite(rawSize.y) && rawSize.y > 0.001 && !rawBox.isEmpty();
      const targetCssHeight = debugMode
        ? 180
        : getCompanionTargetCssHeight(
            window.innerHeight,
            COMPANION_CONFIG.compactTargetCssHeight,
            COMPANION_CONFIG.targetCssHeight,
          );
      const desiredWorldHeight =
        (targetCssHeight / Math.max(1, gl.domElement.clientHeight)) *
        COMPANION_CONFIG.orthographicHalfHeight *
        2;
      const normalizedScale = boundsValid
        ? MathUtils.clamp(
            desiredWorldHeight / rawSize.y,
            COMPANION_CONFIG.minimumNormalizedScale,
            COMPANION_CONFIG.maximumNormalizedScale,
          )
        : 1;
      normalized.scale.setScalar(normalizedScale);
      normalized.position.set(
        -rawCenter.x * normalizedScale,
        -rawBox.min.y * normalizedScale,
        -rawCenter.z * normalizedScale,
      );
      normalized.updateWorldMatrix(true, true);
      invalidate();

      cancelAnimationFrame(diagnosticFrame);
      diagnosticFrame = requestAnimationFrame(() => {
        normalized.updateWorldMatrix(true, true);
        camera.updateMatrixWorld(true);
        const normalizedBox = new Box3().setFromObject(normalized);
        const modelCenter = normalizedBox.getCenter(new Vector3());
        const projected = modelCenter.clone().project(camera);
        const corners = [
          new Vector3(normalizedBox.min.x, normalizedBox.min.y, normalizedBox.min.z),
          new Vector3(normalizedBox.min.x, normalizedBox.min.y, normalizedBox.max.z),
          new Vector3(normalizedBox.min.x, normalizedBox.max.y, normalizedBox.min.z),
          new Vector3(normalizedBox.min.x, normalizedBox.max.y, normalizedBox.max.z),
          new Vector3(normalizedBox.max.x, normalizedBox.min.y, normalizedBox.min.z),
          new Vector3(normalizedBox.max.x, normalizedBox.min.y, normalizedBox.max.z),
          new Vector3(normalizedBox.max.x, normalizedBox.max.y, normalizedBox.min.z),
          new Vector3(normalizedBox.max.x, normalizedBox.max.y, normalizedBox.max.z),
        ].map((corner) => corner.project(camera));
        const ndcBounds = corners.reduce(
          (bounds, corner) => ({
            minX: Math.min(bounds.minX, corner.x),
            maxX: Math.max(bounds.maxX, corner.x),
            minY: Math.min(bounds.minY, corner.y),
            maxY: Math.max(bounds.maxY, corner.y),
            minZ: Math.min(bounds.minZ, corner.z),
            maxZ: Math.max(bounds.maxZ, corner.z),
          }),
          {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
            minZ: Infinity,
            maxZ: -Infinity,
          },
        );
        const projectedOnScreen =
          ndcBounds.maxX > -1 &&
          ndcBounds.minX < 1 &&
          ndcBounds.maxY > -1 &&
          ndcBounds.minY < 1 &&
          ndcBounds.maxZ > -1 &&
          ndcBounds.minZ < 1;
        const canvasRect = gl.domElement.getBoundingClientRect();
        const cssPixelBounds = {
          left: ((ndcBounds.minX + 1) / 2) * canvasRect.width,
          right: ((ndcBounds.maxX + 1) / 2) * canvasRect.width,
          top: ((1 - ndcBounds.maxY) / 2) * canvasRect.height,
          bottom: ((1 - ndcBounds.minY) / 2) * canvasRect.height,
        };
        const centerCss = {
          x: ((projected.x + 1) / 2) * canvasRect.width,
          y: ((1 - projected.y) / 2) * canvasRect.height,
        };
        window.dispatchEvent(
          new CustomEvent("metevet-companion-projection", {
            detail: { centerCss, cssPixelBounds, ndcBounds },
          }),
        );
        const canvasLayer = gl.domElement.closest<HTMLElement>(
          "[data-homepage-companion-canvas]",
        );
        const layerStyle = canvasLayer
          ? getComputedStyle(canvasLayer)
          : null;
        const allParentsVisible = (() => {
          let object: Object3D | null = normalized;
          while (object) {
            if (!object.visible) return false;
            object = object.parent;
          }
          return true;
        })();
        const worldScaleForReadiness = normalized.getWorldScale(new Vector3());
        const canvasReady =
          gl.domElement.isConnected &&
          canvasRect.width > 0 &&
          canvasRect.height > 0 &&
          layerStyle?.display !== "none" &&
          layerStyle?.visibility !== "hidden" &&
          Number(layerStyle?.opacity ?? 1) > 0;
        const modelVisibleReady =
          boundsValid &&
          projectedOnScreen &&
          normalized.visible &&
          allParentsVisible &&
          worldScaleForReadiness.lengthSq() > 0 &&
          canvasReady;
        onModelVisibleReady(modelVisibleReady);

        if (process.env.NODE_ENV === "development") {
          const worldPosition = normalized.getWorldPosition(new Vector3());
          const worldScale = normalized.getWorldScale(new Vector3());
          const worldQuaternion = normalized.getWorldQuaternion(
            new Quaternion(),
          );
          const worldRotation = new Euler().setFromQuaternion(worldQuaternion);
          const parentVisibility: Array<{ name: string; visible: boolean }> = [];
          let parent: Object3D | null = normalized;
          while (parent) {
            parentVisibility.push({
              name: parent.name || parent.type,
              visible: parent.visible,
            });
            parent = parent.parent;
          }
          console.info("[CompanionCat] render diagnostics", {
            clips: names,
            gazeBones: {
              head: head.current?.name ?? null,
              neck: neck.current?.name ?? null,
              leftEye: leftEye.current?.name ?? null,
              rightEye: rightEye.current?.name ?? null,
            },
            rawBoundingBox: {
              min: rawBox.min.toArray(),
              max: rawBox.max.toArray(),
            },
            rawSize: rawSize.toArray(),
            rawCenter: rawCenter.toArray(),
            normalizedScale,
            targetCssHeight,
            scaledModelHeight: rawSize.y * normalizedScale,
            groupWorldPosition: worldPosition.toArray(),
            groupWorldScale: worldScale.toArray(),
            groupWorldRotation: [
              worldRotation.x,
              worldRotation.y,
              worldRotation.z,
            ],
            camera: {
              type: camera.type,
              position: camera.position.toArray(),
              zoom: "zoom" in camera ? camera.zoom : undefined,
              fov: "fov" in camera ? camera.fov : undefined,
              near: camera.near,
              far: camera.far,
            },
            projectedModelCenter: projected.toArray(),
            projectedOnScreen,
            ndcBounds,
            cssPixelBounds: {
              ...cssPixelBounds,
              width: cssPixelBounds.right - cssPixelBounds.left,
              height: cssPixelBounds.bottom - cssPixelBounds.top,
            },
            canvas: {
              width: gl.domElement.clientWidth,
              height: gl.domElement.clientHeight,
              zIndex: canvasLayer
                ? getComputedStyle(canvasLayer).zIndex
                : null,
            },
            modelVisible: normalized.visible,
            parentVisibility,
            canvasReady,
            meshCount: meshRecords.length,
            renderedScene: clonedScene.name,
            animationRoot: clonedScene.name,
            skeletonBindings: meshRecords
              .filter(({ mesh }) => mesh instanceof SkinnedMesh)
              .map(({ mesh }) => {
                const skinnedMesh = mesh as SkinnedMesh;
                return {
                  name: skinnedMesh.name,
                  bound: Boolean(skinnedMesh.skeleton),
                  boneCount: skinnedMesh.skeleton?.bones.length ?? 0,
                  allBonesPresent:
                    skinnedMesh.skeleton?.bones.every(Boolean) ?? false,
                  bindMatrixDeterminant:
                    skinnedMesh.bindMatrix.determinant(),
                };
              }),
            objectLayer: clonedScene.layers.mask,
            cameraLayer: camera.layers.mask,
            layerMatch: camera.layers.test(clonedScene.layers),
            meshes: meshRecords.map(({ mesh }) => ({
              name: mesh.name,
              visible: mesh.visible,
              frustumCulled: mesh.frustumCulled,
              renderOrder: mesh.renderOrder,
              materials: (Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material]
              ).map((material) => ({
                type: material.type,
                opacity: material.opacity,
                transparent: material.transparent,
                visible: material.visible,
                color:
                  (
                    material as typeof material & {
                      color?: { getHexString?: () => string };
                    }
                  ).color?.getHexString?.() ?? null,
                side: material.side,
                colorWrite: material.colorWrite,
                depthTest: material.depthTest,
                depthWrite: material.depthWrite,
                clippingPlanes: material.clippingPlanes?.length ?? 0,
              })),
            })),
            modelVisibleReady,
            baseOrientation: "GLB forward -Z; wrapper rotates Y by PI",
          });
          if (!modelVisibleReady) {
            console.warn(
              "[CompanionCat] projection validation failed; using static fallback",
            );
          }
        }
      });
    };

    const restoredMaterials: Array<{
      mesh: Mesh;
      material: Mesh["material"];
    }> = [];
    if (debugMode) {
      clonedScene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        restoredMaterials.push({ mesh: object, material: object.material });
        object.material = new MeshBasicMaterial({
          color: "#ff35d3",
          depthTest: false,
          depthWrite: false,
          side: DoubleSide,
        });
      });
    }

    normalizeAndValidate();
    window.addEventListener("resize", normalizeAndValidate);
    window.addEventListener(
      "metevet-companion-revalidate",
      normalizeAndValidate,
    );
    return () => {
      window.removeEventListener("resize", normalizeAndValidate);
      window.removeEventListener(
        "metevet-companion-revalidate",
        normalizeAndValidate,
      );
      cancelAnimationFrame(diagnosticFrame);
      if (importedFloor && previousFloorVisibility !== undefined) {
        importedFloor.visible = previousFloorVisibility;
      }
      for (const { mesh, material } of restoredMaterials) {
        if (mesh.material instanceof MeshBasicMaterial) mesh.material.dispose();
        mesh.material = material;
      }
      for (const record of meshRecords) {
        record.mesh.frustumCulled = record.frustumCulled;
        record.mesh.renderOrder = record.renderOrder;
        record.mesh.visible = record.visibility;
        for (const material of Array.isArray(record.material)
          ? record.material
          : [record.material]) {
          material.depthTest = true;
          material.needsUpdate = true;
        }
      }
      activeAction.current?.stop();
    };
  }, [
    actions,
    camera,
    clonedScene,
    debugMode,
    gl,
    invalidate,
    names,
    onModelVisibleReady,
  ]);

  useFrame((_, delta) => {
    if (debugMode) {
      for (const action of Object.values(actionsRef.current)) action?.stop();
      activeAction.current = null;
      activeState.current = null;
      return;
    }
    const state = stateRef.current;
    if (state && activeState.current !== state) {
      const next = actionsRef.current[clipForState(state)];
      if (next) {
        const isOneShot = state === "SITTING" || state === "STANDING";
        next.reset();
        next.enabled = true;
        next.clampWhenFinished = isOneShot;
        next.setLoop(isOneShot ? LoopOnce : LoopRepeat, isOneShot ? 1 : Infinity);
        next.fadeIn(COMPANION_CONFIG.crossfadeSeconds).play();
        activeAction.current
          ?.fadeOut(COMPANION_CONFIG.crossfadeSeconds);
        activeAction.current = next;
      }
      activeState.current = state;
    }

    const headBone = head.current;
    const orientation = orientationRoot.current;
    if (!headBone || !orientation) return;
    const now = performance.now() / 1000;
    const greeting = now < greetUntilRef.current;
    const pointer = pointerRef.current;
    let target = { yaw: 0, pitch: 0 };

    headBone.getWorldPosition(gazeMath.headPosition);
    orientation.getWorldQuaternion(gazeMath.orientationQuaternion);
    camera.getWorldDirection(gazeMath.cameraDirection);
    gazeMath.gazePlanePoint
      .copy(gazeMath.headPosition)
      .addScaledVector(
        gazeMath.cameraDirection,
        -COMPANION_CONFIG.gazeTargetDistance,
      );
    const projected = projectPointerToWorldTarget(
      pointer,
      camera,
      gazeMath.gazePlanePoint,
      gazeMath.worldTarget,
      gazeWorkspace,
    );

    if (projected) {
      const worldGaze = worldTargetToGaze(
        gazeMath.worldTarget,
        gazeMath.headPosition,
        gazeMath.orientationQuaternion,
        gazeMath.localDirection,
        gazeMath.inverseOrientation,
      );
      target = clampWorldGaze(
        worldGaze,
        {
          yaw: COMPANION_CONFIG.gazeYawRadians,
          pitchUp: COMPANION_CONFIG.gazePitchUpRadians,
          pitchDown: COMPANION_CONFIG.gazePitchDownRadians,
        },
        getGazeDistanceInfluence(worldGaze.distance),
      );
    } else if (!finePointer.current) {
      target = getTouchIdleGaze(now);
    }

    const targetYaw = greeting ? 0 : target.yaw;
    const targetPitch = greeting
      ? -COMPANION_CONFIG.gazePitchUpRadians * 0.7
      : target.pitch;
    const tilt = greeting
      ? Math.sin((greetUntilRef.current - now) * Math.PI) *
        COMPANION_CONFIG.gazePitchUpRadians * 0.45
      : 0;

    const neckTarget = clampWorldGaze(
      {
        yaw: targetYaw * COMPANION_CONFIG.neckGazeInfluence,
        pitch: targetPitch * COMPANION_CONFIG.neckGazeInfluence,
      },
      {
        yaw: COMPANION_CONFIG.neckYawRadians,
        pitchUp: COMPANION_CONFIG.neckPitchUpRadians,
        pitchDown: COMPANION_CONFIG.neckPitchDownRadians,
      },
    );
    const headTarget = {
      yaw: targetYaw * COMPANION_CONFIG.headGazeInfluence,
      pitch: targetPitch * COMPANION_CONFIG.headGazeInfluence,
    };
    const eyeTarget = clampWorldGaze(
      {
        yaw: targetYaw * COMPANION_CONFIG.eyeGazeInfluence,
        pitch: targetPitch * COMPANION_CONFIG.eyeGazeInfluence,
      },
      {
        yaw: COMPANION_CONFIG.eyeYawRadians,
        pitchUp: COMPANION_CONFIG.eyePitchRadians,
        pitchDown: COMPANION_CONFIG.eyePitchRadians,
      },
    );

    setQuaternionFromGaze(
      gazeMath.targets.neck,
      gazeMath.euler,
      neckTarget.yaw,
      neckTarget.pitch,
    );
    setQuaternionFromGaze(
      gazeMath.targets.head,
      gazeMath.euler,
      headTarget.yaw,
      headTarget.pitch,
      tilt,
    );
    setQuaternionFromGaze(
      gazeMath.targets.leftEye,
      gazeMath.euler,
      eyeTarget.yaw,
      eyeTarget.pitch,
    );
    gazeMath.targets.rightEye.copy(gazeMath.targets.leftEye);

    const returning = !pointer.active && finePointer.current;
    const headDamping = returning
      ? COMPANION_CONFIG.neutralGazeDamping
      : COMPANION_CONFIG.headGazeDamping;
    const neckDamping = returning
      ? COMPANION_CONFIG.neutralGazeDamping
      : COMPANION_CONFIG.neckGazeDamping;
    const eyeDamping = returning
      ? COMPANION_CONFIG.neutralGazeDamping * 1.4
      : COMPANION_CONFIG.eyeGazeDamping;

    slerpGazeQuaternion(
      gazeMath.offsets.neck,
      gazeMath.targets.neck,
      neckDamping,
      delta,
    );
    slerpGazeQuaternion(
      gazeMath.offsets.head,
      gazeMath.targets.head,
      headDamping,
      delta,
    );
    slerpGazeQuaternion(
      gazeMath.offsets.leftEye,
      gazeMath.targets.leftEye,
      eyeDamping,
      delta,
    );
    slerpGazeQuaternion(
      gazeMath.offsets.rightEye,
      gazeMath.targets.rightEye,
      eyeDamping,
      delta,
    );

    neck.current?.quaternion.multiply(gazeMath.offsets.neck);
    headBone.quaternion.multiply(gazeMath.offsets.head);
    leftEye.current?.quaternion.multiply(gazeMath.offsets.leftEye);
    rightEye.current?.quaternion.multiply(gazeMath.offsets.rightEye);

    if (process.env.NODE_ENV === "development" && projected) {
      const region = `${gazeRegion(pointer.x)},${gazeRegion(pointer.y)}`;
      if (region !== lastDiagnosticRegion.current) {
        lastDiagnosticRegion.current = region;
        console.info("[CompanionCat] gaze sample", {
          region,
          pointer: { x: pointer.x, y: pointer.y },
          worldTarget: gazeMath.worldTarget.toArray(),
          targetDegrees: {
            yaw: MathUtils.radToDeg(targetYaw),
            pitch: MathUtils.radToDeg(targetPitch),
          },
          boneDegrees: {
            headYaw: MathUtils.radToDeg(headTarget.yaw),
            headPitch: MathUtils.radToDeg(headTarget.pitch),
            neckYaw: MathUtils.radToDeg(neckTarget.yaw),
            neckPitch: MathUtils.radToDeg(neckTarget.pitch),
            eyeYaw: MathUtils.radToDeg(eyeTarget.yaw),
            eyePitch: MathUtils.radToDeg(eyeTarget.pitch),
          },
          bones: {
            head: head.current?.name ?? null,
            neck: neck.current?.name ?? null,
            leftEye: leftEye.current?.name ?? null,
            rightEye: rightEye.current?.name ?? null,
          },
        });
      }
    }
  });

  return (
    <group ref={orientationRoot} name="CompanionOrientation" rotation={[0, Math.PI, 0]}>
      <group ref={normalizationRoot} name="CompanionNormalization">
        <primitive object={clonedScene} dispose={null} />
      </group>
    </group>
  );
}
