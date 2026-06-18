import type { Plugin } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Vector3Tuple = [number, number, number];

type Desk3DAssetId = "stand" | "phone";

type Desk3DAssetTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
};

type Desk3DTransforms = {
  stage: {
    left: string;
    bottom: string;
    width: string;
    height: string;
  };
  tableY: number;
  assets: Record<Desk3DAssetId, Desk3DAssetTransform>;
};

const TRANSFORM_FILE = resolve(process.cwd(), "src/data/desk3dTransforms.ts");

function isVector3Tuple(value: unknown): value is Vector3Tuple {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function isAssetTransform(value: unknown): value is Desk3DAssetTransform {
  if (!value || typeof value !== "object") return false;
  const transform = value as Desk3DAssetTransform;
  return isVector3Tuple(transform.position) && isVector3Tuple(transform.rotation) && typeof transform.scale === "number" && Number.isFinite(transform.scale);
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
    !!transforms.assets &&
    isAssetTransform(transforms.assets.stand) &&
    isAssetTransform(transforms.assets.phone)
  );
}

function formatTuple(tuple: Vector3Tuple) {
  return `[${tuple.map((value) => Number(value.toFixed(4))).join(", ")}]`;
}

function formatTransformFile(transforms: Desk3DTransforms) {
  return `export type Vector3Tuple = [number, number, number];

export type Desk3DAssetId = "stand" | "phone";

export type Desk3DAssetTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
};

export type Desk3DTransforms = {
  stage: {
    left: string;
    bottom: string;
    width: string;
    height: string;
  };
  tableY: number;
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
  assets: {
    stand: {
      position: ${formatTuple(transforms.assets.stand.position)},
      rotation: ${formatTuple(transforms.assets.stand.rotation)},
      scale: ${Number(transforms.assets.stand.scale.toFixed(4))},
    },
    phone: {
      position: ${formatTuple(transforms.assets.phone.position)},
      rotation: ${formatTuple(transforms.assets.phone.rotation)},
      scale: ${Number(transforms.assets.phone.scale.toFixed(4))},
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
