import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fade-and-rise its children into view the first time they enter the viewport.
 * Pure CSS transition driven by a class toggle; the global reduced-motion
 * media query in prd.css neutralizes the movement for users who opt out.
 */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("prd-reveal", shown && "prd-reveal--in", className)}
    >
      {children}
    </div>
  );
}
