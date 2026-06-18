export type Vector3Tuple = [number, number, number];

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
    left: "-3.8%",
    bottom: "4.4%",
    width: "min(39vw, 710px)",
    height: "min(51vh, 500px)",
  },
  tableY: -0.66,
  lighting: {
    exposure: 0.5,
    ambient: 0.23,
    key: 3.05,
    fill: 4,
    rim: 0.69,
  },
  shadows: {
    stand: {
      opacity: 0,
      hoverOpacity: 0,
      scaleX: 2.25,
      scaleZ: 0.44,
      contactOpacity: 0,
      contactWidth: 82,
      contactHeight: 15,
      contactBlur: 7,
      contactLeft: 0,
      contactBottom: -16,
    },
    phone: {
      opacity: 0,
      hoverOpacity: 0,
      scaleX: 1.98,
      scaleZ: 0.68,
      contactOpacity: 0,
      contactWidth: 42,
      contactHeight: 3,
      contactBlur: 14,
      contactLeft: -25,
      contactBottom: 18,
    },
    car: {
      opacity: 0.38,
      hoverOpacity: 0.46,
      scaleX: 1.52,
      scaleZ: 0.48,
      contactOpacity: 0.64,
      contactWidth: 70,
      contactHeight: 14,
      contactBlur: 6,
      contactLeft: 16,
      contactBottom: 23,
    },
    trophy: {
      opacity: 0.28,
      hoverOpacity: 0.2,
      scaleX: 1.1,
      scaleZ: 0.42,
      contactOpacity: 0.72,
      contactWidth: 32,
      contactHeight: 7,
      contactBlur: 8,
      contactLeft: 42,
      contactBottom: 20,
    },
  },
  assets: {
    stand: {
      position: [-0.56, 0.1, 0.03],
      rotation: [-0.08, -0.58, -0.03],
      scale: 0.2,
      color: "#ffcfa8",
    },
    phone: {
      position: [-0.29, 0.66, 0.29],
      rotation: [-0.83, -2.22, -0.61],
      scale: 0.27,
      color: "#ffffff",
    },
    car: {
      position: [0.49, -0.67, -0.64],
      rotation: [0.03, -0.64, -0.04],
      scale: 1.21,
      color: "#ffffff",
    },
    trophy: {
      position: [0.45, -0.66, 0.04],
      rotation: [-0.03, -0.28, -0.03],
      scale: 0.98,
      color: "#ff1b83",
    },
  },
};
