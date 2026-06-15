import { useMemo, useRef, useState } from "react";
import { ProjectCard } from "../components/ProjectCard";
import { projectCategories, projects } from "../data/projects";
import { gsap, useGSAP } from "../lib/gsap";
import type { ProjectCategory } from "../types";

type Filter = "Todos" | ProjectCategory;

export function Projects() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const scope = useRef<HTMLElement>(null);

  const visibleProjects = useMemo(() => {
    if (filter === "Todos") return projects;
    return projects.filter((project) => project.category === filter);
  }, [filter]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".projects-hero > *", {
        y: 38,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from(".project-row", {
        y: 44,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.75,
        ease: "power3.out",
      });
    },
    { scope, dependencies: [filter], revertOnUpdate: true },
  );

  return (
    <main ref={scope} className="min-h-screen bg-paper px-5 pb-20 pt-28">
      <section className="projects-hero mx-auto max-w-7xl border-b border-ink/10 pb-10">
        <p className="eyebrow">Galeria dedicada</p>
        <div className="grid gap-8 md:grid-cols-[1fr_0.7fr] md:items-end">
          <h1 className="font-display text-[clamp(3.5rem,10vw,9.8rem)] font-black leading-[0.9]">Proyectos</h1>
          <p className="max-w-xl text-xl font-semibold leading-snug text-ink/70">
            Una selección editable desde código, organizada por VTEX IO, IA, diseño gráfico y desarrollo web.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {projectCategories.map((category) => (
            <button
              key={category}
              className={`filter-chip ${filter === category ? "filter-chip-active" : ""}`}
              onClick={() => setFilter(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>
      <section className="mx-auto mt-8 max-w-7xl space-y-5">
        {visibleProjects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </section>
    </main>
  );
}
