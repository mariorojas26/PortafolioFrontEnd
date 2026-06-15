import { useRef } from "react";
import { covers } from "../data/covers";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import { MagneticLink } from "./MagneticLink";

export function LiveCovers() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cards = gsap.utils.toArray<HTMLElement>(".cover-card");
      const images = gsap.utils.toArray<HTMLElement>(".cover-image");

      gsap.set(cards, { y: reduceMotion ? 0 : 70, autoAlpha: 0, rotate: reduceMotion ? 0 : -2 });
      gsap.set(cards[0], { y: 0, autoAlpha: 1, rotate: 0 });

      if (reduceMotion) {
        gsap.set(cards, { autoAlpha: 1 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${covers.length * 620}`,
          pin: true,
          scrub: 0.8,
        },
      });

      cards.forEach((card, index) => {
        if (index === 0) return;
        timeline
          .to(cards[index - 1], { y: -70, autoAlpha: 0, rotate: 2, duration: 0.42, ease: "power2.inOut" })
          .to(card, { y: 0, autoAlpha: 1, rotate: 0, duration: 0.48, ease: "power2.out" }, "<0.12");
      });

      images.forEach((image) => {
        gsap.to(image, {
          yPercent: -9,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
          },
        });
      });

      ScrollTrigger.refresh();
    },
    { scope },
  );

  return (
    <section ref={scope} className="covers-pin relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#fff8e9_24%,#f5f9ff_58%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white to-transparent" />
      <div className="covers-viewport relative mx-auto flex min-h-[100dvh] max-w-7xl items-center px-5">
        <div className="covers-stack relative w-full">
          {covers.map((cover, index) => (
            <article
              key={cover.title}
              className="cover-card absolute inset-0 grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft md:grid-cols-[0.85fr_1.15fr]"
              style={{ backgroundColor: cover.bg }}
            >
              <div className="cover-copy flex flex-col justify-between p-6 md:p-10">
                <div className="flex items-center justify-between text-sm font-black uppercase">
                  <span>{cover.eyebrow}</span>
                  <span>{String(index + 1).padStart(2, "0")} / {String(covers.length).padStart(2, "0")}</span>
                </div>
                <div className="cover-main-copy max-w-xl">
                  <div className="mb-5 inline-flex rounded-full border border-ink/15 bg-white/65 px-4 py-2 text-sm font-black">
                    Mario Rojas
                  </div>
                  <h2 className="cover-title font-display font-black leading-[0.9] tracking-normal">
                    {cover.title}
                  </h2>
                  <p className="cover-subtitle mt-5 max-w-md text-balance font-semibold leading-snug text-ink/72">
                    {cover.subtitle}
                  </p>
                </div>
                <div className="cover-actions flex flex-wrap items-center gap-3">
                  <MagneticLink to="/proyectos">{cover.cta}</MagneticLink>
                  <span className="rounded-full border border-ink/12 bg-white/70 px-4 py-3 text-sm font-black">
                    Scroll para cambiar portada
                  </span>
                </div>
              </div>
              <div className="cover-visual relative overflow-hidden">
                <div className="absolute inset-4 rounded-[1.6rem] border border-ink/10 bg-paper/40" />
                <img className="cover-image absolute inset-0 h-full w-full object-cover" src={cover.image} alt="" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-full bg-paper/80 px-5 py-3 text-sm font-black shadow-soft backdrop-blur-md">
                  <span>Archivo visual</span>
                  <span style={{ color: cover.accent }}>#{cover.title.split(" ")[0]}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
