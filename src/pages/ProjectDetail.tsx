import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MagneticLink } from "../components/MagneticLink";
import { projects } from "../data/projects";

type ModalLocationState = {
  backgroundLocation?: Location;
  modalFrom?: string;
};

export function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ModalLocationState | null;
  const project = projects.find((item) => item.slug === slug);

  const closeProject = () => {
    if (state?.backgroundLocation) {
      navigate(-1);
      return;
    }

    navigate(state?.modalFrom || "/proyectos", { replace: true });
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProject();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  if (!project) {
    return (
      <main className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-paper px-5 text-center">
        <button
          aria-label="Cerrar proyecto"
          className="fixed right-5 top-5 z-[80] grid size-12 cursor-pointer place-items-center rounded-full bg-ink text-paper shadow-soft transition-transform duration-300 hover:rotate-6 md:right-8 md:top-8"
          onClick={closeProject}
          type="button"
        >
          <X size={22} />
        </button>
        <div>
          <p className="eyebrow">No encontrado</p>
          <h1 className="font-display text-6xl font-black">Este proyecto no está en el archivo.</h1>
          <div className="mt-8 flex justify-center">
            <MagneticLink to="/proyectos">Volver a proyectos</MagneticLink>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-paper">
      <button
        aria-label="Cerrar proyecto"
        className="fixed right-5 top-5 z-[80] grid size-12 cursor-pointer place-items-center rounded-full bg-ink text-paper shadow-soft transition-transform duration-300 hover:rotate-6 md:right-8 md:top-8"
        onClick={closeProject}
        type="button"
      >
        <X size={22} />
      </button>

      <article className="mx-auto min-h-[100dvh] max-w-7xl px-5 pb-16 pt-8 md:pb-20 md:pt-10">
        <header className="grid gap-8 pr-12 md:grid-cols-[1fr_0.55fr] md:items-end md:pr-20">
          <div>
            <p className="eyebrow">{project.category} / {project.year}</p>
            <h1 className="font-display text-[clamp(3.3rem,8vw,8.2rem)] font-black leading-[0.9]">{project.title}</h1>
          </div>
          <p className="text-xl font-semibold leading-snug text-ink/70">{project.summary}</p>
        </header>

        <div className="mt-8 overflow-hidden rounded-[2rem] border-[10px] border-white bg-white shadow-soft md:mt-10">
          <img src={project.cover} alt={`Cover de ${project.title}`} className="h-[360px] w-full object-cover md:h-[560px]" />
        </div>

        <section className="mt-8 grid gap-6 md:mt-10 md:grid-cols-3">
          <InfoBlock title="Rol" items={project.roles} />
          <InfoBlock title="Herramientas" items={project.tools} />
          <div className="rounded-[1.4rem] bg-ink p-6 text-paper">
            <p className="text-sm font-black uppercase text-paper/55">Acción</p>
            <a className="mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-black text-ink" href="mailto:hola@mariorojas.dev">
              Crear algo parecido
              <ExternalLink size={16} />
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2">
          {project.gallery.map((image) => (
            <img key={image} className="h-[320px] w-full rounded-[1.6rem] border-[8px] border-white object-cover shadow-soft md:h-[360px]" src={image} alt="" />
          ))}
        </section>
      </article>
    </main>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.4rem] border border-ink/10 bg-white p-6">
      <p className="text-sm font-black uppercase text-ink/50">{title}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="tag-chip">{item}</span>
        ))}
      </div>
    </div>
  );
}
