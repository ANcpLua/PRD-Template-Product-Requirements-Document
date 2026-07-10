import type { Prd } from "@/data/prd";
import {
  createEmptyDraft,
  draftTitle,
  LEGACY_STORAGE_KEY,
  parseDraft,
  type PrdDraft,
} from "@/lib/draft";

/** Index of every document in this browser, and which one is open. */
export const LIBRARY_KEY = "prd-library-v1";

/** Each document's content lives under its own key, never a shared one. */
export const docKey = (id: string): string => `prd-doc-v1:${id}`;

export interface DocSummary {
  id: string;
  title: string;
  /** Epoch ms of the last write, for ordering the switcher. */
  updatedAt: number;
}

export interface Library {
  version: 1;
  activeId: string;
  docs: DocSummary[];
}

/**
 * Some browsers throw on `localStorage` access outright rather than on write
 * (blocked third-party storage, hardened privacy modes). The library is built
 * at module load, so a read that throws would leave the page blank.
 */
function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `d${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function isLibrary(value: unknown): value is Library {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Library>;
  return (
    Array.isArray(candidate.docs) &&
    typeof candidate.activeId === "string" &&
    candidate.docs.every(
      (doc) => typeof doc?.id === "string" && typeof doc?.title === "string"
    )
  );
}

export function readLibrary(): Library | null {
  const raw = safeGetItem(LIBRARY_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isLibrary(parsed) || parsed.docs.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLibrary(library: Library): void {
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function readDoc(id: string, doc: Prd): PrdDraft {
  return parseDraft(safeGetItem(docKey(id)), doc);
}

export function writeDoc(id: string, draft: PrdDraft): void {
  window.localStorage.setItem(docKey(id), JSON.stringify(draft));
}

export function removeDoc(id: string): void {
  window.localStorage.removeItem(docKey(id));
}

function summary(id: string, draft: PrdDraft, updatedAt: number): DocSummary {
  return { id, title: draftTitle(draft), updatedAt };
}

/**
 * Produce the library this browser should start from.
 *
 * A pre-library draft lives under one shared key, so opening a second product
 * used to overwrite the first. Adopt that draft as the first document rather
 * than discarding it, and only retire the old key once the new copy is safely
 * written — if the write throws (private mode, full quota), the original stays
 * exactly where it was.
 */
export function initLibrary(doc: Prd, now: number): Library {
  const existing = readLibrary();
  if (existing) {
    // A library whose active id points at nothing would render a blank editor.
    const active = existing.docs.some((d) => d.id === existing.activeId)
      ? existing.activeId
      : existing.docs[0].id;
    return { ...existing, activeId: active };
  }

  const legacyRaw = safeGetItem(LEGACY_STORAGE_KEY);
  const id = newId();
  const draft = legacyRaw ? parseDraft(legacyRaw, doc) : createEmptyDraft(doc);
  const library: Library = {
    version: 1,
    activeId: id,
    docs: [summary(id, draft, now)],
  };

  try {
    writeDoc(id, draft);
    writeLibrary(library);
    if (legacyRaw) window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage is unavailable. Run from memory; the toolbar surfaces the error
    // on the first save attempt. Crucially, the legacy draft is left intact.
  }

  return library;
}

/** Reorder for display: most recently edited first. */
export function sortDocs(docs: DocSummary[]): DocSummary[] {
  return [...docs].sort((a, b) => b.updatedAt - a.updatedAt);
}
