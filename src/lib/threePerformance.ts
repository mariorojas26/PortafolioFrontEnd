export type ThreeQualityTier = "low" | "balanced" | "high";
export type ThreeCanvasScale = "medium" | "large";

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
};

type PixelRatioProfile = {
  min: number;
  max: number;
  scale: number;
};

const PIXEL_RATIO_PROFILES: Record<ThreeCanvasScale, Record<ThreeQualityTier, PixelRatioProfile>> = {
  medium: {
    low: { min: 1, max: 1.2, scale: 0.9 },
    balanced: { min: 1.1, max: 1.5, scale: 1 },
    high: { min: 1.2, max: 1.8, scale: 1.05 },
  },
  large: {
    low: { min: 1, max: 1.12, scale: 0.85 },
    balanced: { min: 1, max: 1.35, scale: 0.95 },
    high: { min: 1.1, max: 1.65, scale: 1 },
  },
};

const SHADOW_MAP_SIZE: Record<ThreeQualityTier, number> = {
  low: 512,
  balanced: 768,
  high: 1024,
};

export function getThreeQualityTier(): ThreeQualityTier {
  if (typeof window === "undefined") return "balanced";

  const navigatorHints = window.navigator as NavigatorWithHints;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigatorHints.connection?.saveData;
  const effectiveType = navigatorHints.connection?.effectiveType;
  const deviceMemory = navigatorHints.deviceMemory ?? 4;
  const hardwareConcurrency = navigatorHints.hardwareConcurrency ?? 4;
  const isSmallViewport = window.innerWidth < 768;
  const isSlowConnection = effectiveType === "slow-2g" || effectiveType === "2g";

  if (reduceMotion || saveData || isSlowConnection || deviceMemory <= 2 || hardwareConcurrency <= 2) {
    return "low";
  }

  if (isSmallViewport || deviceMemory <= 4 || hardwareConcurrency <= 4) {
    return "balanced";
  }

  return "high";
}

export function getThreeRenderSettings(canvasScale: ThreeCanvasScale = "medium") {
  const qualityTier = getThreeQualityTier();
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const profile = PIXEL_RATIO_PROFILES[canvasScale][qualityTier];
  const pixelRatio = Math.min(Math.max(dpr * profile.scale, profile.min), profile.max);

  return {
    antialias: qualityTier !== "low",
    pixelRatio,
    qualityTier,
    shadowMapSize: SHADOW_MAP_SIZE[qualityTier],
    useRealtimeShadows: qualityTier !== "low",
  };
}
