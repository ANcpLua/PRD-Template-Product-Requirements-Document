import { useEffect, useState } from "react";

/** Section ids are slugs, so this separator cannot occur inside one. */
const SEPARATOR = "|";

/**
 * Track which section is currently in view and return its id, so the table of
 * contents can highlight the active entry. Uses one IntersectionObserver over
 * all section anchors; the topmost intersecting entry wins.
 *
 * The effect keys off the ids' *contents*, not the array's identity: callers
 * build the list inline, so depending on the array itself would tear down and
 * rebuild the observer every time the active section changed.
 */
export function useScrollSpy(ids: string[], rootMargin = "-20% 0px -70% 0px") {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");
  const key = ids.join(SEPARATOR);

  useEffect(() => {
    const sectionIds = key.split(SEPARATOR);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Pick the first id (document order) that is currently visible.
        const firstVisible = sectionIds.find((id) => visible.has(id));
        if (firstVisible) setActiveId(firstVisible);
      },
      { rootMargin, threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [key, rootMargin]);

  return activeId;
}
