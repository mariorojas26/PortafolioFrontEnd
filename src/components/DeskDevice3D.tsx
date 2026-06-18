import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GripHorizontal, Save, SlidersHorizontal } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { desk3dTransforms, type Desk3DAssetId, type Desk3DAssetTransform, type Desk3DShadowTransform, type Desk3DTransforms } from "../data/desk3dTransforms";

const ASSET_URLS: Record<Desk3DAssetId, string> = {
  stand: "/assets/3d/mobile__cell_phone_stand.glb",
  phone: "/assets/3d/iphone_16.glb",
};

const ASSET_LABELS: Record<Desk3DAssetId, string> = {
  stand: "Base",
  phone: "Telefono",
};

const ASSET_IDS: Desk3DAssetId[] = ["stand", "phone"];
const TUNER_MODES = ["assets", "lighting", "shadow"] as const;

type TunerMode = (typeof TUNER_MODES)[number];

type LoadedAsset = {
  root: THREE.Group;
  model: THREE.Object3D;
  baseScale: number;
};

type SceneControls = {
  renderer: THREE.WebGLRenderer;
  ambientLight: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  deskFill: THREE.PointLight;
  rimLight: THREE.PointLight;
  tableShadows: Partial<Record<Desk3DAssetId, THREE.Mesh<THREE.CircleGeometry, THREE.ShadowMaterial>>>;
};

function getRenderPixelRatio() {
  return Math.min(Math.max(window.devicePixelRatio * 1.75, 2.75), 4);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function cloneTransforms(source: Desk3DTransforms): Desk3DTransforms {
  return {
    stage: { ...source.stage },
    tableY: source.tableY,
    lighting: { ...source.lighting },
    shadows: {
      stand: { ...source.shadows.stand },
      phone: { ...source.shadows.phone },
    },
    assets: {
      stand: {
        position: [...source.assets.stand.position],
        rotation: [...source.assets.stand.rotation],
        scale: source.assets.stand.scale,
        color: source.assets.stand.color,
      },
      phone: {
        position: [...source.assets.phone.position],
        rotation: [...source.assets.phone.rotation],
        scale: source.assets.phone.scale,
        color: source.assets.phone.color,
      },
    },
  };
}

function applyTransform(asset: LoadedAsset | undefined, transform: Desk3DAssetTransform) {
  if (!asset) return;

  asset.root.position.set(transform.position[0], transform.position[1], transform.position[2]);
  asset.root.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
  asset.root.scale.setScalar(asset.baseScale * transform.scale);

  asset.model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const standardMaterial = material as THREE.MeshStandardMaterial;
      standardMaterial.color?.set(transform.color);
      standardMaterial.needsUpdate = true;
    });
  });
}

function applyShadowTransform(
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.ShadowMaterial> | undefined,
  transform: Desk3DAssetTransform,
  shadowTransform: Desk3DShadowTransform,
  tableY: number,
) {
  if (!shadow) return;

  shadow.position.set(transform.position[0], tableY - 0.01, transform.position[2]);
  shadow.material.opacity = shadowTransform.opacity;
  shadow.scale.set(shadowTransform.scaleX, 1, shadowTransform.scaleZ);
}

function applySceneControls(controls: SceneControls | null, transforms: Desk3DTransforms) {
  if (!controls) return;

  controls.renderer.toneMappingExposure = transforms.lighting.exposure;
  controls.ambientLight.intensity = transforms.lighting.ambient;
  controls.keyLight.intensity = transforms.lighting.key;
  controls.deskFill.intensity = transforms.lighting.fill;
  controls.rimLight.intensity = transforms.lighting.rim;
  ASSET_IDS.forEach((assetId) => {
    applyShadowTransform(controls.tableShadows[assetId], transforms.assets[assetId], transforms.shadows[assetId], transforms.tableY);
  });
}

function prepareModel(assetId: Desk3DAssetId, model: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = assetId !== "phone";
    child.receiveShadow = assetId !== "stand";

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const texturedMaterial = material as THREE.MeshStandardMaterial;
      texturedMaterial.needsUpdate = true;

      if (assetId === "stand") {
        texturedMaterial.emissive = new THREE.Color(0x090402);
        texturedMaterial.emissiveIntensity = 0.025;
        texturedMaterial.roughness = Math.min(texturedMaterial.roughness ?? 0.72, 0.84);
        texturedMaterial.metalness = Math.min(texturedMaterial.metalness ?? 0.35, 0.4);
      }

      [
        texturedMaterial.map,
        texturedMaterial.normalMap,
        texturedMaterial.roughnessMap,
        texturedMaterial.metalnessMap,
        texturedMaterial.aoMap,
        texturedMaterial.emissiveMap,
      ].forEach((texture) => {
        if (!texture) return;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      });
    });
  });
}

