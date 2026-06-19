import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GripHorizontal, Save, SlidersHorizontal } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { desk3dTransforms, type Desk3DAssetId, type Desk3DAssetTransform, type Desk3DShadowTransform, type Desk3DTransforms } from "../data/desk3dTransforms";

const DESK_TRANSFORMS_CHANGE_EVENT = "desk3d-transforms-change";

declare global {
  interface Window {
    __desk3dDebug?: {
      getRealShadow: () => {
        opacity: number;
        radius: number;
        bias: number;
        normalBias: number;
      };
    };
  }
}

type DeviceAssetId = Exclude<Desk3DAssetId, "car" | "trophy">;

const ASSET_URLS: Record<DeviceAssetId, string> = {
  stand: "/assets/3d/mobile__cell_phone_stand.glb",
  phone: "/assets/3d/iphone_16.glb",
};

const ASSET_LABELS: Record<Desk3DAssetId, string> = {
  stand: "Base",
  phone: "Telefono",
  car: "Carro Supra",
  trophy: "Trofeo VTEX",
};

const DEVICE_ASSET_IDS: DeviceAssetId[] = ["stand", "phone"];
const TUNER_ASSET_IDS: Desk3DAssetId[] = ["stand", "phone", "car", "trophy"];
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
  deskShadowReceiver: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
};

