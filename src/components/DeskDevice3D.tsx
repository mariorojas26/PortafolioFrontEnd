import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GripHorizontal, Save, SlidersHorizontal } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { desk3dTransforms, type Desk3DAssetId, type Desk3DAssetTransform, type Desk3DTransforms } from "../data/desk3dTransforms";

const ASSET_URLS: Record<Desk3DAssetId, string> = {
  stand: "/assets/3d/mobile__cell_phone_stand.glb",
  phone: "/assets/3d/iphone_16.glb",
};

const ASSET_LABELS: Record<Desk3DAssetId, string> = {
  stand: "Base",
  phone: "Telefono",
};

const ASSET_IDS: Desk3DAssetId[] = ["stand", "phone"];

type LoadedAsset = {
  root: THREE.Group;
  model: THREE.Object3D;
  baseScale: number;
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
    assets: {
      stand: {
        position: [...source.assets.stand.position],
        rotation: [...source.assets.stand.rotation],
        scale: source.assets.stand.scale,
      },
      phone: {
        position: [...source.assets.phone.position],
        rotation: [...source.assets.phone.rotation],
        scale: source.assets.phone.scale,
      },
    },
  };
}

function applyTransform(asset: LoadedAsset | undefined, transform: Desk3DAssetTransform) {
  if (!asset) return;

  asset.root.position.set(transform.position[0], transform.position[1], transform.position[2]);
  asset.root.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
  asset.root.scale.setScalar(asset.baseScale * transform.scale);
}

function prepareModel(model: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const texturedMaterial = material as THREE.MeshStandardMaterial;
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

function AssetTuner({
  selectedAsset,
  transforms,
  onSelectAsset,
  onChangeTransform,
}: {
  selectedAsset: Desk3DAssetId;
  transforms: Desk3DTransforms;
  onSelectAsset: (assetId: Desk3DAssetId) => void;
  onChangeTransform: (assetId: Desk3DAssetId, transform: Desk3DAssetTransform) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeTransform = transforms.assets[selectedAsset];

  const updateTuple = (key: "position" | "rotation", index: number, value: number) => {
    const tuple = [...activeTransform[key]] as [number, number, number];
    tuple[index] = value;
    onChangeTransform(selectedAsset, { ...activeTransform, [key]: tuple });
  };

  const updateScale = (value: number) => {
    onChangeTransform(selectedAsset, { ...activeTransform, scale: value });
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
          </div>

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
  const selectedAssetRef = useRef(selectedAsset);
  const loadedAssetsRef = useRef<Partial<Record<Desk3DAssetId, LoadedAsset>>>({});
  const isDev = useMemo(() => import.meta.env.DEV, []);

  useEffect(() => {
    selectedAssetRef.current = selectedAsset;
  }, [selectedAsset]);

  useEffect(() => {
    transformsRef.current = transforms;
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
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    camera.position.set(1.72, 1.24, 6.2);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.AmbientLight(0xffd6a3, 1.45));

    const keyLight = new THREE.DirectionalLight(0xffb35c, 3.2);
    keyLight.position.set(-2.8, 4.2, 3.6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x8b5cf6, 2.3, 9);
    rimLight.position.set(2.8, 1.2, 2.8);
    scene.add(rimLight);

    const tableShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.22, 64),
      new THREE.ShadowMaterial({ color: 0x030103, opacity: 0.68 }),
    );
    tableShadow.rotation.x = -Math.PI / 2;
    tableShadow.position.set(-0.28, transformsRef.current.tableY - 0.01, 0.04);
    tableShadow.scale.set(1.48, 1, 0.5);
    tableShadow.receiveShadow = true;
    scene.add(tableShadow);
    scene.add(assetGroup);

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
        prepareModel(model, renderer);
        assetGroup.add(root);

        const loadedAsset = { root, model, baseScale };
        loadedAssetsRef.current[assetId] = loadedAsset;
        applyTransform(loadedAsset, transformsRef.current.assets[assetId]);
      });
    });

    const getHoveredAsset = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      pointer.set(nx, -ny);
      raycaster.setFromCamera(pointer, camera);

      const selected = loadedAssetsRef.current[selectedAssetRef.current];
      const intersections = selected ? raycaster.intersectObject(selected.model, true) : [];
      return { hit: intersections.length > 0, nx, ny };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { hit, nx, ny } = getHoveredAsset(event);

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

      const selectedAssetId = selectedAssetRef.current;
      const selected = loadedAssetsRef.current[selectedAssetId];
      if (selected) {
        const currentTransform = transformsRef.current.assets[selectedAssetId];
        if (!reduceMotion) {
          const hoverEase = targetHover > hoverProgress ? 0.24 : 0.13;
          hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, hoverEase);
          hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.08);

          selected.root.position.y = THREE.MathUtils.lerp(selected.root.position.y, currentTransform.position[1] + hoverProgress * 0.18, 0.2);
          selected.root.rotation.y = THREE.MathUtils.lerp(
            selected.root.rotation.y,
            currentTransform.rotation[1] + targetTiltY + hoverProgress * 0.17 + hoverPulse * 0.3,
            0.18,
          );
          selected.root.rotation.x = THREE.MathUtils.lerp(selected.root.rotation.x, currentTransform.rotation[0] + targetTiltX - hoverProgress * 0.065, 0.16);
          selected.root.rotation.z = THREE.MathUtils.lerp(selected.root.rotation.z, currentTransform.rotation[2] - hoverProgress * 0.04, 0.16);

          const shadowOpacity = THREE.MathUtils.lerp(0.68, 0.3, hoverProgress);
          const shadowSpread = THREE.MathUtils.lerp(1, 1.24, hoverProgress);
          (tableShadow.material as THREE.ShadowMaterial).opacity = shadowOpacity;
          tableShadow.scale.set(1.48 * shadowSpread, 1, 0.5 * shadowSpread);
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

  return (
    <div
      ref={hostRef}
      className="room-device-stage room-layer room-base-locked"
      style={{
        left: transforms.stage.left,
        bottom: transforms.stage.bottom,
        width: transforms.stage.width,
        height: transforms.stage.height,
      }}
    >
      {isDev ? (
        <AssetTuner selectedAsset={selectedAsset} transforms={transforms} onSelectAsset={setSelectedAsset} onChangeTransform={updateTransform} />
      ) : null}
    </div>
  );
}
