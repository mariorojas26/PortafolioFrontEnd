import type { Capability } from "../types";

export const capabilities: Capability[] = [
  {
    name: "VTEX IO",
    short: "Mi fuerte",
    description:
      "Componentes configurables, PDP, PLP, checkout, Master Data, Site Editor y arquitectura eCommerce lista para escalar.",
    tools: ["VTEX IO", "Site Editor", "GraphQL", "Master Data"],
    accent: "#F71963",
  },
  {
    name: "Arquitectura front-end",
    short: "Código que crece",
    description:
      "React, TypeScript, Sass y componentes reutilizables, mantenibles y pensados para equipos reales.",
    tools: ["React", "TypeScript", "Sass", "Git"],
    accent: "#3567ff",
  },
  {
    name: "UX/UI estratégico",
    short: "Claridad antes del show",
    description:
      "Flujos, wireframes, sistemas visuales y decisiones enfocadas en conversión, accesibilidad y administración.",
    tools: ["User flows", "Wireframes", "Design Systems"],
    accent: "#9ee8c6",
  },
  {
    name: "Diseño gráfico",
    short: "Visuales con carácter",
    description:
      "Composición, color, branding, iconografía, tipografía y assets digitales que elevan la experiencia.",
    tools: ["Figma", "Photoshop", "Illustrator"],
    accent: "#ff6f61",
  },
  {
    name: "IA aplicada",
    short: "Productividad creativa",
    description:
      "Uso IA para prototipar, documentar, investigar, automatizar tareas y aumentar la calidad del producto.",
    tools: ["OpenAI", "Prompts", "Automatización"],
    accent: "#d8c5ff",
  },
];
