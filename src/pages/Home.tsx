import { CapabilityArchive } from "../components/CapabilityArchive";
import { ImmersiveHero } from "../components/ImmersiveHero";
import { LiveCovers } from "../components/LiveCovers";
import { MagneticLink } from "../components/MagneticLink";
import { ProjectCard } from "../components/ProjectCard";
import { projects } from "../data/projects";

export function Home() {
  const featured = projects.filter((project) => project.featured).slice(0, 2);

  return (
    <main className="overflow-hidden">
      <ImmersiveHero />
      <div id="portadas">
        <LiveCovers />
      </div>
      <CapabilityArchive />
      <section className="section-shell bg-cream">
        <div className="section-heading">
          <p className="eyebrow">Solo una probadita</p>
          <h2>El home invita; la galería completa vive aparte.</h2>
        </div>
        <div className="space-y-5">
          {featured.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} compact />
          ))}
        </div>
        <div className="mt-8">
          <MagneticLink to="/proyectos">Entrar a proyectos</MagneticLink>
        </div>
      </section>
    </main>
  );
}
