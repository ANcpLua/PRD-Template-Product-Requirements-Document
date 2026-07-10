import { prd } from "@/data/prd";
import {
  createEmptyDraft,
  draftTitle,
  type ContactRow,
  type DraftMeta,
  type PrdDraft,
} from "@/lib/draft";
import {
  docKey,
  initLibrary,
  newId,
  readDoc,
  removeDoc,
  sortDocs,
  writeLibrary,
  type DocSummary,
  type Library,
} from "@/lib/library";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Quiet period after the last edit before the draft is written. */
const DEBOUNCE_MS = 800;
/** Write at least this often while the user is typing continuously. */
const MAX_WAIT_MS = 5000;
/** How long the "All changes saved" confirmation lingers. */
const SAVED_LINGER_MS = 1600;

/**
 * A slot names the smallest thing a component can subscribe to. Typing in one
 * answer notifies `answer:<id>` and nothing else, so the other textareas, the
 * front-matter card, the contacts table and the toolbar never re-render.
 */
type Slot = string;
type Listener = () => void;

const answerSlot = (id: string): Slot => `answer:${id}`;
const META: Slot = "meta";
const CONTACTS: Slot = "contacts";
const SAVE: Slot = "save";
const LIBRARY: Slot = "library";

type IdleHandle = { kind: "idle" | "timeout"; id: number };

/** Schedule work for the next idle moment, so a write never lands mid-keystroke. */
function whenIdle(fn: () => void): IdleHandle {
  if (typeof requestIdleCallback === "function") {
    return { kind: "idle", id: requestIdleCallback(fn, { timeout: 500 }) };
  }
  return { kind: "timeout", id: window.setTimeout(fn, 0) };
}

function cancelIdle(handle: IdleHandle): void {
  if (handle.kind === "idle") cancelIdleCallback(handle.id);
  else window.clearTimeout(handle.id);
}

/**
 * The open document, the library index, and the autosave scheduler.
 * Deliberately outside React: an edit mutates the store and notifies one slot,
 * rather than pushing a new object through a context every field consumes.
 */
class PrdStore {
  private library: Library = initLibrary(prd, Date.now());
  private draft: PrdDraft = readDoc(this.library.activeId, prd);
  private saveState: SaveState = "idle";
  private listeners = new Map<Slot, Set<Listener>>();

  /** The exact string last committed to storage, to skip redundant writes. */
  private lastWritten = "";

  /**
   * Whether this tab holds edits that storage does not. A tab that only ever
   * *read* the draft must never write it back: two tabs open, the second one
   * backgrounded, would otherwise flush its stale copy over the first's work.
   */
  private dirty = false;

  private debounceTimer?: number;
  private maxWaitTimer?: number;
  private idleHandle?: IdleHandle;
  private lingerTimer?: number;

  // ── subscription ────────────────────────────────────────────────────────

