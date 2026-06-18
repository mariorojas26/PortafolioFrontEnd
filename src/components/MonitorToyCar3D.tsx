import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { desk3dTransforms, type Desk3DAssetTransform, type Desk3DTransforms } from "../data/desk3dTransforms";

const CAR_URL = "/assets/3d/toyota_gr_supra.glb";
const TABLE_Y = -0.52;
const DESK_TRANSFORMS_CHANGE_EVENT = "desk3d-transforms-change";

type LoadedCar = {
  root: THREE.Group;
  model: THREE.Object3D;
  silhouetteRoot: THREE.Group;
  silhouetteMaterials: THREE.MeshBasicMaterial[];
};

type GltfTextureParser = {
  getDependency: (type: "texture", index: number) => Promise<THREE.Texture>;
};

function getRenderPixelRatio() {
  return Math.min(Math.max(window.devicePixelRatio * 1.8, 2.8), 4);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function applyCarTransform(car: LoadedCar | null, transform: Desk3DAssetTransform) {
  if (!car) return;

  car.root.position.set(transform.position[0], transform.position[1], transform.position[2]);
  car.root.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
  car.root.scale.setScalar(transform.scale);
  car.silhouetteRoot.position.set(transform.position[0] + 0.015, transform.position[1] - 0.018, transform.position[2] + 0.045);
  car.silhouetteRoot.rotation.set(transform.rotation[0] - 0.025, transform.rotation[1], transform.rotation[2] - 0.012);
  car.silhouetteRoot.scale.setScalar(transform.scale);
}

function createCarSilhouette(model: THREE.Object3D) {
  const materials: THREE.MeshBasicMaterial[] = [];

  const createLayer = (opacity: number, spread: number, yOffset: number, layer: "soft" | "core") => {
    const silhouette = model.clone(true);

    silhouette.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        depthWrite: false,
        opacity,
        transparent: true,
      });
      material.userData.shadowLayer = layer;
      materials.push(material);
      child.castShadow = false;
      child.receiveShadow = false;
      child.renderOrder = -2;
      child.material = material;
    });

    silhouette.scale.x *= spread;
    silhouette.scale.y *= 0.035;
    silhouette.scale.z *= spread;
    silhouette.position.y -= yOffset;
    return silhouette;
  };

  const softLayer = createLayer(0.18, 1.13, 0.02, "soft");
  const coreLayer = createLayer(0.58, 1.02, 0.012, "core");

  const root = new THREE.Group();
  root.add(softLayer, coreLayer);
  return { root, materials };
}

function applySilhouetteHover(car: LoadedCar, transform: Desk3DAssetTransform, hoverProgress: number) {
  const spread = 1 + hoverProgress * 0.06;
  const coreOpacity = THREE.MathUtils.lerp(0.58, 0.5, hoverProgress);
  const softOpacity = THREE.MathUtils.lerp(0.18, 0.23, hoverProgress);

  car.silhouetteMaterials.forEach((material, index) => {
    material.opacity = material.userData.shadowLayer === "soft" ? softOpacity : coreOpacity;
    material.needsUpdate = true;
  });

  car.silhouetteRoot.position.x = THREE.MathUtils.lerp(car.silhouetteRoot.position.x, transform.position[0] + 0.015, 0.32);
  car.silhouetteRoot.position.y = THREE.MathUtils.lerp(car.silhouetteRoot.position.y, transform.position[1] - 0.018, 0.32);
  car.silhouetteRoot.position.z = THREE.MathUtils.lerp(car.silhouetteRoot.position.z, transform.position[2] + 0.045, 0.32);
  car.silhouetteRoot.rotation.x = THREE.MathUtils.lerp(car.silhouetteRoot.rotation.x, transform.rotation[0] - 0.025, 0.26);
  car.silhouetteRoot.rotation.y = THREE.MathUtils.lerp(car.silhouetteRoot.rotation.y, transform.rotation[1], 0.24);
  car.silhouetteRoot.rotation.z = THREE.MathUtils.lerp(car.silhouetteRoot.rotation.z, transform.rotation[2] - 0.012, 0.24);
  car.silhouetteRoot.scale.set(transform.scale * spread, transform.scale, transform.scale * spread);
}

