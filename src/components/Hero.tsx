import { prd } from "@/data/prd";
import { Toolbar } from "@/components/Toolbar";

/** Split a heading into words so each can animate in with a small stagger. */
function AnimatedTitle({ text }: { text: string }) {
  return (
    <h1 className="prd-hero__title">
      {text.split(" ").map((word, index) => (
        <span
          key={index}
          className="prd-hero__word"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          {word}
        </span>
      ))}
    </h1>
  );
}

/** The document header: eyebrow, animated title, subtitle, intro, actions. */
export function Hero() {
  const sectionCount = prd.sections.length;

  return (
    <header className="prd-hero">
      <div className="prd-hero__aurora" aria-hidden="true" />
      <div className="prd-hero__inner">
        <p className="prd-hero__eyebrow">{prd.meta.eyebrow}</p>
        <AnimatedTitle text={prd.meta.title} />
        <p className="prd-hero__subtitle">{prd.meta.subtitle}</p>
        <p className="prd-hero__intro">
          {prd.meta.intro}{" "}
          <a
            href={prd.meta.source.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more
            <span aria-hidden="true"> ↗</span>
          </a>
        </p>
        <div className="prd-hero__meta">
          <span className="prd-chip">{sectionCount} sections</span>
          <span className="prd-chip">Fill in &amp; autosave</span>
          <span className="prd-chip">Download as Markdown</span>
        </div>
        <Toolbar />
      </div>
    </header>
  );
}
