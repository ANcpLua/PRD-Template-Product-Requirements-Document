import { useEffect, useState } from "react";

/**
 * Track which section is currently in view and return its id, so the table of
 * contents can highlight the active entry. Uses one IntersectionObserver over
 * all section anchors; the topmost intersecting entry wins.
 */
export function useScrollSpy(ids: string[], rootMargin = "-20% 0px -70% 0px") {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        // Pick the first id (document order) that is currently visible.
        const firstVisible = ids.find((id) => visible.has(id));
        if (firstVisible) setActiveId(firstVisible);
      },
      { rootMargin, threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids, rootMargin]);

  return activeId;
}