async function prepareModel(model: THREE.Object3D, renderer: THREE.WebGLRenderer, parser: GltfTextureParser) {
  const texturePromises: Promise<void>[] = [];

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      const standardMaterial = material as THREE.MeshStandardMaterial;
      standardMaterial.needsUpdate = true;
      standardMaterial.toneMapped = true;

      const specGloss = standardMaterial.userData?.gltfExtensions?.KHR_materials_pbrSpecularGlossiness as
        | {
            diffuseFactor?: [number, number, number, number];
            diffuseTexture?: { index: number };
            specularGlossinessTexture?: { index: number };
            glossinessFactor?: number;
          }
        | undefined;

      if (specGloss?.diffuseFactor) {
        standardMaterial.color.setRGB(specGloss.diffuseFactor[0], specGloss.diffuseFactor[1], specGloss.diffuseFactor[2]);
        standardMaterial.opacity = specGloss.diffuseFactor[3] ?? 1;
        standardMaterial.transparent = standardMaterial.opacity < 1 || standardMaterial.transparent;
      }

      if (typeof specGloss?.glossinessFactor === "number") {
        standardMaterial.roughness = THREE.MathUtils.clamp(1 - specGloss.glossinessFactor, 0.08, 1);
      }

      if (specGloss?.diffuseTexture) {
        texturePromises.push(
          parser.getDependency("texture", specGloss.diffuseTexture.index).then((texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            standardMaterial.map = texture;
            standardMaterial.color.set(0xffffff);
            standardMaterial.needsUpdate = true;
          }),
        );
      }

      const useSpecGlossAsPaintMap =
        !specGloss?.diffuseTexture &&
        specGloss?.specularGlossinessTexture &&
        /paint$/i.test(standardMaterial.name);

      if (useSpecGlossAsPaintMap && specGloss?.specularGlossinessTexture) {
        const paintTextureIndex = specGloss.specularGlossinessTexture.index;
        texturePromises.push(
          parser.getDependency("texture", paintTextureIndex).then((texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            standardMaterial.map = texture;
            standardMaterial.color.set(0xffffff);
            standardMaterial.metalness = 0.05;
            standardMaterial.roughness = 0.34;
            standardMaterial.needsUpdate = true;
          }),
        );
      }

      if (standardMaterial.map) {
        standardMaterial.color?.set(0xffffff);
      }

      [
        standardMaterial.map,
        standardMaterial.emissiveMap,
      ].forEach((texture) => {
        if (!texture) return;
        texture.colorSpace = THREE.SRGBColorSpace;
      });

      [
        standardMaterial.map,
        standardMaterial.normalMap,
        standardMaterial.roughnessMap,
        standardMaterial.metalnessMap,
        standardMaterial.aoMap,
        standardMaterial.emissiveMap,
      ].forEach((texture) => {
        if (!texture) return;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      });
    });
  });

  await Promise.all(texturePromises);
}

