import type { Section } from "@/data/prd";
import { cn } from "@/lib/utils";
import { useScrollSpy } from "@/hooks/useScrollSpy";

interface TableOfContentsProps {
  sections: Section[];
}

/** Sticky table of contents with scroll-spy highlighting of the active entry. */
export function TableOfContents({ sections }: TableOfContentsProps) {
  // Flatten section + subsection ids in document order for the spy.
  const ids = sections.flatMap((section) => [
    section.id,
    ...(section.subsections?.map((sub) => sub.id) ?? []),
  ]);
  const activeId = useScrollSpy(ids);

  return (
    <nav className="prd-toc" aria-label="Table of contents">
      <p className="prd-toc__title">On this page</p>
      <ol className="prd-toc__list">
        {sections.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn(
                  "prd-toc__link",
                  active && "prd-toc__link--active"
                )}
                aria-current={active ? "location" : undefined}
              >
                <span className="prd-toc__num">{section.number}</span>
                {section.title}
              </a>
              {section.subsections && (
                <ol className="prd-toc__sublist">
                  {section.subsections.map((sub) => {
                    const subActive = activeId === sub.id;
                    return (
                      <li key={sub.id}>
                        <a
                          href={`#${sub.id}`}
                          className={cn(
                            "prd-toc__link prd-toc__link--sub",
                            subActive && "prd-toc__link--active"
                          )}
                          aria-current={subActive ? "location" : undefined}
                        >
                          <span className="prd-toc__num">{sub.number}</span>
                          {sub.title}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
