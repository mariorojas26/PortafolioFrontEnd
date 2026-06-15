import { Menu, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isProjectOverlay = /^\/proyectos\/[^/]+/.test(pathname);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {!isProjectOverlay && (
        <header className="fixed left-3 right-3 top-3 z-50 md:left-5 md:right-5">
          <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-ink/10 bg-paper/80 px-3 shadow-soft backdrop-blur-xl md:px-5">
            <NavLink to="/" className="group flex items-center gap-2 font-sans text-sm font-black uppercase tracking-normal">
              <span className="grid size-8 place-items-center rounded-full bg-ink text-paper transition-transform duration-300 group-hover:rotate-12">
                MR
              </span>
              <span className="hidden sm:inline">Archivo Creativo</span>
            </NavLink>
            <div className="hidden items-center gap-1 rounded-full bg-white/60 p-1 text-sm font-bold md:flex">
              <NavLink className={({ isActive }) => `nav-pill ${isActive ? "nav-pill-active" : ""}`} to="/">
                Inicio
              </NavLink>
              <NavLink className={({ isActive }) => `nav-pill ${isActive ? "nav-pill-active" : ""}`} to="/proyectos">
                Proyectos
              </NavLink>
              <NavLink className={({ isActive }) => `nav-pill ${isActive ? "bg-[#F71963] text-white hover:bg-[#F71963] hover:text-white" : "text-[#F71963]"}`} to="/vtex-io">
                VTEX
              </NavLink>
            </div>
            <a className="hidden items-center gap-2 rounded-full bg-lemon px-4 py-2 text-sm font-black text-ink transition-transform duration-300 hover:-translate-y-0.5 md:flex" href="mailto:hola@mariorojas.dev">
              <Sparkles size={16} />
              Hablemos
            </a>
            <div className="flex items-center gap-2 md:hidden">
              <NavLink to="/vtex-io" className="rounded-full bg-[#F71963] px-4 py-2 text-xs font-black text-white" aria-label="Abrir sección VTEX IO">
                VTEX
              </NavLink>
              <NavLink to="/proyectos" className="grid size-10 place-items-center rounded-full bg-ink text-paper" aria-label="Abrir proyectos">
                <Menu size={18} />
              </NavLink>
            </div>
          </nav>
        </header>
      )}
      {children}
      {!isProjectOverlay && (
        <footer className="border-t border-ink/10 bg-ink px-5 py-10 text-paper">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase text-paper/60">Mario Rojas</p>
              <p className="mt-2 max-w-xl font-display text-3xl font-black leading-tight md:text-5xl">
                Diseño, IA, eCommerce y front-end para experiencias que dan ganas de explorar.
              </p>
            </div>
            <div className="flex gap-3 text-sm font-bold">
              <a className="footer-link" href="mailto:hola@mariorojas.dev">Email</a>
              <a className="footer-link" href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
              <a className="footer-link" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
