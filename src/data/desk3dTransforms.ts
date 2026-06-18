export type Vector3Tuple = [number, number, number];

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
    left: "-3.8%",
    bottom: "4.4%",
    width: "min(39vw, 710px)",
    height: "min(51vh, 500px)",
  },
  tableY: -0.66,
  assets: {
    stand: {
      position: [-0.59, 0.1, 0.03],
      rotation: [-0.08, -0.58, -0.03],
      scale: 0.2,
    },
    phone: {
      position: [-0.29, 0.66, 0.29],
      rotation: [-0.83, -2.22, -0.61],
      scale: 0.27,
    },
  },
};
