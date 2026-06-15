export type ProjectCategory = "IA" | "Diseño Gráfico" | "Desarrollo Web" | "VTEX IO";

export type Project = {
  title: string;
  slug: string;
  category: ProjectCategory;
  year: string;
  roles: string[];
  tools: string[];
  summary: string;
  cover: string;
  gallery: string[];
  featured: boolean;
  accent: string;
};

export type Capability = {
  name: string;
  short: string;
  description: string;
  tools: string[];
  accent: string;
};

export type HomeCover = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  accent: string;
  bg: string;
};
