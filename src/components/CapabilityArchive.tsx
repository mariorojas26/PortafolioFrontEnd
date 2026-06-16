import { Bot, Brush, Code2, MousePointerClick, ShoppingBag, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef } from "react";
import { capabilities } from "../data/capabilities";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";

const icons = [ShoppingBag, Code2, MousePointerClick, Brush, Bot];
const stackImages = [
  "/assets/project-collage.png",
  "/assets/cover-motion.png",
  "/assets/archive-process.png",
  "/assets/archive-design.png",
  "/assets/archive-ai-motion.png",
];

const stackAngles = [-8, 5, -3, 7, -5];
const toolCloud = Array.from(new Set(capabilities.flatMap((item) => item.tools)));

export function CapabilityArchive() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 1024px)",
        },
        (context) => {
          const { reduceMotion, desktop } = context.conditions as {
            reduceMotion: boolean;
            desktop: boolean;
          };

          const spotlights = gsap.utils.toArray<HTMLElement>(".stack-studio-spotlight");
          const images = gsap.utils.toArray<HTMLElement>(".stack-studio-image");
          const cards = gsap.utils.toArray<HTMLElement>(".stack-studio-card");
          const tools = gsap.utils.toArray<HTMLElement>(".stack-studio-tool");

          if (reduceMotion) {
            gsap.set([spotlights, images, cards, tools], {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
            });
            return;
          }

          gsap.from(".stack-studio-reveal", {
            autoAlpha: 0,
            y: 30,
            stagger: 0.08,
            duration: 0.74,
            ease: "power4.out",
            scrollTrigger: {
              trigger: root,
              start: "top 78%",
              once: true,
            },
          });

          gsap.from(tools, {
            autoAlpha: 0,
            y: 28,
            scale: 0.82,
            rotation: () => gsap.utils.random(-8, 8),
            stagger: { each: 0.025, from: "random" },
            duration: 0.62,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: root,
              start: "top 68%",
              once: true,
            },
          });

          gsap.to(tools, {
            y: (index) => (index % 2 === 0 ? -10 : 10),
            rotation: (index) => (index % 2 === 0 ? 2 : -2),
            duration: 2.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            stagger: 0.08,
          });

          gsap.to(".stack-studio-board", {
            yPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          });

          if (!desktop) {
            cards.forEach((card) => {
              gsap.from(card, {
                autoAlpha: 0,
                y: 48,
                scale: 0.96,
                duration: 0.64,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 82%",
                  toggleActions: "play none none reverse",
                },
              });
            });
            return;
          }

          gsap.set(spotlights, { autoAlpha: 0, y: 36, scale: 0.96 });
          gsap.set(spotlights[0], { autoAlpha: 1, y: 0, scale: 1 });
          gsap.set(images, { autoAlpha: 0, scale: 1.06, rotation: 3 });
          gsap.set(images[0], { autoAlpha: 1, scale: 1, rotation: 0 });
          gsap.set(cards, { autoAlpha: 0.42, y: 0, scale: 1 });
          gsap.set(cards[0], { autoAlpha: 1, y: -8, scale: 1.03 });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${capabilities.length * 520}`,
              scrub: 0.8,
              pin: true,
              anticipatePin: 1,
            },
          });

          capabilities.forEach((item, index) => {
            if (index === 0) return;

            timeline
              .to(spotlights[index - 1], { autoAlpha: 0, y: -34, scale: 0.96, duration: 0.46, ease: "power3.inOut" }, `stack-${index}`)
              .fromTo(
                spotlights[index],
                { autoAlpha: 0, y: 42, scale: 0.96 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: "power4.out" },
                `stack-${index}+=0.08`,
              )
              .to(images[index - 1], { autoAlpha: 0, scale: 1.08, rotation: -3, duration: 0.48, ease: "power3.inOut" }, `stack-${index}`)
              .fromTo(
                images[index],
                { autoAlpha: 0, scale: 1.08, rotation: stackAngles[index] },
                { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.66, ease: "power3.out" },
                `stack-${index}+=0.05`,
              )
              .to(cards[index - 1], { autoAlpha: 0.42, y: 0, scale: 1, duration: 0.28 }, `stack-${index}`)
              .to(cards[index], { autoAlpha: 1, y: -8, scale: 1.03, duration: 0.32 }, `stack-${index}+=0.1`)
              .to(
                ".stack-studio-board",
                {
                  "--studio-accent": item.accent,
                  duration: 0.58,
                  ease: "power2.inOut",
                },
                `stack-${index}`,
              )
              .to(
                tools,
                {
                  x: () => gsap.utils.random(-28, 28),
                  y: () => gsap.utils.random(-20, 20),
                  rotation: () => gsap.utils.random(-9, 9),
                  stagger: { each: 0.01, from: "random" },
                  duration: 0.52,
                  ease: "power2.inOut",
                },
                `stack-${index}`,
              );
          });

          ScrollTrigger.refresh();
        },
      );

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="stack-studio-section relative overflow-hidden bg-white px-5 py-20 md:py-24">
      <div className="stack-studio-backdrop absolute inset-0" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-7rem)] max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div className="relative z-20">
          <p className="stack-studio-reveal eyebrow inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-4 py-2 shadow-soft backdrop-blur">
            <Sparkles size={15} />
            Stack aplicado
          </p>
          <h2 className="stack-studio-reveal mt-5 max-w-[9ch] font-display text-[clamp(3.35rem,6.8vw,7.15rem)] font-black leading-[0.84]">
            Lo que uso se nota en lo que hago.
          </h2>

          <div className="stack-studio-copy mt-8 min-h-[320px] lg:min-h-[360px]">
            {capabilities.map((item, index) => {
              const Icon = icons[index] ?? Sparkles;

              return (
                <article key={item.name} className="stack-studio-spotlight absolute max-w-xl" style={{ "--accent": item.accent } as CSSProperties}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-[color:var(--accent)] text-white shadow-soft">
                      <Icon size={21} strokeWidth={2.6} />
                    </span>
                    <span className="font-display text-6xl font-black leading-none text-ink/10">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="font-display text-[clamp(3.35rem,5.8vw,6.15rem)] font-black leading-[0.84]">{item.name}</h3>
                  <p className="mt-5 text-balance text-lg font-semibold leading-snug text-ink/66 md:text-2xl">{item.description}</p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {item.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-ink/10 bg-white/82 px-4 py-2 text-sm font-black shadow-soft">
                        {tool}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="stack-studio-reveal mt-6 grid gap-2 sm:grid-cols-2">
            {capabilities.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className="stack-studio-card flex items-center gap-3 rounded-[1.1rem] border border-ink/10 bg-paper/82 px-4 py-3 text-left shadow-[0_14px_34px_rgba(21,21,21,0.07)] backdrop-blur"
                style={{ "--accent": item.accent } as CSSProperties}
              >
                <span className="font-display text-2xl font-black text-[color:var(--accent)]">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-black uppercase leading-tight text-ink">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="stack-studio-board relative z-10 min-h-[540px] overflow-hidden rounded-[2rem] border border-ink/10 bg-paper shadow-sticker lg:min-h-[690px]"
          style={{ "--studio-accent": capabilities[0].accent } as CSSProperties}
        >
          <div className="stack-studio-board-accent absolute inset-0" />
          <div className="stack-studio-image-wrap absolute inset-5 overflow-hidden rounded-[1.6rem] border border-white/60">
            {capabilities.map((item, index) => (
              <img
                key={item.name}
                className="stack-studio-image absolute inset-0 h-full w-full object-cover"
                src={stackImages[index] ?? stackImages[0]}
                alt={`Visual de ${item.name}`}
              />
            ))}
          </div>

          <div className="stack-studio-tools pointer-events-none absolute inset-0">
            {toolCloud.map((tool, index) => (
              <span
                key={tool}
                className="stack-studio-tool absolute rounded-full border border-ink/10 bg-white/86 px-4 py-2 text-xs font-black uppercase shadow-soft backdrop-blur"
                style={
                  {
                    "--x": `${9 + (index * 19) % 78}%`,
                    "--y": `${10 + (index * 31) % 78}%`,
                  } as CSSProperties
                }
              >
                {tool}
              </span>
            ))}
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-full bg-white/84 px-5 py-3 text-sm font-black shadow-soft backdrop-blur">
            <span>Mesa de herramientas</span>
            <span className="text-[color:var(--studio-accent)]">Scroll para mezclar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
