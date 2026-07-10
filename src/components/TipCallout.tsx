import type { RefLink } from "@/data/prd";

interface TipCalloutProps {
  text: string;
  links?: RefLink[];
}

/**
 * A guidance note, set as marginalia rather than an alert.
 *
 * There is no icon: every one of these carried the same bulb, so it identified
 * nothing and simply repeated the border. The warm rule does that job, and the
 * `aria-label` tells assistive tech what the rule conveys visually.
 */
export function TipCallout({ text, links }: TipCalloutProps) {
  return (
    <aside className="prd-tip" aria-label="Tip">
      <p className="prd-tip__text">{text}</p>
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
    </aside>
  );
}
