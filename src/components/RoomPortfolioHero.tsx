import { BriefcaseBusiness, Code2, Home, Mail, Rocket, UserRound, Wrench } from "lucide-react";
import type { ImgHTMLAttributes, SyntheticEvent, UIEvent } from "react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import { getThreeQualityTier } from "../lib/threePerformance";

const DeskDevice3D = lazy(() => import("./DeskDevice3D").then((module) => ({ default: module.DeskDevice3D })));
const MonitorToyCar3D = lazy(() => import("./MonitorToyCar3D").then((module) => ({ default: module.MonitorToyCar3D })));
const VtexTrophy3D = lazy(() => import("./VtexTrophy3D").then((module) => ({ default: module.VtexTrophy3D })));

const roomAssets = {
  base: "/assets/Habitacion/Fondobase2.png",
  lamp: "/assets/Habitacion/desk-lamp.png",
};

const navItems = [
  { label: "Inicio", icon: Home, id: "inicio" },
  { label: "Sobre mi", icon: UserRound, id: "sobre-mi" },
  { label: "Proyectos", icon: Rocket, id: "proyectos" },
  { label: "Skills", icon: Code2, id: "skills" },
  { label: "Experiencia", icon: BriefcaseBusiness, id: "experiencia" },
  { label: "VTEX IO", icon: Wrench, id: "vtex" },
  { label: "Contacto", icon: Mail, id: "contacto" },
];

const techStack = ["React", "TypeScript", "GSAP", "VTEX IO", "UX/UI", "IA"];
const screenStats = [
  { value: "+20", label: "Proyectos completados", icon: Code2 },
  { value: "+5", label: "Anos de experiencia", icon: BriefcaseBusiness },
  { value: "100%", label: "Compromiso y dedicacion", icon: Rocket },
];

const screenSections = [
  {
    id: "sobre-mi",
    eyebrow: "Sobre mi",
    title: "Diseno, codigo y direccion visual",
    copy: "Conecto front-end, UX, IA y criterio grafico para crear experiencias digitales que se sienten vivas, claras y faciles de explorar.",
  },
  {
    id: "proyectos",
    eyebrow: "Proyectos",
    title: "Interfaces con actitud",
    copy: "Landing pages, eCommerce, experiencias interactivas, motion systems y productos que venden sin sentirse genericos.",
  },
  {
    id: "skills",
    eyebrow: "Skills",
    title: "Stack creativo",
    copy: "React, TypeScript, GSAP, VTEX IO, UX/UI, Figma, Photoshop, IA aplicada, automatizacion y arquitectura front-end.",
  },
  {
    id: "experiencia",
    eyebrow: "Experiencia",
    title: "Del concepto al deploy",
    copy: "Trabajo desde discovery y sistemas visuales hasta componentes reutilizables, performance, integracion e iteracion con equipos reales.",
  },
  {
    id: "vtex",
    eyebrow: "VTEX IO",
    title: "Mi fuerte eCommerce",
    copy: "Componentes configurables, PDP, PLP, checkout, Site Editor, Master Data, GraphQL y arquitectura pensada para escalar.",
  },
  {
    id: "contacto",
    eyebrow: "Contacto",
    title: "Hablemos de una experiencia distinta",
    copy: "Si el proyecto pide impacto, claridad y algo que se sienta vivo, ahi es donde entro.",
  },
];
const screenNavOrder = ["inicio", ...screenSections.map((section) => section.id)];
const baseInteractive3DLoadPlan = [
  { id: "device", delay: 850 },
  { id: "car", delay: 500 },
  { id: "trophy", delay: 700 },
] as const;

type Interactive3DAsset = (typeof baseInteractive3DLoadPlan)[number]["id"];

type SmartAssetImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  preferPngVariant?: boolean;
};

function getPngVariant(src: string) {
  return src.replace(/\.(jpe?g|webp)$/i, ".png");
}

function SmartAssetImage({ src, preferPngVariant = true, onError, ...props }: SmartAssetImageProps) {
  const preferredSrc = preferPngVariant ? getPngVariant(src) : src;
  const [currentSrc, setCurrentSrc] = useState(preferredSrc);
  const isUsingFallback = useRef(preferredSrc === src);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (!isUsingFallback.current) {
      isUsingFallback.current = true;
      setCurrentSrc(src);
      return;
    }

    onError?.(event);
  };

  return <img {...props} src={currentSrc} onError={handleError} />;
}