async function saveTransforms(nextTransforms: Desk3DTransforms) {
  const response = await fetch("/__asset-tuner/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextTransforms),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

function getContactShadowStyle(shadow: Desk3DShadowTransform) {
  return {
    "--device-shadow-opacity": shadow.contactOpacity,
    "--device-shadow-width": `${shadow.contactWidth}%`,
    "--device-shadow-height": `${shadow.contactHeight}%`,
    "--device-shadow-blur": `${shadow.contactBlur}px`,
    "--device-shadow-left": `${shadow.contactLeft}%`,
    "--device-shadow-bottom": `${shadow.contactBottom}%`,
  } as CSSProperties;
}

function AssetTuner({
  selectedAsset,
  transforms,
  onSelectAsset,
  onChangeTransform,
  onChangeLighting,
  onChangeShadow,
}: {
  selectedAsset: Desk3DAssetId;
  transforms: Desk3DTransforms;
  onSelectAsset: (assetId: Desk3DAssetId) => void;
  onChangeTransform: (assetId: Desk3DAssetId, transform: Desk3DAssetTransform) => void;
  onChangeLighting: (key: keyof Desk3DTransforms["lighting"], value: number) => void;
  onChangeShadow: (assetId: Desk3DAssetId, key: keyof Desk3DShadowTransform, value: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState<TunerMode>("assets");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeTransform = transforms.assets[selectedAsset];
  const activeShadow = transforms.shadows[selectedAsset];

  const updateTuple = (key: "position" | "rotation", index: number, value: number) => {
    const tuple = [...activeTransform[key]] as [number, number, number];
    tuple[index] = value;
    onChangeTransform(selectedAsset, { ...activeTransform, [key]: tuple });
  };

  const updateScale = (value: number) => {
    onChangeTransform(selectedAsset, { ...activeTransform, scale: value });
  };

  const updateColor = (value: string) => {
    onChangeTransform(selectedAsset, { ...activeTransform, color: value });
  };

  const updateLighting = (key: keyof Desk3DTransforms["lighting"], value: number) => {
    onChangeLighting(key, value);
  };

  const updateShadow = (key: keyof Desk3DShadowTransform, value: number) => {
    onChangeShadow(selectedAsset, key, value);
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      await saveTransforms(transforms);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
    }
  };

  const handleDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) return;

    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const origin = {
      x: panelPosition?.x ?? rect.left,
      y: panelPosition?.y ?? rect.top,
    };
    const start = {
      x: event.clientX,
      y: event.clientY,
    };

    setPanelPosition(origin);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const nextX = origin.x + moveEvent.clientX - start.x;
      const nextY = origin.y + moveEvent.clientY - start.y;

      setPanelPosition({
        x: THREE.MathUtils.clamp(nextX, 12, window.innerWidth - width - 12),
        y: THREE.MathUtils.clamp(nextY, 12, window.innerHeight - height - 12),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const tuner = (
    <div
      ref={panelRef}
      className={`asset-tuner ${panelPosition ? "is-dragged" : ""} ${isOpen ? "is-open" : "is-collapsed"}`}
      style={
        panelPosition
          ? {
              left: `${panelPosition.x}px`,
              top: `${panelPosition.y}px`,
            }
          : undefined
      }
    >
      <div className="asset-tuner__bar">
        <button className="asset-tuner__drag" type="button" onPointerDown={handleDragStart} aria-label="Arrastrar panel 3D">
          <GripHorizontal size={16} />
        </button>
      <button className="asset-tuner__toggle" type="button" onClick={() => setIsOpen((value) => !value)} aria-label="Abrir controles 3D">
        <SlidersHorizontal size={17} />
          Ajuste 3D
          <ChevronDown className="asset-tuner__chevron" size={15} />
      </button>
      </div>

      {isOpen ? (
        <div className="asset-tuner__panel">
          <div className="asset-tuner__mode-tabs">
            {TUNER_MODES.map((item) => (
              <button key={item} type="button" className={mode === item ? "is-active" : ""} onClick={() => setMode(item)}>
                {item === "assets" ? "Assets" : item === "lighting" ? "Luz" : "Sombra"}
              </button>
            ))}
          </div>

          {mode === "assets" ? (
            <>
          <div className="asset-tuner__tabs">
            {ASSET_IDS.map((assetId) => (
              <button key={assetId} type="button" className={assetId === selectedAsset ? "is-active" : ""} onClick={() => onSelectAsset(assetId)}>
                {ASSET_LABELS[assetId]}
              </button>
            ))}
          </div>

          <div className="asset-tuner__grid">
            {(["X", "Y", "Z"] as const).map((axis, index) => (
              <label key={`position-${axis}`}>
                Pos {axis}
                <input type="number" step={0.01} value={activeTransform.position[index]} onChange={(event) => updateTuple("position", index, Number(event.target.value))} />
                <input type="range" min={-2.5} max={2.5} step={0.01} value={activeTransform.position[index]} onChange={(event) => updateTuple("position", index, Number(event.target.value))} />
              </label>
            ))}

            {(["X", "Y", "Z"] as const).map((axis, index) => (
              <label key={`rotation-${axis}`}>
                Rot {axis}
                <input type="number" step={0.01} value={activeTransform.rotation[index]} onChange={(event) => updateTuple("rotation", index, Number(event.target.value))} />
                <input type="range" min={-3.14} max={3.14} step={0.01} value={activeTransform.rotation[index]} onChange={(event) => updateTuple("rotation", index, Number(event.target.value))} />
              </label>
            ))}

            <label>
              Escala
              <input type="number" step={0.01} value={activeTransform.scale} onChange={(event) => updateScale(Number(event.target.value))} />
              <input type="range" min={0.05} max={4} step={0.01} value={activeTransform.scale} onChange={(event) => updateScale(Number(event.target.value))} />
            </label>
            <label className="asset-tuner__color-row">
              Color
              <input type="color" value={activeTransform.color} onChange={(event) => updateColor(event.target.value)} />
              <input type="text" value={activeTransform.color} onChange={(event) => updateColor(event.target.value)} />
            </label>
          </div>
            </>
          ) : null}

          {mode === "lighting" ? (
            <div className="asset-tuner__grid">
              {[
                ["Expos", "exposure", 0.5, 1.8, 0.01],
                ["Amb", "ambient", 0, 3, 0.01],
                ["Key", "key", 0, 5, 0.01],
                ["Fill", "fill", 0, 4, 0.01],
                ["Rim", "rim", 0, 5, 0.01],
              ].map(([label, key, min, max, step]) => (
                <label key={key as string}>
                  {label as string}
                  <input type="number" step={step as number} value={transforms.lighting[key as keyof Desk3DTransforms["lighting"]]} onChange={(event) => updateLighting(key as keyof Desk3DTransforms["lighting"], Number(event.target.value))} />
                  <input type="range" min={min as number} max={max as number} step={step as number} value={transforms.lighting[key as keyof Desk3DTransforms["lighting"]]} onChange={(event) => updateLighting(key as keyof Desk3DTransforms["lighting"], Number(event.target.value))} />
                </label>
              ))}
            </div>
          ) : null}

          {mode === "shadow" ? (
            <div className="asset-tuner__grid">
              <p className="asset-tuner__hint">Editando sombra de {ASSET_LABELS[selectedAsset]}</p>
              {[
                ["3D Op", "opacity", 0, 0.9, 0.01],
                ["Hover", "hoverOpacity", 0, 0.7, 0.01],
                ["3D X", "scaleX", 0.2, 3, 0.01],
                ["3D Z", "scaleZ", 0.1, 2, 0.01],
                ["CSS Op", "contactOpacity", 0, 0.9, 0.01],
                ["CSS W", "contactWidth", 10, 90, 1],
                ["CSS H", "contactHeight", 2, 30, 1],
                ["Blur", "contactBlur", 0, 32, 1],
                ["Left", "contactLeft", -10, 80, 1],
                ["Bottom", "contactBottom", -10, 50, 1],
              ].map(([label, key, min, max, step]) => (
                <label key={key as string}>
                  {label as string}
                  <input type="number" step={step as number} value={activeShadow[key as keyof Desk3DShadowTransform]} onChange={(event) => updateShadow(key as keyof Desk3DShadowTransform, Number(event.target.value))} />
                  <input type="range" min={min as number} max={max as number} step={step as number} value={activeShadow[key as keyof Desk3DShadowTransform]} onChange={(event) => updateShadow(key as keyof Desk3DShadowTransform, Number(event.target.value))} />
                </label>
              ))}
            </div>
          ) : null}

          <button className="asset-tuner__save" type="button" onClick={handleSave} disabled={status === "saving"}>
            <Save size={16} />
            {status === "saving" ? "Guardando..." : status === "saved" ? "Guardado" : status === "error" ? "Error al guardar" : "Guardar en codigo"}
          </button>
        </div>
      ) : null}
    </div>
  );

  return createPortal(tuner, document.body);
}

export function DeskDevice3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [transforms, setTransforms] = useState(() => cloneTransforms(desk3dTransforms));
  const [selectedAsset, setSelectedAsset] = useState<Desk3DAssetId>("phone");
  const transformsRef = useRef(transforms);
  const loadedAssetsRef = useRef<Partial<Record<Desk3DAssetId, LoadedAsset>>>({});
  const sceneControlsRef = useRef<SceneControls | null>(null);
  const isDev = useMemo(() => import.meta.env.DEV, []);

  useEffect(() => {
    transformsRef.current = transforms;
    applySceneControls(sceneControlsRef.current, transforms);
    ASSET_IDS.forEach((assetId) => applyTransform(loadedAssetsRef.current[assetId], transforms.assets[assetId]));
  }, [transforms]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const assetGroup = new THREE.Group();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = transformsRef.current.lighting.exposure;
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    camera.position.set(1.72, 1.24, 6.2);
    camera.lookAt(0, 0.2, 0);

    const ambientLight = new THREE.AmbientLight(0xffd6a3, transformsRef.current.lighting.ambient);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffb35c, transformsRef.current.lighting.key);
    keyLight.position.set(-2.8, 4.2, 3.6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const deskFill = new THREE.PointLight(0xffb56b, transformsRef.current.lighting.fill, 7);
    deskFill.position.set(-2.7, 0.62, 2.35);
    scene.add(deskFill);

    const rimLight = new THREE.PointLight(0x8b5cf6, transformsRef.current.lighting.rim, 9);
    rimLight.position.set(2.8, 1.2, 2.8);
    scene.add(rimLight);

    const tableShadows: SceneControls["tableShadows"] = {};
    ASSET_IDS.forEach((assetId) => {
      const shadowTransform = transformsRef.current.shadows[assetId];
      const tableShadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.06, 64),
        new THREE.ShadowMaterial({ color: 0x100703, opacity: shadowTransform.opacity }),
      );
      tableShadow.rotation.x = -Math.PI / 2;
      tableShadow.receiveShadow = true;
      applyShadowTransform(tableShadow, transformsRef.current.assets[assetId], shadowTransform, transformsRef.current.tableY);
      scene.add(tableShadow);
      tableShadows[assetId] = tableShadow;
    });
    scene.add(assetGroup);
    sceneControlsRef.current = { renderer, ambientLight, keyLight, deskFill, rimLight, tableShadows };

    let frameId = 0;
    let alive = true;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetHover = 0;
    let hoverProgress = 0;
    let hoverPulse = 0;
    let isModelHovered = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getRenderPixelRatio());
      renderer.setSize(width, height, false);
    };

    const loader = new GLTFLoader();
    ASSET_IDS.forEach((assetId) => {
      loader.load(ASSET_URLS[assetId], (gltf) => {
        if (!alive) {
          disposeObject(gltf.scene);
          return;
        }

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxAxis = Math.max(size.x, size.y, size.z);
        const baseScale = maxAxis > 0 ? 1 / maxAxis : 1;

        model.scale.setScalar(baseScale);
        model.position.sub(center.multiplyScalar(baseScale));

        const groundedBox = new THREE.Box3().setFromObject(model);
        model.position.y += transformsRef.current.tableY - groundedBox.min.y;

        const root = new THREE.Group();
        root.add(model);
        prepareModel(assetId, model, renderer);
        assetGroup.add(root);

        const loadedAsset = { root, model, baseScale };
        loadedAssetsRef.current[assetId] = loadedAsset;
        applyTransform(loadedAsset, transformsRef.current.assets[assetId]);
      });
    });

    const getHoveredPhone = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      pointer.set(nx, -ny);
      raycaster.setFromCamera(pointer, camera);

      const phone = loadedAssetsRef.current.phone;
      const intersections = phone ? raycaster.intersectObject(phone.model, true) : [];
      return { hit: intersections.length > 0, nx, ny };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { hit, nx, ny } = getHoveredPhone(event);

      if (hit && !isModelHovered) {
        hoverPulse = 1;
      }

      isModelHovered = hit;
      targetHover = hit ? 1 : 0;
      targetTiltY = hit ? THREE.MathUtils.clamp(nx, -1, 1) * 0.08 : 0;
      targetTiltX = hit ? THREE.MathUtils.clamp(ny, -1, 1) * -0.04 : 0;
      host.style.cursor = hit ? "pointer" : "default";
    };

    const onPointerLeave = () => {
      isModelHovered = false;
      targetHover = 0;
      targetTiltX = 0;
      targetTiltY = 0;
      host.style.cursor = "default";
    };

    const render = () => {
      if (!alive) return;

      const phone = loadedAssetsRef.current.phone;
      if (phone) {
        const currentTransform = transformsRef.current.assets.phone;
        if (!reduceMotion) {
          const hoverEase = targetHover > hoverProgress ? 0.24 : 0.13;
          hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, hoverEase);
          hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.08);

          phone.root.position.y = THREE.MathUtils.lerp(phone.root.position.y, currentTransform.position[1] + hoverProgress * 0.18, 0.2);
          phone.root.rotation.y = THREE.MathUtils.lerp(
            phone.root.rotation.y,
            currentTransform.rotation[1] + targetTiltY + hoverProgress * 0.17 + hoverPulse * 0.3,
            0.18,
          );
          phone.root.rotation.x = THREE.MathUtils.lerp(phone.root.rotation.x, currentTransform.rotation[0] + targetTiltX - hoverProgress * 0.065, 0.16);
          phone.root.rotation.z = THREE.MathUtils.lerp(phone.root.rotation.z, currentTransform.rotation[2] - hoverProgress * 0.04, 0.16);

          const phoneShadow = tableShadows.phone;
          if (phoneShadow) {
            const liveShadow = transformsRef.current.shadows.phone;
            const shadowOpacity = THREE.MathUtils.lerp(liveShadow.opacity, liveShadow.hoverOpacity, hoverProgress);
            const shadowSpread = THREE.MathUtils.lerp(1, 1.12, hoverProgress);
            phoneShadow.material.opacity = shadowOpacity;
            phoneShadow.scale.set(liveShadow.scaleX * shadowSpread, 1, liveShadow.scaleZ * shadowSpread);
          }
        }
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    render();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      sceneControlsRef.current = null;
    };
  }, []);

  const updateTransform = (assetId: Desk3DAssetId, nextTransform: Desk3DAssetTransform) => {
    setTransforms((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [assetId]: nextTransform,
      },
    }));
  };

  const updateLighting = (key: keyof Desk3DTransforms["lighting"], value: number) => {
    setTransforms((current) => ({
      ...current,
      lighting: {
        ...current.lighting,
        [key]: value,
      },
    }));
  };

  const updateShadow = (assetId: Desk3DAssetId, key: keyof Desk3DShadowTransform, value: number) => {
    setTransforms((current) => ({
      ...current,
      shadows: {
        ...current.shadows,
        [assetId]: {
          ...current.shadows[assetId],
          [key]: value,
        },
      },
    }));
  };

  return (
    <div
      ref={hostRef}
      className="room-device-stage room-layer room-base-locked"
      style={{
        left: transforms.stage.left,
        bottom: transforms.stage.bottom,
        width: transforms.stage.width,
        height: transforms.stage.height,
      } as CSSProperties}
    >
      {ASSET_IDS.map((assetId) => (
        <div key={assetId} className={`device-contact-shadow device-contact-shadow--${assetId}`} style={getContactShadowStyle(transforms.shadows[assetId])} />
      ))}
      {isDev ? (
        <AssetTuner selectedAsset={selectedAsset} transforms={transforms} onSelectAsset={setSelectedAsset} onChangeTransform={updateTransform} onChangeLighting={updateLighting} onChangeShadow={updateShadow} />
      ) : null}
    </div>
  );
}
