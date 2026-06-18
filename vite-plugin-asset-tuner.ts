import type { Plugin } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Vector3Tuple = [number, number, number];

type Desk3DAssetId = "stand" | "phone" | "car" | "trophy";

type Desk3DAssetTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  color: string;
};

type Desk3DShadowTransform = {
  opacity: number;
  hoverOpacity: number;
  scaleX: number;
  scaleZ: number;
  contactOpacity: number;
  contactWidth: number;
  contactHeight: number;
  contactBlur: number;
  contactLeft: number;
  contactBottom: number;
};

type Desk3DTransforms = {
  stage: {
    left: string;
    bottom: string;
    width: string;
    height: string;
  };
  tableY: number;
  lighting: {
    exposure: number;
    ambient: number;
    key: number;
    fill: number;
    rim: number;
  };
  shadows: Record<Desk3DAssetId, Desk3DShadowTransform>;
  assets: Record<Desk3DAssetId, Desk3DAssetTransform>;
};

const TRANSFORM_FILE = resolve(process.cwd(), "src/data/desk3dTransforms.ts");

function isVector3Tuple(value: unknown): value is Vector3Tuple {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function isAssetTransform(value: unknown): value is Desk3DAssetTransform {
  if (!value || typeof value !== "object") return false;
  const transform = value as Desk3DAssetTransform;
  return isVector3Tuple(transform.position) && isVector3Tuple(transform.rotation) && typeof transform.scale === "number" && Number.isFinite(transform.scale) && /^#[0-9a-fA-F]{6}$/.test(transform.color);
}

function hasFiniteNumbers(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === "number" && Number.isFinite(record[key]));
}

function isShadowTransform(value: unknown): value is Desk3DShadowTransform {
  return hasFiniteNumbers(value, [
    "opacity",
    "hoverOpacity",
    "scaleX",
    "scaleZ",
    "contactOpacity",
    "contactWidth",
    "contactHeight",
    "contactBlur",
    "contactLeft",
    "contactBottom",
  ]);
}

function isTransforms(value: unknown): value is Desk3DTransforms {
  if (!value || typeof value !== "object") return false;
  const transforms = value as Desk3DTransforms;
  return (
    !!transforms.stage &&
    typeof transforms.stage.left === "string" &&
    typeof transforms.stage.bottom === "string" &&
    typeof transforms.stage.width === "string" &&
    typeof transforms.stage.height === "string" &&
    typeof transforms.tableY === "number" &&
    hasFiniteNumbers(transforms.lighting, ["exposure", "ambient", "key", "fill", "rim"]) &&
    !!transforms.shadows &&
    isShadowTransform(transforms.shadows.stand) &&
    isShadowTransform(transforms.shadows.phone) &&
    isShadowTransform(transforms.shadows.car) &&
    isShadowTransform(transforms.shadows.trophy) &&
    !!transforms.assets &&
    isAssetTransform(transforms.assets.stand) &&
    isAssetTransform(transforms.assets.phone) &&
    isAssetTransform(transforms.assets.car) &&
    isAssetTransform(transforms.assets.trophy)
  );
}

function formatTuple(tuple: Vector3Tuple) {
  return `[${tuple.map((value) => Number(value.toFixed(4))).join(", ")}]`;
}

