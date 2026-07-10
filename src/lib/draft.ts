import type { Block, Prd, Section } from "@/data/prd";

/** One editable row of the contacts table. */
export interface ContactRow {
  name: string;
  role: string;
  comment: string;
}

/** Editable front-matter for the document. */
export interface DraftMeta {
  product: string;
  author: string;
  date: string;
  status: string;
}

/**
 * The user's filled-in document. `answers` is keyed by section/subsection id;
 * `contacts` is the editable table. This is what gets persisted, exported, and
 * imported.
 */
export interface PrdDraft {
  version: 1;
  meta: DraftMeta;
  answers: Record<string, string>;
  contacts: ContactRow[];
}

/**
 * The single key every draft used to share. Read once, migrated into the
 * document library, then retired. See `lib/library.ts`.
 */
export const LEGACY_STORAGE_KEY = "prd-draft-v1";

/** Shown wherever a document has no "Product / feature" yet. */
export const UNTITLED = "Untitled PRD";

/** A document's display name is simply its product field. */
export function draftTitle(draft: PrdDraft): string {
  return draft.meta.product.trim() || UNTITLED;
}

/** Find the first contacts table in the document to seed default rows. */
function findContactRows(sections: Section[]): ContactRow[] {
  for (const section of sections) {
    const table = section.blocks?.find(
      (block): block is Extract<Block, { type: "table" }> =>
        block.type === "table"
    );
    if (table) {
      return table.rows.map((row) => ({
        name: row[0] ?? "",
        role: row[1] ?? "",
        comment: row[2] ?? "",
      }));
    }
  }
  return [];
}

/** A blank draft seeded with the template's default contact roles. */
export function createEmptyDraft(doc: Prd): PrdDraft {
  return {
    version: 1,
    meta: { product: "", author: "", date: "", status: "Draft" },
    answers: {},
    contacts: findContactRows(doc.sections),
  };
}

/** Fill in anything a stored or imported draft is missing. */
export function normalizeDraft(parsed: Partial<PrdDraft>, doc: Prd): PrdDraft {
  const empty = createEmptyDraft(doc);
  return {
    version: 1,
    meta: { ...empty.meta, ...parsed.meta },
    answers: { ...parsed.answers },
    contacts:
      Array.isArray(parsed.contacts) && parsed.contacts.length > 0
        ? parsed.contacts
        : empty.contacts,
  };
}

/** Parse a stored draft, falling back to a blank one. */
export function parseDraft(raw: string | null, doc: Prd): PrdDraft {
  if (!raw) return createEmptyDraft(doc);
  try {
    return normalizeDraft(JSON.parse(raw) as Partial<PrdDraft>, doc);
  } catch {
    return createEmptyDraft(doc);
  }
}

/** A new, empty contact row. */
export function emptyContactRow(): ContactRow {
  return { name: "", role: "", comment: "" };
}

/** URL/file-safe slug, e.g. "My Product" → "my-product". */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "prd"
  );
}

/** Trigger a client-side file download for the given text content. */
export function downloadFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
