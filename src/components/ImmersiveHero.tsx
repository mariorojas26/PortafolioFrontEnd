import { ArrowDown, Bot, Braces, Layers3, MousePointer2, Palette, Sparkles, WandSparkles } from "lucide-react";
import { useRef } from "react";
import { MagneticLink } from "./MagneticLink";
import { gsap, useGSAP } from "../lib/gsap";

const toolTokens = ["React", "GSAP", "IA", "UX", "Figma", "VTEX"];
const stats = [
  { value: "70%", label: "front-end visual" },
  { value: "3", label: "pilares creativos" },
  { value: "0", label: "plantillas aburridas" },
];

export function ImmersiveHero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 768px)",
        },
        (context) => {
          const { reduceMotion, desktop } = context.conditions as {
            reduceMotion: boolean;
            desktop: boolean;
          };

          if (reduceMotion) {
            gsap.set(".hero-reveal, .lab-layer, .tool-token", {
              autoAlpha: 1,
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
            });
            return;
          }

          const intro = gsap.timeline({ defaults: { ease: "power4.out" } });

          intro
            .from(".hero-stage", { autoAlpha: 0, y: 32, scale: 0.94, rotation: -1.5, duration: 0.95 })
            .from(
              ".lab-layer",
              {
                autoAlpha: 0,
                y: 54,
                rotation: (index) => [-8, 7, -5, 6, -4, 4][index] ?? 0,
                stagger: 0.07,
                duration: 1,
              },
              "-=0.62",
            )
            .from(".hero-reveal", { autoAlpha: 0, y: 36, stagger: 0.07, duration: 0.82 }, "-=0.78")
            .from(".tool-token", { autoAlpha: 0, y: 18, stagger: 0.035, duration: 0.55 }, "-=0.48");

          gsap.to(".hero-marquee-track", {
            xPercent: -50,
            duration: 22,
            ease: "none",
            repeat: -1,
          });

          gsap.to(".hero-stage", {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: 0.9,
            },
          });

          if (!desktop || !root) return;

          const stage = root.querySelector<HTMLElement>(".hero-stage");
          const pieces = gsap.utils.toArray<HTMLElement>(".parallax-piece");
          if (!stage) return;

          const rotateXTo = gsap.quickTo(stage, "rotationX", { duration: 0.7, ease: "power3.out" });
          const rotateYTo = gsap.quickTo(stage, "rotationY", { duration: 0.7, ease: "power3.out" });
          const pieceX = pieces.map((piece, index) =>
            gsap.quickTo(piece, "x", { duration: 0.75 + index * 0.03, ease: "power3.out" }),
          );
          const pieceY = pieces.map((piece, index) =>
            gsap.quickTo(piece, "y", { duration: 0.75 + index * 0.03, ease: "power3.out" }),
          );

          const onPointerMove = (event: PointerEvent) => {
            const rect = root.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            rotateXTo(y * -8);
            rotateYTo(x * 10);
            pieces.forEach((_, index) => {
              const depth = 10 + index * 5;
              pieceX[index](x * depth);
              pieceY[index](y * depth * 0.72);
            });
          };

          const onPointerLeave = () => {
            rotateXTo(0);
            rotateYTo(0);
            pieceX.forEach((to) => to(0));
            pieceY.forEach((to) => to(0));
          };

          root.addEventListener("pointermove", onPointerMove);
          root.addEventListener("pointerleave", onPointerLeave);

          return () => {
            root.removeEventListener("pointermove", onPointerMove);
            root.removeEventListener("pointerleave", onPointerLeave);
          };
        },
      );

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="immersive-hero home-hero-flow relative isolate overflow-hidden px-5 pb-28 pt-24 md:pb-32 md:pt-28 lg:min-h-[118dvh]">
      <div className="hero-field absolute inset-0" />
      <div className="hero-grid absolute inset-0" />
      <div className="hero-layout relative mx-auto grid min-h-[calc(108dvh-7rem)] max-w-7xl items-center gap-7 py-4 md:py-10 lg:min-h-[calc(116dvh-7rem)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
        <div className="hero-copy order-2 z-10 lg:order-1">
          <div className="hero-reveal inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-xs font-black uppercase text-ink shadow-soft backdrop-blur md:text-sm">
            <Sparkles size={15} />
            Creative front-end / archivo vivo
          </div>

          <h1 className="hero-reveal mt-5 max-w-[11ch] font-display text-[clamp(3.25rem,9.6vw,8.7rem)] font-black leading-[0.86] tracking-normal text-ink md:mt-7">
            Diseño que se mueve.
          </h1>

          <p className="hero-reveal mt-5 max-w-xl text-balance text-base font-semibold leading-snug text-ink/70 md:text-2xl">
            Portfolio visual para mezclar VTEX IO, eCommerce, IA, diseño gráfico y front-end motion con una experiencia que invita a tocar, mirar y seguir explorando.
          </p>

          <div className="hero-reveal mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MagneticLink to="/proyectos" className="justify-center sm:justify-start">
              Ver proyectos
            </MagneticLink>
            <a className="magnetic-link magnetic-light justify-center border border-ink/10 sm:justify-start" href="#portadas">
              <span>Ver portadas vivas</span>
              <ArrowDown size={18} />
            </a>
          </div>

          <div className="hero-stats hero-reveal mt-8 grid max-w-xl grid-cols-3 gap-2 md:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1rem] border border-ink/10 bg-white/65 p-3 shadow-soft backdrop-blur md:p-4">
                <p className="font-display text-2xl font-black leading-none md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-[0.62rem] font-black uppercase leading-tight text-ink/48 md:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-stage-wrap order-1 min-h-[470px] perspective-hero lg:order-2 lg:min-h-[760px]">
          <div className="hero-stage relative mx-auto h-[470px] max-w-[620px] [transform-style:preserve-3d] md:h-[720px] md:max-w-[820px] lg:h-[780px] lg:max-w-[900px]">
            <div className="lab-layer parallax-piece hero-main-panel absolute overflow-hidden rounded-[2rem] border-[9px] border-white bg-white shadow-sticker md:rounded-[2.4rem]">
              <div className="flex h-10 items-center justify-between border-b border-ink/10 bg-paper px-4">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-tomato" />
                  <span className="size-2.5 rounded-full bg-lemon" />
                  <span className="size-2.5 rounded-full bg-mint" />
                </div>
                <span className="text-[0.65rem] font-black uppercase text-ink/45">mario.rojas/lab</span>
              </div>
              <img src="/assets/hero-archive.png" alt="Collage editorial del archivo creativo de Mario Rojas" className="h-[calc(100%-2.5rem)] w-full object-cover" />
            </div>

            <div className="lab-layer parallax-piece hero-poster-panel absolute overflow-hidden rounded-[1.55rem] border-[8px] border-white bg-lemon shadow-sticker md:rounded-[1.9rem]">
              <img src="/assets/cover-motion.png" alt="Portada visual de front-end motion y GSAP" className="h-full w-full object-cover" />
            </div>

            <div className="lab-layer parallax-piece hero-code-panel absolute rounded-[1.25rem] border border-ink/10 bg-ink p-4 font-mono text-[0.64rem] font-bold leading-relaxed text-paper shadow-soft md:rounded-[1.6rem] md:p-5 md:text-xs">
              <div className="mb-3 flex items-center justify-between text-paper/50">
                <span>motion.ts</span>
                <Braces size={16} />
              </div>
              <p><span className="text-lemon">const</span> timeline = gsap.timeline();</p>
              <p><span className="text-sky">timeline</span>.from(".idea", {"{ y: 80 }"});</p>
              <p><span className="text-mint">ScrollTrigger</span>.refresh();</p>
            </div>

            <div className="lab-layer parallax-piece hero-ai-badge absolute flex items-center gap-3 rounded-full border border-ink/10 bg-white/88 px-4 py-3 font-black shadow-soft backdrop-blur">
              <span className="grid size-9 place-items-center rounded-full bg-cobalt text-paper">
                <Bot size={18} />
              </span>
              <span className="leading-none">IA aplicada</span>
            </div>

            <div className="lab-layer parallax-piece hero-design-badge absolute flex items-center gap-3 rounded-full border border-ink/10 bg-peach/90 px-4 py-3 font-black shadow-soft backdrop-blur">
              <span className="grid size-9 place-items-center rounded-full bg-tomato text-paper">
                <Palette size={18} />
              </span>
              <span className="hidden leading-none sm:inline">Diseño gráfico</span>
              <span className="leading-none sm:hidden">Diseño</span>
            </div>

            <div className="lab-layer parallax-piece hero-cursor absolute rounded-[1.3rem] border border-ink/10 bg-white/85 p-4 shadow-soft backdrop-blur">
              <MousePointer2 size={28} />
              <p className="mt-3 text-xs font-black uppercase text-ink/55">Scroll + hover</p>
            </div>

            <div className="lab-layer parallax-piece hero-toolkit absolute rounded-[1.6rem] border border-ink/10 bg-white/75 p-3 shadow-soft backdrop-blur md:p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-ink/48">
                <Layers3 size={15} />
                stack creativo
              </div>
              <div className="flex flex-wrap gap-2">
                {toolTokens.map((token) => (
                  <span key={token} className="tool-token rounded-full bg-ink px-3 py-2 text-xs font-black text-paper">
                    {token}
                  </span>
                ))}
              </div>
            </div>

            <div className="lab-layer parallax-piece hero-spark-card absolute flex items-center gap-2 rounded-full bg-lemon px-4 py-3 font-black text-ink shadow-sticker">
              <WandSparkles size={18} />
              <span>WOW, pero claro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-marquee pointer-events-none relative z-10 mx-auto max-w-7xl overflow-hidden py-3">
        <div className="hero-marquee-track flex w-max gap-8 whitespace-nowrap text-sm font-black uppercase text-ink/45">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="flex gap-8">
              <span>Diseño gráfico</span>
              <span>IA aplicada</span>
              <span>Front-end motion</span>
              <span>UX con intención</span>
              <span>GSAP + React</span>
              <span>Assets visuales</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-flow-bridge pointer-events-none absolute inset-x-0 bottom-0 h-56" />
    </section>
  );
}
