import { BriefcaseBusiness, Code2, Home, Mail, Rocket, UserRound, Wrench } from "lucide-react";
import type { ImgHTMLAttributes, SyntheticEvent } from "react";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";

const roomAssets = {
  base: "/assets/Habitacion/Fondobase.jpeg",
  lamp: "/assets/Habitacion/desk-lamp.png",
};

const navItems = [
  { label: "Inicio", icon: Home, to: "#inicio" },
  { label: "Sobre mi", icon: UserRound, to: "#sobre-mi" },
  { label: "Proyectos", icon: Rocket, to: "#proyectos" },
  { label: "Skills", icon: Code2, to: "#skills" },
  { label: "Experiencia", icon: BriefcaseBusiness, to: "#experiencia" },
  { label: "VTEX", icon: Wrench, to: "#vtex" },
  { label: "Contacto", icon: Mail, to: "mailto:hola@mariorojas.dev" },
];

const techStack = ["React", "TypeScript", "GSAP", "VTEX IO", "UX/UI", "IA"];

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
        <SmartAssetImage className="room-base absolute inset-0 h-full w-full object-cover object-center" src={roomAssets.base} preferPngVariant={false} alt="Habitacion calida con escritorio de Mario Rojas" />
        <div className="room-vignette absolute inset-0" />

        <div className="room-monitor absolute">
          <div className="room-monitor-pan absolute inset-0">
            <div className="room-monitor-glow absolute inset-[6%] rounded-[1.4rem] bg-[#8b5cf6]/30 blur-3xl" />
            <div className="room-screen-ui absolute inset-0 z-20 overflow-hidden rounded-[0.9rem] border border-white/10 bg-[#0b0714]/94 shadow-[0_30px_90px_rgba(0,0,0,.45)]">
              <div className="grid h-full grid-cols-[28%_72%]">
                <aside className="room-screen-sidebar border-r border-white/10 bg-black/22">
                  <div className="room-reveal flex items-center gap-2 font-black uppercase tracking-normal text-[#ffb12d]">
                    <Code2 size={18} />
                    Mario
                  </div>
                  <nav className="room-screen-nav mt-6 grid gap-1.5">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      const content = (
                        <>
                          <Icon size={17} />
                          <span>{item.label}</span>
                        </>
                      );

                      const className = `room-reveal flex items-center gap-3 rounded-[0.7rem] px-3 py-2 text-sm font-semibold transition-colors ${
                        index === 0 ? "bg-white/12 text-[#ffb12d]" : "text-white/78 hover:bg-white/10 hover:text-white"
                      }`;

                    return (
                      <a key={item.label} className={className} href={item.to}>
                        {content}
                      </a>
                    );
                  })}
                  </nav>

                  <div className="room-screen-tech room-reveal mt-4 border-t border-white/10 pt-3">
                    <p className="text-[0.62rem] font-black uppercase text-white/42">Tecnologias</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {techStack.map((tech) => (
                        <span key={tech} className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[0.62rem] font-black text-white/78">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </aside>

                <main className="room-screen-main relative overflow-hidden">
                  <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="relative z-10 grid h-full content-center gap-4 lg:grid-cols-[1fr_0.72fr] lg:items-center">
                    <div>
                      <p className="room-reveal text-xl font-bold text-white/82">Hola, soy</p>
                      <h1 className="room-reveal mt-1 font-display text-6xl font-black leading-[0.82] text-[#ffb12d] md:text-7xl lg:text-8xl">
                        Mario
                      </h1>
                      <p className="room-reveal mt-3 max-w-md text-sm font-black uppercase leading-tight tracking-normal text-white/82 md:text-base">
                        Ingeniero de sistemas & developer front-end
                      </p>
                      <p className="room-reveal mt-3 max-w-md text-sm font-medium leading-relaxed text-white/62 md:text-[0.95rem]">
                        Creo experiencias interactivas que conectan personas, diseno, codigo e IA.
                      </p>
                      <div className="room-reveal mt-4 flex flex-wrap gap-3">
                        <a href="#proyectos" className="inline-flex items-center gap-2 rounded-full bg-[#ffb12d] px-4 py-2.5 text-sm font-black text-[#130b07] shadow-[0_18px_50px_rgba(255,177,45,.28)]">
                          Explorar proyectos
                          <Rocket size={17} />
                        </a>
                        <a href="#vtex" className="inline-flex items-center gap-2 rounded-full border border-white/14 px-4 py-2.5 text-sm font-black text-white/82 hover:bg-white/10">
                          VTEX IO
                        </a>
                      </div>
                    </div>

                    <div className="room-code-card room-reveal rounded-[1rem] border border-white/10 bg-white/[0.045] shadow-[0_20px_70px_rgba(0,0,0,.2)]">
                      <div className="mb-4 flex gap-2">
                        <span className="size-2 rounded-full bg-[#ff6f61]" />
                        <span className="size-2 rounded-full bg-[#ffe06a]" />
                        <span className="size-2 rounded-full bg-[#9ee8c6]" />
                      </div>
                      <pre className="whitespace-pre-wrap font-mono font-bold text-white/72">
{`const sobreMi = () => {
  return (
    <div>
      <h1>Resolver con diseno</h1>
      <p>Front-end, IA y eCommerce
      con intencion real.</p>
    </div>
  )
}`}
                      </pre>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>

        <div className="room-layer room-base-locked room-object room-object-lamp" aria-hidden="true">
          <SmartAssetImage className="room-cutout h-full w-full object-contain" src={roomAssets.lamp} alt="" />
        </div>
      </div>
    </section>
  );
}
