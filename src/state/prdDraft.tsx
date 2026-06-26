/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { prd } from "@/data/prd";
import {
  createEmptyDraft,
  loadDraft,
  STORAGE_KEY,
  type ContactRow,
  type DraftMeta,
  type PrdDraft,
} from "@/lib/draft";

type SaveState = "idle" | "saving" | "saved";

interface PrdDraftApi {
  draft: PrdDraft;
  saveState: SaveState;
  setMeta: (key: keyof DraftMeta, value: string) => void;
  setAnswer: (id: string, value: string) => void;
  setContacts: (rows: ContactRow[]) => void;
  saveNow: () => void;
  clear: () => void;
  replaceDraft: (next: PrdDraft) => void;
}

const PrdDraftContext = createContext<PrdDraftApi | null>(null);

export function PrdDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PrdDraft>(() => loadDraft(prd));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedTimer = useRef<number | undefined>(undefined);

  const persist = useCallback((next: PrdDraft) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveState("saved");
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      // Storage can be unavailable (private mode / quota); ignore.
    }
  }, []);

  // Debounced autosave whenever the draft changes.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSaveState("saving");
    const handle = window.setTimeout(() => persist(draft), 600);
    return () => window.clearTimeout(handle);
  }, [draft, persist]);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const setMeta = useCallback((key: keyof DraftMeta, value: string) => {
    setDraft((current) => ({
      ...current,
      meta: { ...current.meta, [key]: value },
    }));
  }, []);

  const setAnswer = useCallback((id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      answers: { ...current.answers, [id]: value },
    }));
  }, []);

  const setContacts = useCallback((rows: ContactRow[]) => {
    setDraft((current) => ({ ...current, contacts: rows }));
  }, []);

  const saveNow = useCallback(() => persist(draft), [draft, persist]);

  const clear = useCallback(() => {
    const empty = createEmptyDraft(prd);
    setDraft(empty);
    persist(empty);
  }, [persist]);

  const replaceDraft = useCallback(
    (next: PrdDraft) => {
      setDraft(next);
      persist(next);
    },
    [persist]
  );

  const value = useMemo<PrdDraftApi>(
    () => ({
      draft,
      saveState,
      setMeta,
      setAnswer,
      setContacts,
      saveNow,
      clear,
      replaceDraft,
    }),
    [
      draft,
      saveState,
      setMeta,
      setAnswer,
      setContacts,
      saveNow,
      clear,
      replaceDraft,
    ]
  );

  return (
    <PrdDraftContext.Provider value={value}>
      {children}
    </PrdDraftContext.Provider>
  );
}

export function usePrdDraft(): PrdDraftApi {
  const ctx = useContext(PrdDraftContext);
  if (!ctx) {
    throw new Error("usePrdDraft must be used within a PrdDraftProvider");
  }
  return ctx;
}
