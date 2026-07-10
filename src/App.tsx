import { prd } from "@/data/prd";
import { AnswerField } from "@/components/AnswerField";
import { DocMeta } from "@/components/DocMeta";
import { DocSwitcher } from "@/components/DocSwitcher";
import { Hero } from "@/components/Hero";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Reveal } from "@/components/Reveal";
import { SectionBlocks } from "@/components/SectionBlocks";
import { TableOfContents } from "@/components/TableOfContents";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function App() {
  return (
    <>
      <a className="prd-skip-link" href="#main">
        Skip to content
      </a>
      <ReadingProgress />

      <div className="prd-topbar">
        <span className="prd-topbar__brand">{prd.brand}</span>
        <ThemeToggle />
      </div>

      <Hero />

      <div className="prd-layout">
        <aside className="prd-sidebar">
          <TableOfContents sections={prd.sections} />
        </aside>

        <main id="main" className="prd-main">
          <DocSwitcher />
          <DocMeta />

          {prd.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="prd-section"
              aria-labelledby={`${section.id}-heading`}
            >
              <Reveal>
                <h2 id={`${section.id}-heading`} className="prd-section__title">
                  <a
                    className="prd-section__anchor"
                    href={`#${section.id}`}
                    aria-label={`Link to section ${section.number}: ${section.title}`}
                  >
                    #
                  </a>
                  <span className="prd-section__num">{section.number}</span>
                  {section.title}
                </h2>

                {section.blocks && <SectionBlocks blocks={section.blocks} />}

                {section.subsections ? (
                  section.subsections.map((sub) => (
                    <div
                      key={sub.id}
                      id={sub.id}
                      className="prd-subsection"
                      aria-labelledby={`${sub.id}-heading`}
                    >
                      <h3
                        id={`${sub.id}-heading`}
                        className="prd-subsection__title"
                      >
                        <a
                          className="prd-section__anchor"
                          href={`#${sub.id}`}
                          aria-label={`Link to ${sub.number} ${sub.title}`}
                        >
                          #
                        </a>
                        <span className="prd-subsection__num">
                          {sub.number}
                        </span>
                        {sub.title}
                      </h3>
                      <SectionBlocks blocks={sub.blocks} />
                      <AnswerField id={sub.id} label={sub.title} />
                    </div>
                  ))
                ) : (
                  <AnswerField id={section.id} label={section.title} />
                )}
              </Reveal>
            </section>
          ))}

          <footer className="prd-footer">
            <p>{prd.footer.text}</p>
            <a
              href={prd.footer.source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {prd.footer.source.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          </footer>
        </main>
      </div>
    </>
  );
}
