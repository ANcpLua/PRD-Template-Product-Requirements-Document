import type { RefLink } from "@/data/prd";

interface TipCalloutProps {
  text: string;
  links?: RefLink[];
}

/** A distinct, low-key "💡 tip" callout for the template's guidance notes. */
export function TipCallout({ text, links }: TipCalloutProps) {
  return (
    <aside className="prd-tip" aria-label="Tip">
      <span className="prd-tip__icon" aria-hidden="true">
        💡
      </span>
      <div className="prd-tip__body">
        <p>{text}</p>
        {links && links.length > 0 && (
          <ul className="prd-tip__links">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
