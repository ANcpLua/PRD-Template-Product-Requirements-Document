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

export const STORAGE_KEY = "prd-draft-v1";

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

/** Load a persisted draft, falling back to a blank one. */
export function loadDraft(doc: Prd): PrdDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyDraft(doc);
    const parsed = JSON.parse(raw) as Partial<PrdDraft>;
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
