import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const PHONE_MODEL_URL = "/assets/3d/vintage_telephone.glb";
const TABLE_Y = -0.66;

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

export function VintageTelephone3D() {
  const hostRef = useRef<HTMLDivElement>(null);

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
    tableShadow.position.set(-0.28, TABLE_Y - 0.01, 0.04);
    tableShadow.scale.set(1.48, 1, 0.5);
    tableShadow.receiveShadow = true;
    scene.add(tableShadow);

    const phonePivot = new THREE.Group();
    phonePivot.rotation.set(-0.08, -0.58, -0.03);
    scene.add(phonePivot);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let phoneModel: THREE.Object3D | null = null;
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
    loader.load(PHONE_MODEL_URL, (gltf) => {
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
      const scale = maxAxis > 0 ? 1.95 / maxAxis : 1;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.x -= 0.34;

      const groundedBox = new THREE.Box3().setFromObject(model);
      model.position.y += TABLE_Y - groundedBox.min.y;

      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          const texturedMaterial = material as THREE.MeshStandardMaterial;
          const maps = [
            texturedMaterial.map,
            texturedMaterial.normalMap,
            texturedMaterial.roughnessMap,
            texturedMaterial.metalnessMap,
            texturedMaterial.aoMap,
            texturedMaterial.emissiveMap,
          ];

          maps.forEach((texture) => {
            if (!texture) return;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
          });
        });
      });

      phonePivot.add(model);
      phoneModel = model;
    });

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      pointer.set(nx, -ny);
      raycaster.setFromCamera(pointer, camera);
      const isPhoneHit = phoneModel ? raycaster.intersectObject(phoneModel, true).length > 0 : false;

      if (isPhoneHit && !isModelHovered) {
        hoverPulse = 1;
      }

      isModelHovered = isPhoneHit;
      targetHover = isPhoneHit ? 1 : 0;
      targetTiltY = isPhoneHit ? THREE.MathUtils.clamp(nx, -1, 1) * 0.08 : 0;
      targetTiltX = isPhoneHit ? THREE.MathUtils.clamp(ny, -1, 1) * -0.04 : 0;
      host.style.cursor = isPhoneHit ? "pointer" : "default";
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

      if (phoneModel) {
        if (!reduceMotion) {
          const hoverEase = targetHover > hoverProgress ? 0.24 : 0.13;
          hoverProgress = THREE.MathUtils.lerp(hoverProgress, targetHover, hoverEase);
          hoverPulse = THREE.MathUtils.lerp(hoverPulse, 0, 0.08);

          phonePivot.position.y = THREE.MathUtils.lerp(phonePivot.position.y, hoverProgress * 0.18, 0.2);
          phonePivot.rotation.y = THREE.MathUtils.lerp(
            phonePivot.rotation.y,
            -0.58 + targetTiltY + hoverProgress * 0.17 + hoverPulse * 0.3,
            0.18,
          );
          phonePivot.rotation.x = THREE.MathUtils.lerp(phonePivot.rotation.x, -0.08 + targetTiltX - hoverProgress * 0.065, 0.16);
          phonePivot.rotation.z = THREE.MathUtils.lerp(phonePivot.rotation.z, -0.03 - hoverProgress * 0.04, 0.16);

          const shadowOpacity = THREE.MathUtils.lerp(0.68, 0.3, hoverProgress);
          const shadowSpread = THREE.MathUtils.lerp(1, 1.24, hoverProgress);
          (tableShadow.material as THREE.ShadowMaterial).opacity = shadowOpacity;
          tableShadow.scale.set(1.48 * shadowSpread, 1, 0.5 * shadowSpread);
        } else {
          phonePivot.position.y = 0;
          (tableShadow.material as THREE.ShadowMaterial).opacity = 0.68;
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

  return <div ref={hostRef} className="room-phone-stage room-layer room-base-locked" aria-hidden="true" />;
}