export function MonitorToyCar3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const loadedCarRef = useRef<LoadedCar | null>(null);
  const transformRef = useRef<Desk3DAssetTransform>(desk3dTransforms.assets.car);
  const [carHintVisible, setCarHintVisible] = useState(false);
  const [carIntroActive, setCarIntroActive] = useState(false);
  const carHintVisibleRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    camera.position.set(1.95, 1.15, 5.4);
    camera.lookAt(0, -0.08, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.05));

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.3);
    keyLight.position.set(-3.8, 5.8, 3.3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.radius = 9;
    keyLight.shadow.camera.left = -2;
    keyLight.shadow.camera.right = 2;
    keyLight.shadow.camera.top = 2;
    keyLight.shadow.camera.bottom = -2;
    keyLight.shadow.bias = -0.00022;
    keyLight.shadow.normalBias = 0.014;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.75, 6);
    fillLight.position.set(-2.6, 0.4, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x9b7cff, 0.25, 6);
    rimLight.position.set(2.4, 0.9, 2.2);
    scene.add(rimLight);

    let alive = true;
    let frameId = 0;
    let targetHover = 0;
    let targetProximity = 0;
    let hoverProgress = 0;
    let proximityProgress = 0;
    let hoverPulse = 0;
    let introPulse = 0;
    let isCarHovered = false;
    let isCarNear = false;

    const setCarHint = (visible: boolean) => {
      if (carHintVisibleRef.current === visible) return;
      carHintVisibleRef.current = visible;
      setCarHintVisible(visible);
    };

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
    loader.load(CAR_URL, async (gltf) => {
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
      const normalizedScale = maxAxis > 0 ? 1 / maxAxis : 1;
      model.scale.setScalar(normalizedScale);
      model.position.sub(center.multiplyScalar(normalizedScale));

      const groundedBox = new THREE.Box3().setFromObject(model);
      model.position.y += TABLE_Y - groundedBox.min.y;

      const root = new THREE.Group();
      const { root: silhouetteRoot, materials: silhouetteMaterials } = createCarSilhouette(model);
      root.add(model);
      applyCarTransform({ root, model, silhouetteRoot, silhouetteMaterials }, transformRef.current);

      await prepareModel(model, renderer, gltf.parser);
      if (!alive) {
        disposeObject(gltf.scene);
        return;
      }
      scene.add(silhouetteRoot);
      scene.add(root);
      loadedCarRef.current = {
        root,
        model,
        silhouetteRoot,
        silhouetteMaterials,
      };
    });

    const onTransformsChange = (event: Event) => {
      const nextTransforms = (event as CustomEvent<Desk3DTransforms>).detail;
      if (!nextTransforms?.assets?.car) return;

      transformRef.current = nextTransforms.assets.car;
      applyCarTransform(loadedCarRef.current, transformRef.current);
    };

    const getHoveredCar = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const localX = (event.clientX - rect.left) / rect.width;
      const localY = (event.clientY - rect.top) / rect.height;
      pointer.set(nx, -ny);
      raycaster.setFromCamera(pointer, camera);

      const car = loadedCarRef.current;
      const intersections = car ? raycaster.intersectObject(car.model, true) : [];
      const visualNearArea = localX > 0.14 && localX < 0.86 && localY > 0.22 && localY < 0.78;
      let near = intersections.length > 0 || visualNearArea;

      if (car && !near) {
        const center = new THREE.Vector3();
        car.root.getWorldPosition(center);
        center.project(camera);
        const carX = (center.x * 0.5 + 0.5) * rect.width;
        const carY = (-center.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(event.clientX - rect.left - carX, event.clientY - rect.top - carY);
        const nearRadius = THREE.MathUtils.clamp(rect.width * 0.26, 58, 96);
        near = distance < nearRadius;
      }

      return { hit: intersections.length > 0, near };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { hit, near } = getHoveredCar(event);
      if (hit && !isCarHovered) {
        hoverPulse = 1;
      }
      isCarHovered = hit;
      isCarNear = near;
      targetHover = hit ? 1 : 0;
      targetProximity = near ? 1 : 0;
      host.style.cursor = hit || near ? "pointer" : "default";
    };

    const onPointerLeave = () => {
      isCarHovered = false;
      isCarNear = false;
      targetHover = 0;
      targetProximity = 0;
      host.style.cursor = "default";
    };

    const render = () => {
      if (!alive) return;

      const car = loadedCarRef.current;
      if (car && !reduceMotion) {
        const currentTransform = transformRef.current;
        hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, targetHover > hoverProgress ? 0.28 : 0.16);
        proximityProgress = THREE.MathUtils.lerp(proximityProgress, targetProximity, targetProximity > proximityProgress ? 0.2 : 0.12);
        hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.12);
        introPulse = Math.max(0, introPulse - 0.018);
        const proximityHop = Math.sin(proximityProgress * Math.PI) * 0.045;
        const introHop = Math.sin((1 - introPulse) * Math.PI * 2) * introPulse * 0.075;
        const hop = Math.sin(hoverProgress * Math.PI) * 0.16 + proximityHop + hoverPulse * 0.085 + introHop;
        car.root.position.x = THREE.MathUtils.lerp(car.root.position.x, currentTransform.position[0], 0.32);
        car.root.position.y = THREE.MathUtils.lerp(car.root.position.y, currentTransform.position[1] + hop, 0.32);
        car.root.position.z = THREE.MathUtils.lerp(car.root.position.z, currentTransform.position[2], 0.32);
        car.root.rotation.x = THREE.MathUtils.lerp(car.root.rotation.x, currentTransform.rotation[0] - hoverProgress * 0.07 - proximityProgress * 0.025, 0.26);
        car.root.rotation.y = THREE.MathUtils.lerp(car.root.rotation.y, currentTransform.rotation[1] + hoverProgress * 0.24 + proximityProgress * 0.06 + hoverPulse * 0.2 + introHop * 0.8, 0.24);
        car.root.rotation.z = THREE.MathUtils.lerp(car.root.rotation.z, currentTransform.rotation[2] + hoverProgress * 0.06 + proximityProgress * 0.025, 0.24);
        car.root.scale.setScalar(THREE.MathUtils.lerp(car.root.scale.x, currentTransform.scale, 0.26));
        applySilhouetteHover(car, currentTransform, hoverProgress);
        setCarHint(isCarNear || proximityProgress > 0.12 || hoverProgress > 0.08 || introPulse > 0.06);
      } else if (car) {
        setCarHint(isCarNear);
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
    window.addEventListener(DESK_TRANSFORMS_CHANGE_EVENT, onTransformsChange);
    let introReleaseTimer = 0;
    const introTimer = window.setTimeout(() => {
      introPulse = reduceMotion ? 0 : 1;
      setCarIntroActive(true);
      setCarHint(true);
      introReleaseTimer = window.setTimeout(() => {
        setCarIntroActive(false);
        if (!isCarNear) setCarHint(false);
      }, 1450);
    }, 1120);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(introTimer);
      window.clearTimeout(introReleaseTimer);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener(DESK_TRANSFORMS_CHANGE_EVENT, onTransformsChange);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      loadedCarRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`room-toy-car-stage room-layer room-base-locked ${carHintVisible ? "is-car-near" : ""} ${carIntroActive ? "is-intro-pulsing" : ""}`}
      aria-label="Carro Toyota GR Supra de juguete en 3D"
    >
      <div className="toy-car-action-glow" aria-hidden="true" />
      <div className="object-action-label object-action-label--car" aria-hidden="true">
        Proyectos
      </div>
    </div>
  );
}