  subscribe = (slot: Slot, listener: Listener): (() => void) => {
    let set = this.listeners.get(slot);
    if (!set) {
      set = new Set();
      this.listeners.set(slot, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(slot);
    };
  };

  private emit(slot: Slot): void {
    const set = this.listeners.get(slot);
    if (!set) return;
    for (const listener of set) listener();
  }

  /** Notify every content slot — used when the open document is swapped out. */
  private emitDocument(): void {
    for (const [slot, set] of this.listeners) {
      if (slot === SAVE || slot === LIBRARY) continue;
      for (const listener of set) listener();
    }
  }

  // ── reads ───────────────────────────────────────────────────────────────

  /** The whole draft. Read on demand (export, import); never subscribed to. */
  getDraft = (): PrdDraft => this.draft;
  getAnswer = (id: string): string => this.draft.answers[id] ?? "";
  getMeta = (): DraftMeta => this.draft.meta;
  getContacts = (): ContactRow[] => this.draft.contacts;
  getSaveState = (): SaveState => this.saveState;
  getLibrary = (): Library => this.library;

  subscribeAnswer = (id: string) => (listener: Listener) =>
    this.subscribe(answerSlot(id), listener);
  subscribeMeta = (listener: Listener) => this.subscribe(META, listener);
  subscribeContacts = (listener: Listener) =>
    this.subscribe(CONTACTS, listener);
  subscribeSaveState = (listener: Listener) => this.subscribe(SAVE, listener);
  subscribeLibrary = (listener: Listener) => this.subscribe(LIBRARY, listener);

  // ── writes ──────────────────────────────────────────────────────────────

  setAnswer = (id: string, value: string): void => {
    if (this.draft.answers[id] === value) return;
    this.draft = {
      ...this.draft,
      answers: { ...this.draft.answers, [id]: value },
    };
    this.emit(answerSlot(id));
    this.scheduleSave();
  };

  setMeta = (key: keyof DraftMeta, value: string): void => {
    if (this.draft.meta[key] === value) return;
    this.draft = { ...this.draft, meta: { ...this.draft.meta, [key]: value } };
    this.emit(META);
    // The product field *is* the document's name, so the switcher tracks it.
    if (key === "product") this.syncActiveTitle();
    this.scheduleSave();
  };

  setContacts = (rows: ContactRow[]): void => {
    this.draft = { ...this.draft, contacts: rows };
    this.emit(CONTACTS);
    this.scheduleSave();
  };

  /** Replace the open document's contents, keeping it the same document. */
  replaceDraft = (next: PrdDraft): void => {
    this.draft = next;
    this.dirty = true;
    this.emitDocument();
    this.syncActiveTitle();
    this.flush();
  };

  /** Blank the open document. Other documents are untouched. */
  clear = (): void => this.replaceDraft(createEmptyDraft(prd));

  // ── document library ────────────────────────────────────────────────────

  private setLibrary(next: Library): void {
    this.library = next;
    try {
      writeLibrary(next);
    } catch {
      this.setSaveState("error");
    }
    this.emit(LIBRARY);
  }

  private syncActiveTitle(): void {
    const title = draftTitle(this.draft);
    const current = this.library.docs.find(
      (d) => d.id === this.library.activeId
    );
    if (!current || current.title === title) return;
    this.setLibrary({
      ...this.library,
      docs: this.library.docs.map((d) =>
        d.id === this.library.activeId ? { ...d, title } : d
      ),
    });
  }

  /** Documents, most recently edited first. */
  getDocs = (): DocSummary[] => sortDocs(this.library.docs);
  getActiveId = (): string => this.library.activeId;

  /** Open an existing document, saving the current one on the way out. */
  openDocument = (id: string): void => {
    if (id === this.library.activeId) return;
    if (!this.library.docs.some((d) => d.id === id)) return;

    this.flush();
    this.draft = readDoc(id, prd);
    this.lastWritten = "";
    this.dirty = false;
    this.setLibrary({ ...this.library, activeId: id });
    this.emitDocument();
  };

  /**
   * Start a new document. The open one is flushed first and keeps its own
   * storage key, so nothing is ever overwritten by starting a second PRD.
   */
  createDocument = (seed?: PrdDraft): string => {
    this.flush();

    const id = newId();
    const draft = seed ?? createEmptyDraft(prd);
    this.draft = draft;
    this.lastWritten = "";
    this.dirty = true;

    this.setLibrary({
      ...this.library,
      activeId: id,
      docs: [
        ...this.library.docs,
        { id, title: draftTitle(draft), updatedAt: Date.now() },
      ],
    });
    this.emitDocument();
    this.flush();
    return id;
  };

  /** Delete a document. Deleting the last one leaves a fresh blank in its place. */
  deleteDocument = (id: string): void => {
    if (!this.library.docs.some((d) => d.id === id)) return;

    const remaining = this.library.docs.filter((d) => d.id !== id);
    try {
      removeDoc(id);
    } catch {
      // Nothing to do; the index entry is what makes it reachable.
    }

    if (remaining.length === 0) {
      // Nothing left to save, and no key to save it under. Drop the pending
      // write before `createDocument` flushes, or it would write to `doc:`.
      this.dirty = false;
      this.lastWritten = "";
      this.library = { version: 1, activeId: "", docs: [] };
      this.createDocument();
      return;
    }

    const wasActive = id === this.library.activeId;
    const nextActive = wasActive
      ? sortDocs(remaining)[0].id
      : this.library.activeId;

    if (wasActive) {
      this.draft = readDoc(nextActive, prd);
      this.lastWritten = "";
      this.dirty = false;
    }
    this.setLibrary({ ...this.library, activeId: nextActive, docs: remaining });
    if (wasActive) this.emitDocument();
  };

  // ── autosave ────────────────────────────────────────────────────────────

  private setSaveState(next: SaveState): void {
    if (this.saveState === next) return;
    this.saveState = next;
    this.emit(SAVE);

    window.clearTimeout(this.lingerTimer);
    if (next === "saved") {
      this.lingerTimer = window.setTimeout(() => {
        this.saveState = "idle";
        this.emit(SAVE);
      }, SAVED_LINGER_MS);
    }
  }

  /**
   * Debounce the write, but cap the wait: a debounce alone never fires while
   * the user types without pausing, so a long uninterrupted session would go
   * entirely unsaved. The max-wait timer forces a write every `MAX_WAIT_MS`.
   */
  private scheduleSave(): void {
    this.dirty = true;
    this.setSaveState("saving");

    window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(
      () => this.requestWrite(),
      DEBOUNCE_MS
    );

    if (this.maxWaitTimer === undefined) {
      this.maxWaitTimer = window.setTimeout(
        () => this.requestWrite(),
        MAX_WAIT_MS
      );
    }
  }

  private clearSaveTimers(): void {
    window.clearTimeout(this.debounceTimer);
    window.clearTimeout(this.maxWaitTimer);
    this.debounceTimer = undefined;
    this.maxWaitTimer = undefined;
  }

  /** Serialize + persist once the main thread is free. */
  private requestWrite(): void {
    this.clearSaveTimers();
    if (this.idleHandle) return;
    this.idleHandle = whenIdle(() => {
      this.idleHandle = undefined;
      this.write();
    });
  }

  private write(): void {
    if (!this.dirty) {
      this.setSaveState("saved");
      return;
    }
    const serialized = JSON.stringify(this.draft);
    if (serialized === this.lastWritten) {
      this.dirty = false;
      this.setSaveState("saved");
      return;
    }
    try {
      window.localStorage.setItem(docKey(this.library.activeId), serialized);
      this.lastWritten = serialized;
      this.dirty = false;
      this.touchActive();
      this.setSaveState("saved");
    } catch {
      // Private mode, or the 5 MB origin quota is full. Say so — a silent
      // failure here looks identical to a successful save. Stay dirty so a
      // later flush retries.
      this.setSaveState("error");
    }
  }

  /** Record when the open document last changed, for switcher ordering. */
  private touchActive(): void {
    const now = Date.now();
    this.library = {
      ...this.library,
      docs: this.library.docs.map((d) =>
        d.id === this.library.activeId ? { ...d, updatedAt: now } : d
      ),
    };
    try {
      writeLibrary(this.library);
    } catch {
      this.setSaveState("error");
    }
    this.emit(LIBRARY);
  }

  /** Write immediately, cancelling any pending debounce. */
  flush = (): void => {
    this.clearSaveTimers();
    if (this.idleHandle) {
      cancelIdle(this.idleHandle);
      this.idleHandle = undefined;
    }
    this.write();
  };

  /**
   * Persist on the way out. `visibilitychange` → hidden and `pagehide` are the
   * two events that reliably fire when a tab is backgrounded, closed, or
   * discarded on mobile; `beforeunload` is not.
   */
  startAutoFlush = (): (() => void) => {
    const onHide = () => {
      if (document.visibilityState === "hidden") this.flush();
    };
    const onPageHide = () => this.flush();

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  };
}

export const prdStore = new PrdStore();