function getRenderPixelRatio() {
  return Math.min(Math.max(window.devicePixelRatio * 1.25, 1.75), 2.65);
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
      car: { ...source.shadows.car },
      trophy: { ...source.shadows.trophy },
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
      car: {
        position: [...source.assets.car.position],
        rotation: [...source.assets.car.rotation],
        scale: source.assets.car.scale,
        color: source.assets.car.color,
      },
      trophy: {
        position: [...source.assets.trophy.position],
        rotation: [...source.assets.trophy.rotation],
        scale: source.assets.trophy.scale,
        color: source.assets.trophy.color,
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

function applySceneControls(controls: SceneControls | null, transforms: Desk3DTransforms) {
  if (!controls) return;

  controls.renderer.toneMappingExposure = transforms.lighting.exposure;
  controls.ambientLight.intensity = transforms.lighting.ambient;
  controls.keyLight.intensity = transforms.lighting.key;
  controls.deskFill.intensity = transforms.lighting.fill;
  controls.rimLight.intensity = transforms.lighting.rim;
  controls.keyLight.shadow.radius = transforms.shadows.phone.contactBlur;
  controls.keyLight.shadow.bias = transforms.shadows.phone.contactLeft / 100000;
  controls.keyLight.shadow.normalBias = transforms.shadows.phone.contactBottom / 1000;
  controls.deskShadowReceiver.material.opacity = transforms.shadows.phone.opacity;
  controls.deskShadowReceiver.position.y = transforms.tableY - 0.018;
  controls.deskShadowReceiver.material.needsUpdate = true;
}

function prepareModel(assetId: DeviceAssetId, model: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = assetId === "phone";
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materials.map((material) => {
      const texturedMaterial = material as THREE.MeshStandardMaterial;
      texturedMaterial.needsUpdate = true;

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

      if (assetId === "stand") {
        return new THREE.MeshStandardMaterial({
          color: texturedMaterial.color ?? new THREE.Color(0xe9c982),
          map: null,
          transparent: false,
          opacity: 1,
          alphaTest: 0,
          depthWrite: true,
          roughness: 0.82,
          metalness: 0.08,
          emissive: new THREE.Color(0x2a1607),
          emissiveIntensity: 0.04,
          side: texturedMaterial.side,
        });
      }

      return material;
    });

    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
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
  const [isOpen, setIsOpen] = useState(false);
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

          <div className="asset-tuner__tabs">
            {TUNER_ASSET_IDS.map((assetId) => (
              <button key={assetId} type="button" className={assetId === selectedAsset ? "is-active" : ""} onClick={() => onSelectAsset(assetId)}>
                {ASSET_LABELS[assetId]}
              </button>
            ))}
          </div>

          {mode === "assets" ? (
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
              {selectedAsset !== "car" && selectedAsset !== "trophy" ? (
                <label className="asset-tuner__color-row">
                  Color
                  <input type="color" value={activeTransform.color} onChange={(event) => updateColor(event.target.value)} />
                  <input type="text" value={activeTransform.color} onChange={(event) => updateColor(event.target.value)} />
                </label>
              ) : selectedAsset === "trophy" ? (
                <p className="asset-tuner__hint">Color bloqueado para conservar el material VTEX del trofeo.</p>
              ) : (
                <p className="asset-tuner__hint">Color bloqueado para conservar la livery del Supra.</p>
              )}
            </div>
          ) : null}

          {mode === "lighting" ? (
            <div className="asset-tuner__grid">
              <p className="asset-tuner__hint">Luz general de la escena del celular y la base.</p>
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
              <p className="asset-tuner__hint">Sombra individual de {ASSET_LABELS[selectedAsset]}.</p>
              {([
                ["3D Op", "opacity", 0, 0.9, 0.01],
                ["Hover", "hoverOpacity", 0, 0.7, 0.01],
                ["3D X", "scaleX", 0.2, 3, 0.01],
                ["3D Z", "scaleZ", 0.1, 2, 0.01],
                ["CSS Op", "contactOpacity", 0, 0.9, 0.01],
                ["CSS W", "contactWidth", 10, 120, 1],
                ["CSS H", "contactHeight", 2, 36, 1],
                ["Blur", "contactBlur", 0, 32, 1],
                ["Left", "contactLeft", -80, 90, 1],
                ["Bottom", "contactBottom", -30, 70, 1],
              ] as const).map(([label, key, min, max, step]) => (
                <label key={key}>
                  {label}
                  <input type="number" step={step} value={activeShadow[key]} onChange={(event) => updateShadow(key, Number(event.target.value))} />
                  <input type="range" min={min} max={max} step={step} value={activeShadow[key]} onChange={(event) => updateShadow(key, Number(event.target.value))} />
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
  const [selectedAsset, setSelectedAsset] = useState<Desk3DAssetId>("car");
  const [phoneHintVisible, setPhoneHintVisible] = useState(false);
  const [phoneIntroActive, setPhoneIntroActive] = useState(false);
  const transformsRef = useRef(transforms);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const loadedAssetsRef = useRef<Partial<Record<DeviceAssetId, LoadedAsset>>>({});
  const sceneControlsRef = useRef<SceneControls | null>(null);
  const phoneHintVisibleRef = useRef(false);
  const isDev = useMemo(() => import.meta.env.DEV, []);

  useEffect(() => {
    transformsRef.current = transforms;
    applySceneControls(sceneControlsRef.current, transforms);
    DEVICE_ASSET_IDS.forEach((assetId) => applyTransform(loadedAssetsRef.current[assetId], transforms.assets[assetId]));
    window.dispatchEvent(new CustomEvent<Desk3DTransforms>(DESK_TRANSFORMS_CHANGE_EVENT, { detail: transforms }));
    requestRenderRef.current?.();
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
    keyLight.position.set(-3.8, 6.1, 3.35);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.radius = transformsRef.current.shadows.phone.contactBlur;
    keyLight.shadow.camera.left = -3.2;
    keyLight.shadow.camera.right = 3.2;
    keyLight.shadow.camera.top = 3.2;
    keyLight.shadow.camera.bottom = -3.2;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.bias = transformsRef.current.shadows.phone.contactLeft / 100000;
    keyLight.shadow.normalBias = transformsRef.current.shadows.phone.contactBottom / 1000;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const deskFill = new THREE.PointLight(0xffb56b, transformsRef.current.lighting.fill, 7);
    deskFill.position.set(-2.7, 0.62, 2.35);
    scene.add(deskFill);

    const rimLight = new THREE.PointLight(0x8b5cf6, transformsRef.current.lighting.rim, 9);
    rimLight.position.set(2.8, 1.2, 2.8);
    scene.add(rimLight);

    const deskShadowReceiver = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.6),
      new THREE.ShadowMaterial({
        color: 0x1a0702,
        opacity: transformsRef.current.shadows.phone.opacity,
        transparent: true,
      }),
    );
    deskShadowReceiver.rotation.x = -Math.PI / 2;
    deskShadowReceiver.position.set(-0.18, transformsRef.current.tableY - 0.018, 0.48);
    deskShadowReceiver.receiveShadow = true;
    scene.add(deskShadowReceiver);
    scene.add(assetGroup);
    sceneControlsRef.current = { renderer, ambientLight, keyLight, deskFill, rimLight, deskShadowReceiver };
    if (import.meta.env.DEV) {
      window.__desk3dDebug = {
        getRealShadow: () => ({
          opacity: deskShadowReceiver.material.opacity,
          radius: keyLight.shadow.radius,
          bias: keyLight.shadow.bias,
          normalBias: keyLight.shadow.normalBias,
        }),
      };
    }

    let frameId = 0;
    let alive = true;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetHover = 0;
    let targetProximity = 0;
    let hoverProgress = 0;
    let proximityProgress = 0;
    let hoverPulse = 0;
    let introPulse = 0;
    let isModelHovered = false;
    let isPhoneNear = false;

    const setPhoneHint = (visible: boolean) => {
      if (phoneHintVisibleRef.current === visible) return;
      phoneHintVisibleRef.current = visible;
      setPhoneHintVisible(visible);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getRenderPixelRatio());
      renderer.setSize(width, height, false);
      requestRender();
    };

    const loader = new GLTFLoader();
    DEVICE_ASSET_IDS.forEach((assetId) => {
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
        requestRender();
      });
    });

    const getHoveredPhone = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const localX = (event.clientX - rect.left) / rect.width;
      const localY = (event.clientY - rect.top) / rect.height;

      pointer.set(nx, -ny);
      raycaster.setFromCamera(pointer, camera);

      const phone = loadedAssetsRef.current.phone;
      const intersections = phone ? raycaster.intersectObject(phone.model, true) : [];
      const visualNearArea = localX > 0.28 && localX < 0.6 && localY > 0.16 && localY < 0.8;
      let near = intersections.length > 0 || visualNearArea;

      if (phone && !near) {
        const center = new THREE.Vector3();
        phone.root.getWorldPosition(center);
        center.project(camera);
        const phoneX = (center.x * 0.5 + 0.5) * rect.width;
        const phoneY = (-center.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(event.clientX - rect.left - phoneX, event.clientY - rect.top - phoneY);
        const nearRadius = THREE.MathUtils.clamp(rect.width * 0.16, 90, 155);
        near = distance < nearRadius;
      }

      return { hit: intersections.length > 0, near, nx, ny };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { hit, near, nx, ny } = getHoveredPhone(event);

      if (hit && !isModelHovered) {
        hoverPulse = 1;
      }

      isModelHovered = hit;
      isPhoneNear = near;
      targetHover = hit ? 1 : 0;
      targetProximity = near ? 1 : 0;
      targetTiltY = hit ? THREE.MathUtils.clamp(nx, -1, 1) * 0.08 : 0;
      targetTiltX = hit ? THREE.MathUtils.clamp(ny, -1, 1) * -0.04 : 0;
      host.style.cursor = hit || near ? "pointer" : "default";
      requestRender();
    };

    const onPointerLeave = () => {
      isModelHovered = false;
      isPhoneNear = false;
      targetHover = 0;
      targetProximity = 0;
      targetTiltX = 0;
      targetTiltY = 0;
      host.style.cursor = "default";
      requestRender();
    };

    const render = () => {
      if (!alive) return;

      frameId = 0;
      let shouldContinue = false;
      const phone = loadedAssetsRef.current.phone;
      if (phone) {
        const currentTransform = transformsRef.current.assets.phone;
        if (!reduceMotion) {
          const hoverEase = targetHover > hoverProgress ? 0.24 : 0.13;
          hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, hoverEase);
          proximityProgress = THREE.MathUtils.lerp(proximityProgress, targetProximity, targetProximity > proximityProgress ? 0.2 : 0.12);
          hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.08);
          introPulse = Math.max(0, introPulse - 0.018);
          const introBounce = Math.sin((1 - introPulse) * Math.PI * 2) * introPulse * 0.07;
          const proximityLift = proximityProgress * 0.045;

          const targetY = currentTransform.position[1] + hoverProgress * 0.18 + proximityLift + introBounce;
          const targetRotY = currentTransform.rotation[1] + targetTiltY + hoverProgress * 0.17 + proximityProgress * 0.045 + hoverPulse * 0.3 + introBounce * 0.7;
          const targetRotX = currentTransform.rotation[0] + targetTiltX - hoverProgress * 0.065 - proximityProgress * 0.018;
          const targetRotZ = currentTransform.rotation[2] - hoverProgress * 0.04;

          phone.root.position.y = THREE.MathUtils.lerp(phone.root.position.y, targetY, 0.2);
          phone.root.rotation.y = THREE.MathUtils.lerp(
            phone.root.rotation.y,
            targetRotY,
            0.18,
          );
          phone.root.rotation.x = THREE.MathUtils.lerp(phone.root.rotation.x, targetRotX, 0.16);
          phone.root.rotation.z = THREE.MathUtils.lerp(phone.root.rotation.z, targetRotZ, 0.16);

          setPhoneHint(isPhoneNear || proximityProgress > 0.12 || hoverProgress > 0.08 || introPulse > 0.06);
          shouldContinue =
            Math.abs(hoverProgress - targetHover) > 0.003 ||
            Math.abs(proximityProgress - targetProximity) > 0.003 ||
            hoverPulse > 0.003 ||
            introPulse > 0.003 ||
            Math.abs(phone.root.position.y - targetY) > 0.003 ||
            Math.abs(phone.root.rotation.x - targetRotX) > 0.003 ||
            Math.abs(phone.root.rotation.y - targetRotY) > 0.003 ||
            Math.abs(phone.root.rotation.z - targetRotZ) > 0.003;
        } else {
          setPhoneHint(isPhoneNear);
        }
      }

      renderer.render(scene, camera);
      if (alive && shouldContinue) {
        requestRender();
      }
    };

    function requestRender() {
      if (!alive || frameId) return;
      frameId = window.requestAnimationFrame(render);
    }

    resize();
    requestRenderRef.current = requestRender;
    requestRender();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    let introReleaseTimer = 0;
    const introTimer = window.setTimeout(() => {
      introPulse = reduceMotion ? 0 : 1;
      setPhoneIntroActive(true);
      setPhoneHint(true);
      requestRender();
      introReleaseTimer = window.setTimeout(() => {
        setPhoneIntroActive(false);
        if (!isPhoneNear) setPhoneHint(false);
        requestRender();
      }, 1450);
    }, 1000);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      requestRenderRef.current = null;
      window.clearTimeout(introTimer);
      window.clearTimeout(introReleaseTimer);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      sceneControlsRef.current = null;
      if (import.meta.env.DEV) {
        delete window.__desk3dDebug;
      }
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
      className={`room-device-stage room-layer ${phoneHintVisible ? "is-phone-near" : ""} ${phoneIntroActive ? "is-intro-pulsing" : ""}`}
      style={{
        left: transforms.stage.left,
        bottom: transforms.stage.bottom,
        width: transforms.stage.width,
        height: transforms.stage.height,
      } as CSSProperties}
    >
      {DEVICE_ASSET_IDS.map((assetId) => (
        <div key={assetId} className={`device-contact-shadow device-contact-shadow--${assetId}`} style={getContactShadowStyle(transforms.shadows[assetId])} />
      ))}
      <div className="device-phone-screen-wake" aria-hidden="true" />
      <div className="object-action-label object-action-label--phone" aria-hidden="true">
        Contacto
      </div>
      {isDev ? (
        <AssetTuner
          selectedAsset={selectedAsset}
          transforms={transforms}
          onSelectAsset={setSelectedAsset}
          onChangeTransform={updateTransform}
          onChangeLighting={updateLighting}
          onChangeShadow={updateShadow}
        />
      ) : null}
    </div>
  );
}
