export type Vector3Tuple = [number, number, number];

export type Desk3DAssetId = "stand" | "phone";

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
    left: "-3.8%",
    bottom: "4.4%",
    width: "min(39vw, 710px)",
    height: "min(51vh, 500px)",
  },
  tableY: -0.66,
  lighting: {
    exposure: 1.17,
    ambient: 0.98,
    key: 3.02,
    fill: 1.82,
    rim: 0,
  },
  shadows: {
    stand: {
      opacity: 0.2,
      hoverOpacity: 0.2,
      scaleX: 2.55,
      scaleZ: 0.82,
      contactOpacity: 0.48,
      contactWidth: 58,
      contactHeight: 12,
      contactBlur: 9,
      contactLeft: 4,
      contactBottom: 6,
    },
    phone: {
      opacity: 0,
      hoverOpacity: 0,
      scaleX: 1.98,
      scaleZ: 0.68,
      contactOpacity: 0,
      contactWidth: 42,
      contactHeight: 3,
      contactBlur: 7,
      contactLeft: 44,
      contactBottom: 12,
    },
  },
  assets: {
    stand: {
      position: [-0.56, 0.1, 0.03],
      rotation: [-0.08, -0.58, -0.03],
      scale: 0.2,
      color: "#ffffff",
    },
    phone: {
      position: [-0.29, 0.66, 0.29],
      rotation: [-0.83, -2.22, -0.61],
      scale: 0.27,
      color: "#ffffff",
    },
  },
};