function formatTransformFile(transforms: Desk3DTransforms) {
  return `export type Vector3Tuple = [number, number, number];

export type Desk3DAssetId = "stand" | "phone" | "car" | "trophy";

export type Desk3DAssetTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  color: string;
};

export type Desk3DShadowTransform = {
  opacity: number;
  hoverOpacity: number;
  scaleX: number;
  scaleZ: number;
  contactOpacity: number;
  contactWidth: number;
  contactHeight: number;
  contactBlur: number;
  contactLeft: number;
  contactBottom: number;
};

export type Desk3DTransforms = {
  stage: {
    left: string;
    bottom: string;
    width: string;
    height: string;
  };
  tableY: number;
  lighting: {
    exposure: number;
    ambient: number;
    key: number;
    fill: number;
    rim: number;
  };
  shadows: Record<Desk3DAssetId, Desk3DShadowTransform>;
  assets: Record<Desk3DAssetId, Desk3DAssetTransform>;
};

export const desk3dTransforms: Desk3DTransforms = {
  stage: {
    left: ${JSON.stringify(transforms.stage.left)},
    bottom: ${JSON.stringify(transforms.stage.bottom)},
    width: ${JSON.stringify(transforms.stage.width)},
    height: ${JSON.stringify(transforms.stage.height)},
  },
  tableY: ${Number(transforms.tableY.toFixed(4))},
  lighting: {
    exposure: ${Number(transforms.lighting.exposure.toFixed(4))},
    ambient: ${Number(transforms.lighting.ambient.toFixed(4))},
    key: ${Number(transforms.lighting.key.toFixed(4))},
    fill: ${Number(transforms.lighting.fill.toFixed(4))},
    rim: ${Number(transforms.lighting.rim.toFixed(4))},
  },
  shadows: {
    stand: {
      opacity: ${Number(transforms.shadows.stand.opacity.toFixed(4))},
      hoverOpacity: ${Number(transforms.shadows.stand.hoverOpacity.toFixed(4))},
      scaleX: ${Number(transforms.shadows.stand.scaleX.toFixed(4))},
      scaleZ: ${Number(transforms.shadows.stand.scaleZ.toFixed(4))},
      contactOpacity: ${Number(transforms.shadows.stand.contactOpacity.toFixed(4))},
      contactWidth: ${Number(transforms.shadows.stand.contactWidth.toFixed(4))},
      contactHeight: ${Number(transforms.shadows.stand.contactHeight.toFixed(4))},
      contactBlur: ${Number(transforms.shadows.stand.contactBlur.toFixed(4))},
      contactLeft: ${Number(transforms.shadows.stand.contactLeft.toFixed(4))},
      contactBottom: ${Number(transforms.shadows.stand.contactBottom.toFixed(4))},
    },
    phone: {
      opacity: ${Number(transforms.shadows.phone.opacity.toFixed(4))},
      hoverOpacity: ${Number(transforms.shadows.phone.hoverOpacity.toFixed(4))},
      scaleX: ${Number(transforms.shadows.phone.scaleX.toFixed(4))},
      scaleZ: ${Number(transforms.shadows.phone.scaleZ.toFixed(4))},
      contactOpacity: ${Number(transforms.shadows.phone.contactOpacity.toFixed(4))},
      contactWidth: ${Number(transforms.shadows.phone.contactWidth.toFixed(4))},
      contactHeight: ${Number(transforms.shadows.phone.contactHeight.toFixed(4))},
      contactBlur: ${Number(transforms.shadows.phone.contactBlur.toFixed(4))},
      contactLeft: ${Number(transforms.shadows.phone.contactLeft.toFixed(4))},
      contactBottom: ${Number(transforms.shadows.phone.contactBottom.toFixed(4))},
    },
    car: {
      opacity: ${Number(transforms.shadows.car.opacity.toFixed(4))},
      hoverOpacity: ${Number(transforms.shadows.car.hoverOpacity.toFixed(4))},
      scaleX: ${Number(transforms.shadows.car.scaleX.toFixed(4))},
      scaleZ: ${Number(transforms.shadows.car.scaleZ.toFixed(4))},
      contactOpacity: ${Number(transforms.shadows.car.contactOpacity.toFixed(4))},
      contactWidth: ${Number(transforms.shadows.car.contactWidth.toFixed(4))},
      contactHeight: ${Number(transforms.shadows.car.contactHeight.toFixed(4))},
      contactBlur: ${Number(transforms.shadows.car.contactBlur.toFixed(4))},
      contactLeft: ${Number(transforms.shadows.car.contactLeft.toFixed(4))},
      contactBottom: ${Number(transforms.shadows.car.contactBottom.toFixed(4))},
    },
    trophy: {
      opacity: ${Number(transforms.shadows.trophy.opacity.toFixed(4))},
      hoverOpacity: ${Number(transforms.shadows.trophy.hoverOpacity.toFixed(4))},
      scaleX: ${Number(transforms.shadows.trophy.scaleX.toFixed(4))},
      scaleZ: ${Number(transforms.shadows.trophy.scaleZ.toFixed(4))},
      contactOpacity: ${Number(transforms.shadows.trophy.contactOpacity.toFixed(4))},
      contactWidth: ${Number(transforms.shadows.trophy.contactWidth.toFixed(4))},
      contactHeight: ${Number(transforms.shadows.trophy.contactHeight.toFixed(4))},
      contactBlur: ${Number(transforms.shadows.trophy.contactBlur.toFixed(4))},
      contactLeft: ${Number(transforms.shadows.trophy.contactLeft.toFixed(4))},
      contactBottom: ${Number(transforms.shadows.trophy.contactBottom.toFixed(4))},
    },
  },
  assets: {
    stand: {
      position: ${formatTuple(transforms.assets.stand.position)},
      rotation: ${formatTuple(transforms.assets.stand.rotation)},
      scale: ${Number(transforms.assets.stand.scale.toFixed(4))},
      color: ${JSON.stringify(transforms.assets.stand.color)},
    },
    phone: {
      position: ${formatTuple(transforms.assets.phone.position)},
      rotation: ${formatTuple(transforms.assets.phone.rotation)},
      scale: ${Number(transforms.assets.phone.scale.toFixed(4))},
      color: ${JSON.stringify(transforms.assets.phone.color)},
    },
    car: {
      position: ${formatTuple(transforms.assets.car.position)},
      rotation: ${formatTuple(transforms.assets.car.rotation)},
      scale: ${Number(transforms.assets.car.scale.toFixed(4))},
      color: ${JSON.stringify(transforms.assets.car.color)},
    },
    trophy: {
      position: ${formatTuple(transforms.assets.trophy.position)},
      rotation: ${formatTuple(transforms.assets.trophy.rotation)},
      scale: ${Number(transforms.assets.trophy.scale.toFixed(4))},
      color: ${JSON.stringify(transforms.assets.trophy.color)},
    },
  },
};
`;
}

function readRequestBody(request: Parameters<NonNullable<Plugin["configureServer"]>>[0]["middlewares"] extends never ? never : import("node:http").IncomingMessage) {
  return new Promise<string>((resolveBody, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolveBody(body));
    request.on("error", reject);
  });
}

export function assetTunerPlugin(): Plugin {
  return {
    name: "portfolio-asset-tuner",
    configureServer(server) {
      server.middlewares.use("/__asset-tuner/save", async (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end("Method not allowed");
          return;
        }

        try {
          const body = await readRequestBody(request);
          const parsed = JSON.parse(body) as unknown;
          if (!isTransforms(parsed)) {
            response.statusCode = 400;
            response.end("Invalid transform payload");
            return;
          }

          await mkdir(dirname(TRANSFORM_FILE), { recursive: true });
          await writeFile(TRANSFORM_FILE, formatTransformFile(parsed), "utf8");
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : "Unable to save transforms");
        }
      });
    },
  };
}
