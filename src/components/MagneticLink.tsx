import { ArrowUpRight } from "lucide-react";
import { Link, type LinkProps } from "react-router-dom";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { gsap } from "../lib/gsap";

type MagneticLinkProps = LinkProps & {
  children: ReactNode;
  variant?: "dark" | "light";
};

export function MagneticLink({ children, variant = "dark", className = "", ...props }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const move = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      x: (event.clientX - rect.left - rect.width / 2) * 0.18,
      y: (event.clientY - rect.top - rect.height / 2) * 0.22,
      duration: 0.3,
      ease: "power3.out",
    });
  };

  const reset = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.45)" });
  };

  return (
    <Link
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      className={`magnetic-link ${variant === "light" ? "magnetic-light" : ""} ${className}`}
      {...props}
    >
      <span>{children}</span>
      <ArrowUpRight size={18} />
    </Link>
  );
}
