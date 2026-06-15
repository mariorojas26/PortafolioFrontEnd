import type { Project } from "../types";

export const projects: Project[] = [
  {
    title: "VTEX IO Commerce System",
    slug: "vtex-io-commerce-system",
    category: "VTEX IO",
    year: "2026",
    roles: ["Arquitectura", "Front-end", "CMS editable"],
    tools: ["VTEX IO", "React", "TypeScript", "GraphQL", "Master Data"],
    summary:
      "Sistema eCommerce con componentes reutilizables, Site Editor, PDP, PLP, checkout y flujos pensados para operación real.",
    cover: "/assets/cover-design.png",
    gallery: ["/assets/cover-design.png", "/assets/cover-motion.png"],
    featured: true,
    accent: "#F71963",
  },
  {
    title: "BenditoAI Studio",
    slug: "benditoai-studio",
    category: "IA",
    year: "2026",
    roles: ["UX", "Front-end", "IA aplicada"],
    tools: ["React", "GSAP", "OpenAI", "Figma"],
    summary:
      "Experiencia para crear piezas visuales con IA, pensando en velocidad, criterio de marca y control creativo.",
    cover: "/assets/cover-ai.png",
    gallery: ["/assets/cover-ai.png", "/assets/project-collage.png"],
    featured: true,
    accent: "#3567ff",
  },
  {
    title: "Sistema Gráfico MR",
    slug: "sistema-grafico-mr",
    category: "Diseño Gráfico",
    year: "2026",
    roles: ["Dirección visual", "UI", "Brand assets"],
    tools: ["Figma", "Photoshop", "Illustrator", "Tailwind"],
    summary:
      "Archivo de componentes, posters y recursos visuales para construir identidades digitales con personalidad.",
    cover: "/assets/cover-design.png",
    gallery: ["/assets/cover-design.png", "/assets/project-collage.png"],
    featured: true,
    accent: "#ff6f61",
  },
  {
    title: "Motion Landing Lab",
    slug: "motion-landing-lab",
    category: "Desarrollo Web",
    year: "2025",
    roles: ["Front-end", "GSAP", "Performance"],
    tools: ["React", "TypeScript", "GSAP", "Vite"],
    summary:
      "Landing interactiva con transiciones fluidas, layout responsive y una experiencia pensada para provocar exploración.",
    cover: "/assets/cover-motion.png",
    gallery: ["/assets/cover-motion.png", "/assets/project-collage.png"],
    featured: true,
    accent: "#9ee8c6",
  },
  {
    title: "Campaña Visual Urbana",
    slug: "campana-visual-urbana",
    category: "Diseño Gráfico",
    year: "2025",
    roles: ["Concepto", "Composición", "Social assets"],
    tools: ["Photoshop", "Illustrator", "Figma"],
    summary:
      "Sistema de piezas para redes y anuncios donde el color, la jerarquía y el ritmo visual cargan la campaña.",
    cover: "/assets/project-collage.png",
    gallery: ["/assets/project-collage.png", "/assets/cover-design.png"],
    featured: false,
    accent: "#ffe06a",
  },
  {
    title: "UX Sprint Cards",
    slug: "ux-sprint-cards",
    category: "IA",
    year: "2024",
    roles: ["UX", "Prompting", "Producto"],
    tools: ["Figma", "OpenAI", "Notion"],
    summary:
      "Metodología visual para bajar ideas ambiguas a flujos, mensajes y prototipos accionables.",
    cover: "/assets/hero-archive.png",
    gallery: ["/assets/hero-archive.png", "/assets/cover-ai.png"],
    featured: false,
    accent: "#f05b93",
  },
];

export const projectCategories = ["Todos", "VTEX IO", "IA", "Diseño Gráfico", "Desarrollo Web"] as const;