function getInteractive3DLoadPlan() {
  const qualityTier = getThreeQualityTier();

  if (qualityTier === "low") {
    return baseInteractive3DLoadPlan.filter((asset) => asset.id === "device");
  }

  if (qualityTier === "balanced") {
    return baseInteractive3DLoadPlan.filter((asset) => asset.id !== "trophy");
  }

  return baseInteractive3DLoadPlan;
}

export function RoomPortfolioHero() {
  const scope = useRef<HTMLElement>(null);
  const [activeScreenSection, setActiveScreenSection] = useState("inicio");
  const [interactive3DAssets, setInteractive3DAssets] = useState<Record<Interactive3DAsset, boolean>>({
    device: false,
    car: false,
    trophy: false,
  });

  useEffect(() => {
    let disposed = false;
    let timeoutId = 0;
    let idleId: number | undefined;
    const interactive3DLoadPlan = getInteractive3DLoadPlan();
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const clearScheduledLoad = () => {
      window.clearTimeout(timeoutId);
      if (idleId !== undefined) {
        idleWindow.cancelIdleCallback?.(idleId);
        idleId = undefined;
      }
    };

    let lastScrollIntentAt = performance.now();
    const markScrollIntent = () => {
      lastScrollIntentAt = performance.now();
    };

    const canLoad3D = () => {
      const root = scope.current;
      const hasSettled = performance.now() - lastScrollIntentAt > 650;
      return hasSettled && !document.hidden && window.scrollY < window.innerHeight * 0.08 && !root?.classList.contains("is-screen-entering");
    };

    const scheduleLoad = (callback: () => void, delay: number) => {
      clearScheduledLoad();
      timeoutId = window.setTimeout(() => {
        if (disposed) return;
        if (idleWindow.requestIdleCallback) {
          idleId = idleWindow.requestIdleCallback(callback, { timeout: 900 });
          return;
        }

        callback();
      }, delay);
    };

    const loadStep = (index: number) => {
      if (disposed || index >= interactive3DLoadPlan.length) return;

      if (!canLoad3D()) {
        scheduleLoad(() => loadStep(index), 450);
        return;
      }

      const assetId = interactive3DLoadPlan[index].id;
      setInteractive3DAssets((currentAssets) => (
        currentAssets[assetId] ? currentAssets : { ...currentAssets, [assetId]: true }
      ));

      const nextStep = interactive3DLoadPlan[index + 1];
      if (nextStep) {
        scheduleLoad(() => loadStep(index + 1), nextStep.delay);
      }
    };

    scheduleLoad(() => loadStep(0), interactive3DLoadPlan[0].delay);
    window.addEventListener("scroll", markScrollIntent, { passive: true });
    window.addEventListener("wheel", markScrollIntent, { passive: true });
    window.addEventListener("touchmove", markScrollIntent, { passive: true });

    return () => {
      disposed = true;
      window.removeEventListener("scroll", markScrollIntent);
      window.removeEventListener("wheel", markScrollIntent);
      window.removeEventListener("touchmove", markScrollIntent);
      clearScheduledLoad();
    };
  }, []);

  const handleScreenNav = (sectionId: string) => {
    const target = scope.current?.querySelector<HTMLElement>(`#screen-${sectionId}`);
    const scroller = scope.current?.querySelector<HTMLElement>(".room-screen-scroll");
    if (!target || !scroller) return;

    setActiveScreenSection(sectionId);
    scroller.scrollTo({
      top: sectionId === "inicio" ? 0 : Math.max(target.offsetTop - 16, 0),
      behavior: "smooth",
    });
  };

  const handleScreenScroll = (event: UIEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    const activationLine = scroller.scrollTop + scroller.clientHeight * 0.3;
    let nextSection = "inicio";

    for (const sectionId of screenNavOrder) {
      const section = scroller.querySelector<HTMLElement>(`#screen-${sectionId}`);
      if (section && section.offsetTop <= activationLine) {
        nextSection = sectionId;
      }
    }

    if (nextSection !== activeScreenSection) {
      setActiveScreenSection(nextSection);
    }
  };

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(".room-reveal, .room-layer, .room-camera, .room-pan-layer", { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0 });
        return;
      }

      gsap.set(".room-screen-ui, .room-reveal", { autoAlpha: 1 });

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .from(".room-base", { autoAlpha: 0, scale: 1.025, duration: 0.82 })
        .from(".room-layer", { autoAlpha: 0, y: 22, scale: 0.96, stagger: 0.035, duration: 0.62 }, "-=0.48")
        .from(".room-reveal", { y: 10, stagger: 0.025, duration: 0.42 }, "-=0.5");

      const monitorGlowTween = gsap.to(".room-monitor-glow", {
        opacity: 0.78,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      const scene = root.querySelector<HTMLElement>(".room-camera");
      const monitorFrame = root.querySelector<HTMLElement>(".room-monitor");
      const panLayer = root.querySelector<HTMLElement>(".room-pan-layer");
      if (!scene || !monitorFrame) return;

      gsap.set(scene, { rotationX: 0, rotationY: 0, x: 0, y: 0, scale: 1, transformOrigin: "50% 30%" });
      gsap.set(monitorFrame, { x: 0, y: 0, scale: 1, transformOrigin: "50% 50%" });
      gsap.set(panLayer, { x: 0, y: 0 });
      const panXTo = panLayer ? gsap.quickTo(panLayer, "x", { duration: 0.18, ease: "power2.out" }) : undefined;
      const panYTo = panLayer ? gsap.quickTo(panLayer, "y", { duration: 0.18, ease: "power2.out" }) : undefined;

      let wasEnteringScreen = false;
      let wasScreenOccluding = false;
      let wasSceneOccluded = false;
      let wasFocusedScreen = false;

      const focusTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=115%",
          scrub: true,
          pin: true,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const isEnteringScreen = self.progress > 0.025;
            const isScreenOccluding = self.progress > 0.72;
            const isSceneOccluded = self.progress > 0.93;
            const isFocusedScreen = self.progress > 0.96;

            if (isEnteringScreen !== wasEnteringScreen) {
              root.classList.toggle("is-screen-entering", isEnteringScreen);
              if (isEnteringScreen) {
                panXTo?.(0);
                panYTo?.(0);
                monitorGlowTween.pause(0);
              } else {
                monitorGlowTween.resume();
              }
              wasEnteringScreen = isEnteringScreen;
            }

            if (isScreenOccluding !== wasScreenOccluding) {
              root.classList.toggle("is-screen-occluding", isScreenOccluding);
              wasScreenOccluding = isScreenOccluding;
            }

            if (isSceneOccluded !== wasSceneOccluded) {
              root.classList.toggle("is-scene-occluded", isSceneOccluded);
              wasSceneOccluded = isSceneOccluded;
            }

            if (isFocusedScreen !== wasFocusedScreen) {
              root.classList.toggle("is-screen-focused", isFocusedScreen);
              wasFocusedScreen = isFocusedScreen;
            }
          },
          onLeaveBack: () => {
            wasEnteringScreen = false;
            wasScreenOccluding = false;
            wasSceneOccluded = false;
            wasFocusedScreen = false;
            root.classList.remove("is-screen-entering");
            root.classList.remove("is-screen-occluding");
            root.classList.remove("is-scene-occluded");
            root.classList.remove("is-screen-focused");
            monitorGlowTween.resume();
          },
        },
      });

      focusTimeline
        .to(
          scene,
          {
            scale: () => (window.innerWidth < 768 ? 1.18 : 1.66),
            x: () => (window.innerWidth < 768 ? 0 : window.innerWidth * 0.004),
            y: () => (window.innerWidth < 768 ? window.innerHeight * 0.035 : window.innerHeight * 0.15),
            ease: "none",
          },
          0,
        )
        .to(".room-vignette", { opacity: 0.62, ease: "none" }, 0);

      ScrollTrigger.refresh();

      const edgeIntent = (value: number) => {
        const deadZone = 0.1;
        const abs = Math.abs(value);
        if (abs < deadZone) return 0;
        return Math.sign(value) * ((abs - deadZone) / (1 - deadZone));
      };

      const onPointerMove = (event: PointerEvent) => {
        if (root.classList.contains("is-screen-entering")) {
          panXTo?.(0);
          panYTo?.(0);
          return;
        }

        const rect = root.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        panXTo?.(edgeIntent(nx) * -42);
        panYTo?.(edgeIntent(ny) * -12);
      };

      const onPointerLeave = () => {
        panXTo?.(0);
        panYTo?.(0);
      };

      root.addEventListener("pointermove", onPointerMove);
      root.addEventListener("pointerleave", onPointerLeave);

      return () => {
        root.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerleave", onPointerLeave);
      };
    },
    { scope },
  );

  return (
    <section ref={scope} className="room-hero relative isolate min-h-[100svh] overflow-hidden bg-[#120b08] text-white">
      <div className="room-camera absolute inset-0 [transform-style:preserve-3d]">
        <div className="room-pan-layer absolute inset-0">
          <div className="room-mouse-rgb room-base-locked" aria-hidden="true" />
          <SmartAssetImage className="room-base absolute inset-0 h-full w-full object-cover object-center" src={roomAssets.base} preferPngVariant={false} alt="Habitacion calida con escritorio de Mario Rojas" />
          <div className="room-vignette absolute inset-0" />

          <div className="room-monitor absolute">
            <div className="room-monitor-pan absolute inset-0">
              <div className="room-monitor-glow absolute inset-[6%] rounded-[1.4rem] bg-[#8b5cf6]/30 blur-3xl" />
              <div className="room-screen-ui absolute inset-0 z-20 overflow-hidden rounded-[0.9rem] border border-white/10 bg-[#0b0714]/94 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
                <div className="room-screen-grid absolute inset-0 opacity-55" />
                <header className="room-screen-header room-reveal">
                  <button className="room-screen-brand" type="button" onClick={() => handleScreenNav("inicio")}>
                    <span className="room-screen-brand-mark">MR</span>
                    <span className="room-screen-brand-copy">
                      <strong>Mario</strong>
                      <small>Portfolio creativo</small>
                    </span>
                  </button>

                  <nav className="room-screen-nav" aria-label="Navegacion dentro del monitor">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.id} aria-current={activeScreenSection === item.id ? "page" : undefined} className={activeScreenSection === item.id ? "is-active" : ""} type="button" onClick={() => handleScreenNav(item.id)}>
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </header>

                <div className="room-screen-scroll" onScroll={handleScreenScroll}>
                  <main id="screen-inicio" className="room-screen-main">
                    <div className="room-screen-copy">
                      <p className="room-reveal room-kicker">Hola, soy</p>
                      <h1 className="room-reveal font-display">Mario</h1>
                      <p className="room-reveal room-role">Creative front-end, UX & VTEX IO</p>
                      <p className="room-reveal room-intro">Creo experiencias digitales tranquilas, visuales y funcionales, con criterio de diseno y movimiento.</p>
                      <div className="room-reveal room-screen-actions">
                        <button type="button" onClick={() => handleScreenNav("proyectos")}>
                          Explorar proyectos
                          <Rocket size={15} />
                        </button>
                        <button type="button" onClick={() => handleScreenNav("sobre-mi")}>Sobre mi</button>
                      </div>
                    </div>

                    <figure className="room-reveal room-visual-card" aria-label="Visual creativo de escritorio digital">
                      <SmartAssetImage src={roomAssets.base} preferPngVariant={false} alt="" />
                      <div className="room-visual-overlay">
                        <span>Diseno</span>
                        <span>UX</span>
                        <span>Motion</span>
                      </div>
                    </figure>

                    <div className="room-reveal room-screen-stats">
                      {screenStats.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label}>
                            <Icon size={22} />
                            <strong>{item.value}</strong>
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </main>

                  <div className="room-screen-sections">
                    {screenSections.map((section) => (
                      <section key={section.id} id={`screen-${section.id}`} className="screen-info-panel">
                        <p>{section.eyebrow}</p>
                        <h2>{section.title}</h2>
                        <span>{section.copy}</span>
                      </section>
                    ))}
                    <section className="screen-info-panel screen-info-panel--tools">
                      <p>Herramientas</p>
                      <h2>Lo que uso para hacerlo real</h2>
                      <div>
                        {techStack.map((tech) => (
                          <span key={tech}>{tech}</span>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="room-layer room-base-locked room-object room-object-lamp" aria-hidden="true">
            <SmartAssetImage className="room-cutout h-full w-full object-contain" src={roomAssets.lamp} alt="" />
          </div>
          {interactive3DAssets.device || interactive3DAssets.car || interactive3DAssets.trophy ? (
            <Suspense fallback={null}>
              {interactive3DAssets.device ? <DeskDevice3D /> : null}
              {interactive3DAssets.car ? <MonitorToyCar3D /> : null}
              {interactive3DAssets.trophy ? <VtexTrophy3D /> : null}
            </Suspense>
          ) : null}
        </div>
      </div>
    </section>
  );
}
