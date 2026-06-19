import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { desk3dTransforms, type Desk3DAssetTransform, type Desk3DShadowTransform, type Desk3DTransforms } from "../data/desk3dTransforms";

const TROPHY_URL = "/assets/3d/trofeoVTEX.glb";
const DESK_TRANSFORMS_CHANGE_EVENT = "desk3d-transforms-change";
const TABLE_Y = -0.62;
const TROPHY_INTERACTION_ENABLED = false;

type LoadedTrophy = {
  root: THREE.Group;
  model: THREE.Object3D;
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.ShadowMaterial>;
  glow: THREE.PointLight;
  glowMaterials: THREE.MeshStandardMaterial[];
};

function getTrophyShadowStyle(shadow: Desk3DShadowTransform) {
  return {
    "--trophy-shadow-opacity": shadow.contactOpacity,
    "--trophy-shadow-width": `${shadow.contactWidth}%`,
    "--trophy-shadow-height": `${shadow.contactHeight}%`,
    "--trophy-shadow-blur": `${shadow.contactBlur}px`,
    "--trophy-shadow-left": `${shadow.contactLeft}%`,
    "--trophy-shadow-bottom": `${shadow.contactBottom}%`,
  } as CSSProperties;
}

function applyTrophyTransform(trophy: LoadedTrophy | null, transform: Desk3DAssetTransform, shadow: Desk3DShadowTransform) {
  if (!trophy) return;

  trophy.root.position.set(transform.position[0], transform.position[1], transform.position[2]);
  trophy.root.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
  trophy.root.scale.setScalar(transform.scale);
  trophy.shadow.position.set(transform.position[0] + 0.02, TABLE_Y - 0.012, transform.position[2] + 0.06);
  trophy.shadow.scale.set(shadow.scaleX, shadow.scaleZ, 1);
  trophy.shadow.material.opacity = shadow.opacity;
  trophy.glow.color.set(transform.color);
  trophy.glowMaterials.forEach((material) => {
    material.emissive?.set(transform.color);
    material.needsUpdate = true;
  });
}

