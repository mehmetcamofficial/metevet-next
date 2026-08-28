import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const COMPONENT_BYTES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};
const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const publicUrl = "/models/animals/metevet-cat.glb";
const modelPath = path.join(projectRoot, "public", publicUrl);
const bytes = await readFile(modelPath);

if (bytes.readUInt32LE(0) !== GLB_MAGIC) {
  throw new Error("Invalid GLB magic header.");
}
if (bytes.readUInt32LE(4) !== 2) {
  throw new Error(`Unsupported GLB version: ${bytes.readUInt32LE(4)}`);
}
if (bytes.readUInt32LE(8) !== bytes.length) {
  throw new Error("GLB header length does not match the file size.");
}

let json;
let binaryChunk;
for (let offset = 12; offset < bytes.length; ) {
  const chunkLength = bytes.readUInt32LE(offset);
  const chunkType = bytes.readUInt32LE(offset + 4);
  const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength);
  if (chunkType === JSON_CHUNK) {
    json = JSON.parse(chunk.toString("utf8").replace(/\0+$/u, "").trimEnd());
  } else if (chunkType === BIN_CHUNK) {
    binaryChunk = chunk;
  }
  offset += 8 + chunkLength;
}

if (!json) throw new Error("GLB contains no JSON chunk.");

const nodes = json.nodes ?? [];
const meshes = json.meshes ?? [];
const accessors = json.accessors ?? [];
const bufferViews = json.bufferViews ?? [];
const scenes = json.scenes ?? [];
const sceneIndex = json.scene ?? 0;

function nodeLabel(index) {
  const node = nodes[index];
  return `${node?.name || "(unnamed)"} [node ${index}]`;
}

function hierarchyLine(index, prefix = "") {
  const node = nodes[index];
  const tags = [];
  if (node.mesh !== undefined) tags.push(`mesh=${node.mesh}`);
  if (node.skin !== undefined) tags.push(`skin=${node.skin}`);
  const lines = [`${prefix}${nodeLabel(index)}${tags.length ? ` (${tags.join(", ")})` : ""}`];
  for (const child of node.children ?? []) {
    lines.push(...hierarchyLine(child, `${prefix}  `));
  }
  return lines;
}

function primitiveTriangles(primitive) {
  const count =
    primitive.indices !== undefined
      ? accessors[primitive.indices]?.count ?? 0
      : accessors[primitive.attributes?.POSITION]?.count ?? 0;
  switch (primitive.mode ?? 4) {
    case 4:
      return Math.floor(count / 3);
    case 5:
    case 6:
      return Math.max(0, count - 2);
    default:
      return 0;
  }
}

function imageBytes(image) {
  if (image.bufferView === undefined || !binaryChunk) return undefined;
  const view = bufferViews[image.bufferView];
  if (!view) return undefined;
  const start = view.byteOffset ?? 0;
  return binaryChunk.subarray(start, start + view.byteLength);
}

