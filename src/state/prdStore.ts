import { prd } from "@/data/prd";
import {
  createEmptyDraft,
  loadDraft,
  STORAGE_KEY,
  type ContactRow,
  type DraftMeta,
  type PrdDraft,
} from "@/lib/draft";

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
 * The draft, its subscribers, and the autosave scheduler. Deliberately outside
 * React: an edit mutates the store and notifies one slot, rather than pushing a
 * new object through a context that every field is subscribed to.
 */
class PrdStore {
  private draft: PrdDraft = loadDraft(prd);
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

  /** Notify every data slot — used when the whole draft is swapped out. */
  private emitAll(): void {
    for (const [slot, set] of this.listeners) {
      if (slot === SAVE) continue;
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

  subscribeAnswer = (id: string) => (listener: Listener) =>
    this.subscribe(answerSlot(id), listener);
  subscribeMeta = (listener: Listener) => this.subscribe(META, listener);
  subscribeContacts = (listener: Listener) =>
    this.subscribe(CONTACTS, listener);
  subscribeSaveState = (listener: Listener) => this.subscribe(SAVE, listener);

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
    this.scheduleSave();
  };

  setContacts = (rows: ContactRow[]): void => {
    this.draft = { ...this.draft, contacts: rows };
    this.emit(CONTACTS);
    this.scheduleSave();
  };

  replaceDraft = (next: PrdDraft): void => {
    this.draft = next;
    this.dirty = true;
    this.emitAll();
    this.flush();
  };

  clear = (): void => this.replaceDraft(createEmptyDraft(prd));

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
      window.localStorage.setItem(STORAGE_KEY, serialized);
      this.lastWritten = serialized;
      this.dirty = false;
      this.setSaveState("saved");
    } catch {
      // Private mode, or the 5 MB origin quota is full. Say so — a silent
      // failure here looks identical to a successful save. Stay dirty so a
      // later flush retries.
      this.setSaveState("error");
    }
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
