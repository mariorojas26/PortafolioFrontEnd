import { BriefcaseBusiness, Code2, Home, Mail, Rocket, UserRound, Wrench } from "lucide-react";
import type { ImgHTMLAttributes, SyntheticEvent, UIEvent } from "react";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import { DeskDevice3D } from "./DeskDevice3D";
import { MonitorToyCar3D } from "./MonitorToyCar3D";
import { VtexTrophy3D } from "./VtexTrophy3D";

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

export function RoomPortfolioHero() {
  const scope = useRef<HTMLElement>(null);
  const [activeScreenSection, setActiveScreenSection] = useState("inicio");

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
        gsap.set(".room-reveal, .room-layer, .room-camera", { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0 });
        return;
      }

      gsap.set(".room-screen-ui, .room-reveal", { autoAlpha: 1 });

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .from(".room-base", { autoAlpha: 0, scale: 1.025, duration: 0.82 })
        .from(".room-layer", { autoAlpha: 0, y: 22, scale: 0.96, stagger: 0.035, duration: 0.62 }, "-=0.48")
        .from(".room-reveal", { y: 10, stagger: 0.025, duration: 0.42 }, "-=0.5");

      gsap.to(".room-monitor-glow", {
        opacity: 0.78,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      const scene = root.querySelector<HTMLElement>(".room-camera");
      const base = root.querySelector<HTMLElement>(".room-base");
      const monitor = root.querySelector<HTMLElement>(".room-monitor-pan");
      const layers = gsap.utils.toArray<HTMLElement>(".room-layer.room-parallax");
      const baseLockedLayers = gsap.utils.toArray<HTMLElement>(".room-base-locked");
      if (!scene) return;

      gsap.set(scene, { rotationX: 0, rotationY: 0, x: 0, y: 0 });
      const baseXTo = base ? gsap.quickTo(base, "x", { duration: 0.18, ease: "power2.out" }) : undefined;
      const baseYTo = base ? gsap.quickTo(base, "y", { duration: 0.18, ease: "power2.out" }) : undefined;
      const monitorXTo = monitor ? gsap.quickTo(monitor, "x", { duration: 0.18, ease: "power2.out" }) : undefined;
      const monitorYTo = monitor ? gsap.quickTo(monitor, "y", { duration: 0.18, ease: "power2.out" }) : undefined;
      const layerX = layers.map((layer, index) => gsap.quickTo(layer, "x", { duration: 0.2 + index * 0.01, ease: "power2.out" }));
      const layerY = layers.map((layer, index) => gsap.quickTo(layer, "y", { duration: 0.2 + index * 0.01, ease: "power2.out" }));
      const baseLockedX = baseLockedLayers.map((layer) => gsap.quickTo(layer, "x", { duration: 0.18, ease: "power2.out" }));
      const baseLockedY = baseLockedLayers.map((layer) => gsap.quickTo(layer, "y", { duration: 0.18, ease: "power2.out" }));

      gsap.set(scene, { transformOrigin: "50% 34%" });

      const focusTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=115%",
          scrub: 0.85,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            root.classList.toggle("is-screen-focused", self.progress > 0.72);
          },
          onLeaveBack: () => {
            root.classList.remove("is-screen-focused");
          },
        },
      });

      focusTimeline
        .to(
          scene,
          {
            scale: () => (window.innerWidth < 768 ? 1.18 : 1.72),
            x: () => (window.innerWidth < 768 ? 0 : window.innerWidth * -0.02),
            y: () => (window.innerWidth < 768 ? window.innerHeight * 0.04 : window.innerHeight * 0.18),
            ease: "none",
          },
          0,
        )
        .to(".room-device-stage, .room-toy-car-stage, .room-vtex-trophy-stage, .room-object-lamp", { autoAlpha: 0, ease: "none" }, 0.08)
        .to(".room-screen-ui", { backgroundColor: "rgba(11, 7, 20, 0.985)", ease: "none" }, 0)
        .to(".room-vignette", { opacity: 0.62, ease: "none" }, 0);

      ScrollTrigger.refresh();

      const edgeIntent = (value: number) => {
        const deadZone = 0.1;
        const abs = Math.abs(value);
        if (abs < deadZone) return 0;
        return Math.sign(value) * ((abs - deadZone) / (1 - deadZone));
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        const lookX = edgeIntent(nx);
        const lookY = edgeIntent(ny);
        const cameraX = lookX * -42;
        const cameraY = lookY * -12;

        baseXTo?.(cameraX);
        baseYTo?.(cameraY);
        monitorXTo?.(cameraX);
        monitorYTo?.(cameraY);
        baseLockedLayers.forEach((_, index) => {
          baseLockedX[index](cameraX);
          baseLockedY[index](cameraY);
        });
        layers.forEach((_, index) => {
          const depth = 4.5 + index * 1.05;
          layerX[index](lookX * -depth);
          layerY[index](lookY * -depth * 0.34);
        });
      };

      const onPointerLeave = () => {
        baseXTo?.(0);
        baseYTo?.(0);
        monitorXTo?.(0);
        monitorYTo?.(0);
        baseLockedX.forEach((to) => to(0));
        baseLockedY.forEach((to) => to(0));
        layerX.forEach((to) => to(0));
        layerY.forEach((to) => to(0));
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
        <DeskDevice3D />
        <MonitorToyCar3D />
        <VtexTrophy3D />
      </div>
    </section>
  );
}
