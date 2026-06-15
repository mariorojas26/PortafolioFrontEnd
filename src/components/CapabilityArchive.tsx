import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef } from "react";
import { capabilities } from "../data/capabilities";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";

const stackImages = [
  "/assets/project-collage.png",
  "/assets/cover-motion.png",
  "/assets/archive-process.png",
  "/assets/archive-design.png",
  "/assets/archive-ai-motion.png",
];

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

          const panels = gsap.utils.toArray<HTMLElement>(".stack-copy-panel");
          const steps = gsap.utils.toArray<HTMLElement>(".stack-workflow-step");
          const imagePanels = gsap.utils.toArray<HTMLElement>(".stack-image-panel");

          if (reduceMotion) {
            gsap.set([panels, steps, imagePanels, ".stack-image-frame", ".stack-workflow-line-fill"], {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
            });
            return;
          }

          gsap.from([".stack-reel-kicker", ".stack-workflow", ".stack-image-frame"], {
            autoAlpha: 0,
            y: 28,
            stagger: 0.08,
            duration: 0.72,
            ease: "power4.out",
            scrollTrigger: {
              trigger: root,
              start: "top 78%",
              once: true,
            },
          });

          gsap.to(".stack-image-media", {
            scale: 1.08,
            yPercent: -5,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          });

          if (!desktop) {
            gsap.set(imagePanels, { autoAlpha: 0, scale: 1 });
            gsap.set(imagePanels[0], { autoAlpha: 1 });

            panels.forEach((panel) => {
              gsap.from(panel, {
                autoAlpha: 0,
                y: 54,
                scale: 0.96,
                duration: 0.72,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: panel,
                  start: "top 82%",
                  toggleActions: "play none none reverse",
                },
              });
            });
            return;
          }

          gsap.set(panels, {
            autoAlpha: 0,
            y: 80,
            scale: 0.94,
            rotation: 2,
            transformOrigin: "left center",
          });
          gsap.set(panels[0], { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
          gsap.set(steps, { autoAlpha: 0.48 });
          gsap.set(steps[0], { autoAlpha: 1 });
          gsap.set(imagePanels, { autoAlpha: 0, scale: 1.06, xPercent: 4, rotation: 1.2 });
          gsap.set(imagePanels[0], { autoAlpha: 1, scale: 1, xPercent: 0, rotation: 0 });
          gsap.set(".stack-workflow-line-fill", { scaleX: 1 / panels.length, transformOrigin: "left center" });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${panels.length * 640}`,
              scrub: 0.85,
              pin: true,
              anticipatePin: 1,
            },
          });

          panels.forEach((panel, index) => {
            if (index === 0) return;

            timeline
              .to(
                panels[index - 1],
                {
                  autoAlpha: 0,
                  y: -72,
                  scale: 0.94,
                  rotation: -2,
                  duration: 0.58,
                  ease: "power3.inOut",
                },
                `skill-${index}`,
              )
              .fromTo(
                panel,
                {
                  autoAlpha: 0,
                  y: 86,
                  scale: 0.94,
                  rotation: 2,
                },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  rotation: 0,
                  duration: 0.68,
                  ease: "power4.out",
                },
                `skill-${index}+=0.08`,
              )
              .to(steps[index - 1], { autoAlpha: 0.48, duration: 0.24 }, `skill-${index}`)
              .to(steps[index], { autoAlpha: 1, duration: 0.32 }, `skill-${index}+=0.12`)
              .to(".stack-workflow-line-fill", { scaleX: (index + 1) / panels.length, duration: 0.68, ease: "none" }, `skill-${index}`)
              .to(
                imagePanels[index - 1],
                {
                  autoAlpha: 0,
                  scale: 1.08,
                  xPercent: -4,
                  rotation: -1.2,
                  duration: 0.58,
                  ease: "power3.inOut",
                },
                `skill-${index}`,
              )
              .fromTo(
                imagePanels[index],
                {
                  autoAlpha: 0,
                  scale: 1.08,
                  xPercent: 5,
                  rotation: 1.4,
                },
                {
                  autoAlpha: 1,
                  scale: 1,
                  xPercent: 0,
                  rotation: 0,
                  duration: 0.74,
                  ease: "power3.out",
                },
                `skill-${index}+=0.06`,
              )
              .to(
                ".stack-image-frame",
                {
                  "--active-accent": capabilities[index].accent,
                  rotation: index % 2 === 0 ? -1.2 : 1.2,
                  scale: 1 + index * 0.006,
                  duration: 0.68,
                  ease: "power2.inOut",
                },
                `skill-${index}`,
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
    <section ref={scope} className="stack-reel-section relative overflow-hidden bg-white">
      <div className="stack-reel-backdrop absolute inset-0" />
      <div className="stack-reel-pin relative min-h-[100dvh] px-5 py-20 md:py-24">
        <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-7xl flex-col justify-center gap-8">
          <div className="stack-reel-top relative z-30">
            <p className="stack-reel-kicker eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-4 py-2 shadow-soft backdrop-blur">
              <Sparkles size={15} />
              Workflow de habilidades
            </p>

            <div className="stack-workflow relative overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white/76 p-2 shadow-soft backdrop-blur">
              <div className="stack-workflow-line absolute left-5 right-5 top-1/2 h-px -translate-y-1/2 bg-ink/10" />
              <div className="stack-workflow-line-fill absolute left-5 top-1/2 h-[3px] w-[calc(100%-2.5rem)] -translate-y-1/2 rounded-full bg-ink" />
              <div className="stack-workflow-steps relative z-10 flex gap-2 overflow-x-auto lg:grid lg:grid-cols-5">
                {capabilities.map((item, index) => (
                  <div
                    key={item.name}
                    className="stack-workflow-step rounded-[1rem] border border-ink/10 bg-paper/90 px-4 py-3 shadow-[0_12px_28px_rgba(21,21,21,0.06)]"
                    style={{ "--accent": item.accent } as CSSProperties}
                  >
                    <span className="block text-xs font-black text-[color:var(--accent)]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mt-1 block text-sm font-black uppercase leading-tight text-ink">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
            <div className="stack-copy-stage relative min-h-[530px] lg:min-h-[560px]">
              {capabilities.map((item, index) => (
                <article
                  key={item.name}
                  className="stack-copy-panel absolute inset-0 flex flex-col justify-center"
                  style={{ "--accent": item.accent } as CSSProperties}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-black uppercase text-white shadow-soft">
                      {item.short}
                    </span>
                    <span className="font-display text-7xl font-black leading-none text-ink/10">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="max-w-[9ch] font-display text-[clamp(4.2rem,8vw,8.4rem)] font-black leading-[0.8] text-ink">
                    {item.name}
                  </h2>
                  <p className="mt-6 max-w-2xl text-balance text-xl font-semibold leading-snug text-ink/66 md:text-2xl">
                    {item.description}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {item.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-ink/10 bg-white/82 px-4 py-2 text-sm font-black shadow-soft">
                        {tool}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div
              className="stack-image-frame relative min-h-[520px] overflow-hidden rounded-[2rem] border border-ink/10 bg-paper shadow-sticker lg:min-h-[620px]"
              style={{ "--active-accent": capabilities[0].accent } as CSSProperties}
            >
              <div className="stack-image-accent absolute inset-0" />
              {capabilities.map((item, index) => (
                <figure key={item.name} className="stack-image-panel absolute inset-0">
                  <img
                    className="stack-image-media absolute inset-0 h-full w-full object-cover"
                    src={stackImages[index] ?? stackImages[0]}
                    alt={`Visual de ${item.name}`}
                  />
                </figure>
              ))}
              <div className="absolute inset-4 rounded-[1.55rem] border border-white/50" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-full bg-white/82 px-5 py-3 text-sm font-black shadow-soft backdrop-blur">
                <span>Archivo visual</span>
                <span className="text-[color:var(--active-accent)]">Mario Rojas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