function getRenderPixelRatio() {
  return Math.min(Math.max(window.devicePixelRatio * 1.05, 1.45), 1.85);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function prepareModel(model: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  const glowMaterials: THREE.MeshStandardMaterial[] = [];

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = true;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materials.map((material) => {
      const nextMaterial = material.clone() as THREE.MeshStandardMaterial;
      nextMaterial.needsUpdate = true;
      nextMaterial.toneMapped = true;

      [
        nextMaterial.map,
        nextMaterial.emissiveMap,
      ].forEach((texture) => {
        if (!texture) return;
        texture.colorSpace = THREE.SRGBColorSpace;
      });

      [
        nextMaterial.map,
        nextMaterial.normalMap,
        nextMaterial.roughnessMap,
        nextMaterial.metalnessMap,
        nextMaterial.aoMap,
        nextMaterial.emissiveMap,
      ].forEach((texture) => {
        if (!texture) return;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      });

      if (nextMaterial.emissive) {
        nextMaterial.emissive.set(0xff1b83);
        nextMaterial.emissiveIntensity = 0.035;
        glowMaterials.push(nextMaterial);
      }

      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
  });

  return glowMaterials;
}

export function VtexTrophy3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const loadedTrophyRef = useRef<LoadedTrophy | null>(null);
  const transformRef = useRef<Desk3DAssetTransform>(desk3dTransforms.assets.trophy);
  const shadowRef = useRef<Desk3DShadowTransform>(desk3dTransforms.shadows.trophy);
  const [hintVisible, setHintVisible] = useState(false);
  const [shadowStyle, setShadowStyle] = useState<CSSProperties>(() => getTrophyShadowStyle(desk3dTransforms.shadows.trophy));
  const hintVisibleRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    camera.position.set(1.2, 1.02, 7.45);
    camera.lookAt(0, -0.08, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.68));

    const keyLight = new THREE.DirectionalLight(0xffeed8, 2.4);
    keyLight.position.set(-3.8, 5.2, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.radius = 8;
    keyLight.shadow.camera.left = -2;
    keyLight.shadow.camera.right = 2;
    keyLight.shadow.camera.top = 2;
    keyLight.shadow.camera.bottom = -2;
    keyLight.shadow.bias = -0.00024;
    keyLight.shadow.normalBias = 0.012;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffb12d, 0.62, 6);
    fillLight.position.set(-2.4, 0.65, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x8b5cf6, 0.42, 5.4);
    rimLight.position.set(2.2, 1.2, 2.4);
    scene.add(rimLight);

    const glowLight = new THREE.PointLight(0xff1b83, 0, 3.5);
    glowLight.position.set(0, 0.2, 1.2);
    scene.add(glowLight);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 48),
      new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0.28,
        transparent: true,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.02, TABLE_Y - 0.012, 0.06);
    shadow.scale.set(1.1, 0.42, 1);
    shadow.receiveShadow = true;
    scene.add(shadow);

    let alive = true;
    let frameId = 0;
    let loadTimer = 0;
    let targetHover = 0;
    let hoverProgress = 0;
    let hoverPulse = 0;
    let isHovered = false;

    const setHint = (visible: boolean) => {
      if (hintVisibleRef.current === visible) return;
      hintVisibleRef.current = visible;
      setHintVisible(visible);
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
    const loadTrophy = () => loader.load(TROPHY_URL, (gltf) => {
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
      root.add(model);

      const glowMaterials = prepareModel(model, renderer);
      scene.add(root);
      const loadedTrophy = {
        root,
        model,
        shadow,
        glow: glowLight,
        glowMaterials,
      };
      loadedTrophyRef.current = loadedTrophy;
      applyTrophyTransform(loadedTrophy, transformRef.current, shadowRef.current);
      requestRender();
    });
    loadTimer = window.setTimeout(loadTrophy, 420);

    const onTransformsChange = (event: Event) => {
      const nextTransforms = (event as CustomEvent<Desk3DTransforms>).detail;
      if (!nextTransforms?.assets?.trophy || !nextTransforms?.shadows?.trophy) return;

      transformRef.current = nextTransforms.assets.trophy;
      shadowRef.current = nextTransforms.shadows.trophy;
      setShadowStyle(getTrophyShadowStyle(nextTransforms.shadows.trophy));
      applyTrophyTransform(loadedTrophyRef.current, transformRef.current, shadowRef.current);
      requestRender();
    };

    const getHover = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width - 0.5) * 2, -(((event.clientY - rect.top) / rect.height - 0.5) * 2));
      raycaster.setFromCamera(pointer, camera);

      const trophy = loadedTrophyRef.current;
      if (!trophy) return false;
      return raycaster.intersectObject(trophy.model, true).length > 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      const hit = getHover(event);
      if (hit && !isHovered) {
        hoverPulse = 1;
      }

      isHovered = hit;
      targetHover = hit ? 1 : 0;
      host.style.cursor = hit ? "pointer" : "default";
      requestRender();
    };

    const onPointerLeave = () => {
      isHovered = false;
      targetHover = 0;
      host.style.cursor = "default";
      requestRender();
    };

    const render = () => {
      if (!alive) return;

      frameId = 0;
      let shouldContinue = false;
      const trophy = loadedTrophyRef.current;
      if (trophy && !reduceMotion && TROPHY_INTERACTION_ENABLED) {
        const currentTransform = transformRef.current;
        const currentShadow = shadowRef.current;
        hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, targetHover > hoverProgress ? 0.3 : 0.14);
        hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.12);

        const lift = Math.sin(hoverProgress * Math.PI) * 0.105 + hoverPulse * 0.045;
        trophy.root.position.x = THREE.MathUtils.lerp(trophy.root.position.x, currentTransform.position[0], 0.24);
        trophy.root.position.y = THREE.MathUtils.lerp(trophy.root.position.y, currentTransform.position[1] + lift, 0.24);
        trophy.root.position.z = THREE.MathUtils.lerp(trophy.root.position.z, currentTransform.position[2], 0.24);
        trophy.root.rotation.x = THREE.MathUtils.lerp(trophy.root.rotation.x, currentTransform.rotation[0] - hoverProgress * 0.05, 0.22);
        trophy.root.rotation.y = THREE.MathUtils.lerp(trophy.root.rotation.y, currentTransform.rotation[1] + hoverProgress * 0.18 + hoverPulse * 0.08, 0.22);
        trophy.root.rotation.z = THREE.MathUtils.lerp(trophy.root.rotation.z, currentTransform.rotation[2] + hoverProgress * 0.045, 0.22);
        trophy.root.scale.setScalar(THREE.MathUtils.lerp(trophy.root.scale.x, currentTransform.scale + hoverProgress * 0.035, 0.2));

        trophy.shadow.position.x = currentTransform.position[0] + 0.02;
        trophy.shadow.position.z = currentTransform.position[2] + 0.06;
        trophy.shadow.material.opacity = THREE.MathUtils.lerp(currentShadow.opacity, currentShadow.hoverOpacity, hoverProgress);
        trophy.shadow.scale.set(currentShadow.scaleX + hoverProgress * 0.18, currentShadow.scaleZ + hoverProgress * 0.08, 1);
        trophy.glow.intensity = THREE.MathUtils.lerp(0, 1.18, hoverProgress) + hoverPulse * 0.4;
        trophy.glowMaterials.forEach((material) => {
          material.emissiveIntensity = THREE.MathUtils.lerp(0.035, 0.42, hoverProgress) + hoverPulse * 0.16;
          material.needsUpdate = true;
        });

        setHint(hoverProgress > 0.08 || isHovered);
        shouldContinue =
          Math.abs(hoverProgress - targetHover) > 0.003 ||
          hoverPulse > 0.003 ||
          Math.abs(trophy.root.position.x - currentTransform.position[0]) > 0.003 ||
          Math.abs(trophy.root.position.y - (currentTransform.position[1] + lift)) > 0.003 ||
          Math.abs(trophy.root.position.z - currentTransform.position[2]) > 0.003 ||
          Math.abs(trophy.root.scale.x - (currentTransform.scale + hoverProgress * 0.035)) > 0.003;
      } else if (trophy) {
        trophy.glow.intensity = 0;
        trophy.glowMaterials.forEach((material) => {
          material.emissiveIntensity = 0.035;
          material.needsUpdate = true;
        });
        setHint(false);
      }

      renderer.render(scene, camera);
      if (alive && shouldContinue) {
        requestRender();
      }
    };

    function requestRender() {
      if (!alive || frameId) return;
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    requestRender();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    if (TROPHY_INTERACTION_ENABLED) {
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerleave", onPointerLeave);
    }
    window.addEventListener(DESK_TRANSFORMS_CHANGE_EVENT, onTransformsChange);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(loadTimer);
      resizeObserver.disconnect();
      if (TROPHY_INTERACTION_ENABLED) {
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerleave", onPointerLeave);
      }
      window.removeEventListener(DESK_TRANSFORMS_CHANGE_EVENT, onTransformsChange);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      loadedTrophyRef.current = null;
    };
  }, []);

  return (
    <div ref={hostRef} className={`room-vtex-trophy-stage room-layer ${hintVisible ? "is-trophy-hovered" : ""}`} style={shadowStyle} aria-label="Trofeo VTEX IO en 3D">
      <div className="vtex-trophy-contact-shadow" aria-hidden="true" />
      <div className="vtex-trophy-action-glow" aria-hidden="true" />
      <div className="object-action-label object-action-label--trophy" aria-hidden="true">
        VTEX IO
      </div>
    </div>
  );
}