function imageDimensions(data, mimeType) {
  if (!data) return undefined;
  if (
    mimeType === "image/png" ||
    (data.length >= 24 && data.toString("ascii", 1, 4) === "PNG")
  ) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (
    mimeType === "image/webp" ||
    (data.length >= 30 &&
      data.toString("ascii", 0, 4) === "RIFF" &&
      data.toString("ascii", 8, 12) === "WEBP")
  ) {
    const format = data.toString("ascii", 12, 16);
    if (format === "VP8X") {
      return {
        width: 1 + data.readUIntLE(24, 3),
        height: 1 + data.readUIntLE(27, 3),
      };
    }
  }
  if (
    mimeType === "image/jpeg" ||
    (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8)
  ) {
    for (let offset = 2; offset + 9 < data.length; ) {
      if (data[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = data[offset + 1];
      const length = data.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: data.readUInt16BE(offset + 7),
          height: data.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

function animationDuration(animation) {
  let duration = 0;
  for (const sampler of animation.samplers ?? []) {
    const input = accessors[sampler.input];
    const maximum = input?.max?.[0];
    if (typeof maximum === "number") duration = Math.max(duration, maximum);
  }
  return duration;
}

function exactMatches(names, expressions) {
  return names.filter((name) => expressions.some((expression) => expression.test(name)));
}

const triangleCount = meshes.reduce(
  (total, mesh) =>
    total + (mesh.primitives ?? []).reduce((sum, primitive) => sum + primitiveTriangles(primitive), 0),
  0,
);
const skinnedMeshNodes = nodes.filter((node) => node.mesh !== undefined && node.skin !== undefined);
const jointCount = (json.skins ?? []).reduce(
  (total, skin) => total + (skin.joints?.length ?? 0),
  0,
);
const animations = (json.animations ?? []).map((animation, index) => ({
  index,
  name: animation.name ?? "(unnamed)",
  duration: animationDuration(animation),
}));
const animationNames = animations.map(({ name }) => name);
const capabilities = {
  idle: exactMatches(animationNames, [/\bidle\b/iu]),
  walkOrRun: exactMatches(animationNames, [/^walk/iu, /^run/iu]),
  sit: exactMatches(animationNames, [/^sit(?:down)?$/iu]),
  standUp: exactMatches(animationNames, [/\bstand[\s_-]*up\b/iu]),
  groomOrCleanPaw: exactMatches(animationNames, [/\bgroom\b/iu, /\bclean[\s_-]*paw\b/iu]),
  waveOrPaw: exactMatches(animationNames, [/\bwave\b/iu, /\bpaw\b/iu]),
};

console.log(`Public URL: ${publicUrl}`);
console.log(`Resolved file: ${modelPath}`);
console.log(`Exact file size: ${bytes.length} bytes`);
console.log(`GLB version: ${bytes.readUInt32LE(4)}`);
console.log(`Default scene: ${sceneIndex} (${scenes[sceneIndex]?.name ?? "(unnamed)"})`);
console.log("Scene hierarchy:");
for (const root of scenes[sceneIndex]?.nodes ?? []) {
  for (const line of hierarchyLine(root)) console.log(`  ${line}`);
}
console.log(`Mesh definitions: ${meshes.length}`);
console.log(
  `Mesh nodes: ${nodes.filter((node) => node.mesh !== undefined).length} (${skinnedMeshNodes.length} skinned)`,
);
console.log(`Primitive count: ${meshes.reduce((n, mesh) => n + (mesh.primitives?.length ?? 0), 0)}`);
console.log(`Triangle count: ${triangleCount}`);
console.log(`Material count: ${(json.materials ?? []).length}`);
console.log(`Texture count: ${(json.textures ?? []).length}`);
console.log(`Image count: ${(json.images ?? []).length}`);
for (const [index, image] of (json.images ?? []).entries()) {
  const dimensions = imageDimensions(imageBytes(image), image.mimeType);
  console.log(
    `  Image ${index}: ${image.name ?? "(unnamed)"}; ${image.mimeType ?? "unknown MIME"}; ${
      dimensions ? `${dimensions.width}x${dimensions.height}` : "dimensions undetectable"
    }`,
  );
}
console.log(
  `Skeleton: ${(json.skins ?? []).length > 0 ? "present" : "absent"}; skins=${(json.skins ?? []).length}; unique joint references=${jointCount}`,
);
for (const [index, skin] of (json.skins ?? []).entries()) {
  console.log(
    `  Skin ${index}: ${skin.name ?? "(unnamed)"}; joints=${skin.joints?.length ?? 0}; skeleton root=${
      skin.skeleton === undefined ? "(unspecified)" : nodeLabel(skin.skeleton)
    }`,
  );
}
console.log(`Animation clip count: ${animations.length}`);
for (const animation of animations) {
  console.log(
    `  Clip ${animation.index}: ${JSON.stringify(animation.name)}; duration=${animation.duration.toFixed(6)}s`,
  );
}
for (const [capability, matches] of Object.entries(capabilities)) {
  console.log(`${capability}: ${matches.length ? `YES -> ${matches.map(JSON.stringify).join(", ")}` : "NO"}`);
}
console.log(
  `Minimum set (Idle + Walk/Run + Sit): ${
    capabilities.idle.length && capabilities.walkOrRun.length && capabilities.sit.length
      ? "CONFIRMED"
      : "MISSING"
  }`,
);

// Report accessor layout as a consistency check for binary geometry data.
const invalidAccessors = accessors.filter((accessor) => {
  const componentBytes = COMPONENT_BYTES[accessor.componentType];
  const componentCount = TYPE_COMPONENTS[accessor.type];
  return !componentBytes || !componentCount || !Number.isInteger(accessor.count);
});
if (invalidAccessors.length) {
  throw new Error(`${invalidAccessors.length} accessor(s) have an unsupported or invalid layout.`);
}
