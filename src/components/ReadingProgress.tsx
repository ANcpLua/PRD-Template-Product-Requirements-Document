import { useEffect, useRef, useState } from "react";

/** A thin fixed bar at the top of the viewport showing scroll progress. */
export function ReadingProgress() {
  // Whole percent, for the accessible value. The bar itself is driven through
  // the ref, so scrolling does not re-render this component on every pixel.
  const [percent, setPercent] = useState(0);
  const bar = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reading `scrollHeight` forces a layout, so measure it on resize rather
    // than on every scroll event, and coalesce scrolls into one read a frame.
    let scrollable = 0;
    let frame = 0;
    let shown = -1;

    const paint = () => {
      frame = 0;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      const clamped = Math.min(1, Math.max(0, ratio));
      if (bar.current) bar.current.style.transform = `scaleX(${clamped})`;

      const rounded = Math.round(clamped * 100);
      if (rounded !== shown) {
        shown = rounded;
        setPercent(rounded);
      }
    };

    const measure = () => {
      scrollable = document.documentElement.scrollHeight - window.innerHeight;
      paint();
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(paint);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);

    // Answers grow the page as they are typed into; re-measure when they do,
    // rather than paying for a layout read on every scroll event.
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      className="prd-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div ref={bar} className="prd-progress__bar" />
    </div>
  );
}
