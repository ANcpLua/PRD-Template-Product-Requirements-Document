import { prdStore } from "@/state/prdStore";
import { useMeta } from "@/state/prdDraft";
import type { DraftMeta } from "@/lib/draft";

const FIELDS: {
  key: keyof DraftMeta;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  {
    key: "product",
    label: "Product / feature",
    placeholder: "e.g. Acme Inbox",
  },
  { key: "author", label: "Author", placeholder: "Your name" },
  { key: "date", label: "Date", placeholder: "", type: "date" },
  { key: "status", label: "Status", placeholder: "Draft" },
];

/** Editable front-matter card for the document's identifying details. */
export function DocMeta() {
  const meta = useMeta();

  return (
    <section className="prd-meta" aria-label="Document details">
      <div className="prd-meta__grid">
        {FIELDS.map((field) => (
          <label key={field.key} className="prd-field">
            <span className="prd-field__label">{field.label}</span>
            <input
              className="prd-input"
              type={field.type ?? "text"}
              value={meta[field.key]}
              placeholder={field.placeholder}
              onChange={(event) =>
                prdStore.setMeta(field.key, event.target.value)
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
