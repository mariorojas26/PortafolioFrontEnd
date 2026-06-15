import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";
import { VtexIO } from "./pages/VtexIO";

function ScrollToTop() {
  const location = useLocation();
  const { pathname, state } = location;

  useEffect(() => {
    if ((state as { backgroundLocation?: unknown } | null)?.backgroundLocation) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, state]);

  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proyectos" element={<Projects />} />
        <Route path="/proyectos/:slug" element={<ProjectDetail />} />
        <Route path="/vtex-io" element={<VtexIO />} />
      </Routes>
    </Layout>
  );
}
