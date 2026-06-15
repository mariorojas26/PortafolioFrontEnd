import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "../types";

export function ProjectCard({ project, index, compact = false }: { project: Project; index: number; compact?: boolean }) {
  const location = useLocation();

  return (
    <Link
      to={`/proyectos/${project.slug}`}
      state={{ backgroundLocation: location, modalFrom: `${location.pathname}${location.search}` }}
      className={`project-row group ${compact ? "project-row-compact" : ""}`}
    >
      <span className="project-number">#{String(index + 1).padStart(2, "0")}</span>
      <div className="project-image-wrap">
        <img src={project.cover} alt={`Vista visual de ${project.title}`} loading="lazy" />
      </div>
      <div className="project-copy">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-ink/50">{project.category}</p>
            <h2>{project.title}</h2>
          </div>
          <span className="text-lg font-black">{project.year}</span>
        </div>
        <p>{project.summary}</p>
        <div className="flex flex-wrap gap-2">
          {project.roles.map((role) => (
            <span key={role} className="tag-chip">{role}</span>
          ))}
        </div>
      </div>
      <span className="project-arrow">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  );
}
