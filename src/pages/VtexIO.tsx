import {
  ArrowUpRight,
  Boxes,
  Code2,
  Database,
  GitBranch,
  LayoutDashboard,
  LineChart,
  PenTool,
  Settings2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { MagneticLink } from "../components/MagneticLink";
import { profile, vtexProfile } from "../data/profile";
import { gsap, useGSAP } from "../lib/gsap";

const commerceStats = [
  { value: "PDP", label: "producto con foco en conversión" },
  { value: "PLP", label: "categorías claras y administrables" },
  { value: "CMS", label: "contenido editable desde Site Editor" },
  { value: "API", label: "GraphQL, REST, Master Data" },
];

const stackBlocks = [
  { icon: Code2, label: "React + TypeScript" },
  { icon: Settings2, label: "Site Editor" },
  { icon: Database, label: "Master Data" },
  { icon: ShoppingBag, label: "OrderForm" },
  { icon: LineChart, label: "CRO" },
  { icon: GitBranch, label: "Multi-repo" },
];

export function VtexIO() {
  const scope = useRef<HTMLElement>(null);
  const location = useLocation();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      gsap.from(".vtex-reveal", {
        y: 36,
        autoAlpha: 0,
        stagger: 0.06,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".vtex-card", {
        y: 42,
        autoAlpha: 0,
        stagger: 0.05,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".vtex-modules",
          start: "top 72%",
        },
      });

      gsap.to(".vtex-orbit", {
        rotate: 360,
        duration: 38,
        ease: "none",
        repeat: -1,
      });

      const hero = root.querySelector<HTMLElement>(".vtex-hero");
      const stage = root.querySelector<HTMLElement>(".vtex-stage");
      const pieces = Array.from(root.querySelectorAll<HTMLElement>(".vtex-parallax"));

      if (!hero || !stage || pieces.length === 0) return;

      const rotateXTo = gsap.quickTo(stage, "rotationX", { duration: 0.75, ease: "power3.out" });
      const rotateYTo = gsap.quickTo(stage, "rotationY", { duration: 0.75, ease: "power3.out" });
      const pieceX = pieces.map((piece, index) =>
        gsap.quickTo(piece, "x", { duration: 0.65 + index * 0.03, ease: "power3.out" }),
      );
      const pieceY = pieces.map((piece, index) =>
        gsap.quickTo(piece, "y", { duration: 0.65 + index * 0.03, ease: "power3.out" }),
      );

      const onPointerMove = (event: PointerEvent) => {
        if (window.innerWidth < 1024) return;

        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        rotateXTo(y * -7);
        rotateYTo(x * 9);
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

      hero.addEventListener("pointermove", onPointerMove);
      hero.addEventListener("pointerleave", onPointerLeave);

      return () => {
        hero.removeEventListener("pointermove", onPointerMove);
        hero.removeEventListener("pointerleave", onPointerLeave);
      };
    },
    { scope },
  );

  return (
    <main ref={scope} className="vtex-page overflow-hidden bg-[#F5F9FF] text-[#142032]">
      <section className="vtex-hero relative isolate min-h-[100dvh] px-5 pb-14 pt-24 md:pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFF3F6_0%,#F5F9FF_42%,#ffffff_42%,#ffffff_70%,#FFF3F6_70%)]" />
        <div className="absolute inset-x-0 top-0 h-44 bg-[#F71963]/10 blur-3xl" />
        <div className="relative mx-auto grid min-h-[calc(100dvh-7rem)] max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="vtex-reveal inline-flex items-center gap-2 rounded-full border border-[#F71963]/20 bg-white/80 px-4 py-2 text-sm font-black uppercase shadow-soft backdrop-blur">
              <Sparkles size={16} className="text-[#F71963]" />
              {vtexProfile.label}
            </div>
            <h1 className="vtex-reveal mt-6 max-w-[10ch] font-display text-[clamp(3.8rem,9vw,8.2rem)] font-black leading-[0.86] tracking-normal">
              VTEX IO Commerce Lab
            </h1>
            <p className="vtex-reveal mt-6 max-w-2xl text-balance text-lg font-semibold leading-snug text-[#142032]/72 md:text-2xl">
              {vtexProfile.intro}
            </p>
            <div className="vtex-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <MagneticLink to="/proyectos">Ver casos VTEX</MagneticLink>
              <a className="magnetic-link bg-[#F71963] text-white hover:bg-[#142032]" href="mailto:hola@mariorojas.dev">
                <span>Hablemos de eCommerce</span>
                <ArrowUpRight size={18} />
              </a>
            </div>
          </div>

          <div className="vtex-reveal relative min-h-[520px] perspective-hero">
            <div className="vtex-stage relative min-h-[520px] [transform-style:preserve-3d]">
              <div className="vtex-orbit pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#F71963]/30" />
              <div className="vtex-parallax absolute left-0 top-12 w-[72%] overflow-hidden rounded-[2rem] border-[10px] border-white bg-[#142032] text-white shadow-soft will-change-transform">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <span className="text-xs font-black uppercase text-white/50">storefront.workspace</span>
                  <Boxes size={18} className="text-[#F71963]" />
                </div>
                <div className="grid gap-3 p-5">
                  {stackBlocks.slice(0, 4).map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-[1rem] bg-white/8 px-4 py-3">
                      <span className="flex items-center gap-3 text-sm font-black">
                        <item.icon size={18} className="text-[#F71963]" />
                        {item.label}
                      </span>
                      <span className="size-2 rounded-full bg-[#F71963]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="vtex-parallax absolute bottom-4 right-0 w-[58%] rotate-3 overflow-hidden rounded-[1.6rem] border-[10px] border-white bg-white shadow-sticker will-change-transform">
                <img src="/assets/cover-motion.png" alt="Interfaz visual de comercio digital y front-end" className="h-80 w-full object-cover" />
              </div>
              <div className="vtex-parallax absolute right-6 top-2 rounded-full bg-[#F71963] px-5 py-3 text-sm font-black text-white shadow-soft will-change-transform">
                CMS editable
              </div>
              <div className="vtex-parallax absolute bottom-24 left-4 max-w-[260px] -rotate-3 rounded-[1.4rem] bg-white p-5 shadow-soft will-change-transform">
                <p className="text-xs font-black uppercase text-[#F71963]">Diferencial</p>
                <p className="mt-2 font-display text-3xl font-black leading-none">Código para devs. Control para negocio.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          {commerceStats.map((stat) => (
            <article key={stat.value} className="rounded-[1.4rem] border border-[#142032]/10 bg-white p-5 shadow-soft">
              <p className="font-display text-5xl font-black text-[#F71963]">{stat.value}</p>
              <p className="mt-3 text-sm font-black uppercase leading-tight text-[#142032]/58">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vtex-modules px-5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:items-end">
            <div>
              <p className="eyebrow text-[#F71963]">Lo que sé construir</p>
              <h2 className="max-w-3xl font-display text-[clamp(2.8rem,6vw,6.4rem)] font-black leading-[0.92]">
                VTEX no es solo código, es operación, UX y negocio.
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-semibold leading-snug text-[#142032]/70 md:text-xl">
              {vtexProfile.proof}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vtexProfile.modules.map((module) => (
              <article key={module.name} className="vtex-card min-h-[250px] rounded-[1.5rem] border border-[#142032]/10 bg-white p-6 shadow-soft">
                <div className="mb-8 grid size-12 place-items-center rounded-full bg-[#FFF3F6] text-[#F71963]">
                  <LayoutDashboard size={22} />
                </div>
                <h3 className="font-display text-3xl font-black leading-none">{module.name}</h3>
                <p className="mt-4 text-base font-semibold leading-snug text-[#142032]/70">{module.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-[#142032] p-6 text-white shadow-soft md:grid-cols-[0.82fr_1.18fr] md:p-10">
          <div>
            <p className="text-sm font-black uppercase text-[#F71963]">Cómo trabajo</p>
            <h2 className="mt-4 font-display text-[clamp(2.6rem,5vw,5.5rem)] font-black leading-[0.92]">
              Del negocio al componente escalable.
            </h2>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-snug text-white/68">
              {profile.positioning}
            </p>
          </div>
          <div className="grid gap-3">
            {vtexProfile.workflow.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-[1.1rem] bg-white/8 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F71963] font-black">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-black">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[2rem] border border-[#F71963]/20 bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-black uppercase text-[#F71963]">Siguiente paso</p>
            <h2 className="mt-2 max-w-3xl font-display text-4xl font-black leading-none md:text-6xl">
              Hagamos que una tienda se sienta simple, rápida y vendible.
            </h2>
          </div>
          <Link
            to="/proyectos/vtex-io-commerce-system"
            state={{ backgroundLocation: location, modalFrom: `${location.pathname}${location.search}` }}
            className="magnetic-link bg-[#F71963] text-white hover:bg-[#142032]"
          >
            <span>Ver proyecto VTEX</span>
            <PenTool size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
