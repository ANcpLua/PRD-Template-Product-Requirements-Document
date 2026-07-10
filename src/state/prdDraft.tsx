/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { prdStore, type SaveState } from "@/state/prdStore";
import type { ContactRow, DraftMeta } from "@/lib/draft";
import type { Library } from "@/lib/library";

/**
 * Mounts the store's lifecycle listeners. The draft itself does not travel
 * through context — each component subscribes to the one slot it renders, so a
 * keystroke in an answer re-renders that textarea and nothing else.
 */
export function PrdDraftProvider({ children }: { children: ReactNode }) {
  useEffect(() => prdStore.startAutoFlush(), []);
  return <>{children}</>;
}

/** The text of a single answer, keyed by section/subsection id. */
export function useAnswer(id: string): string {
  const subscribe = useCallback(
    (listener: () => void) => prdStore.subscribeAnswer(id)(listener),
    [id]
  );
  const get = useCallback(() => prdStore.getAnswer(id), [id]);
  return useSyncExternalStore(subscribe, get, get);
}

/** The document's editable front-matter. */
export function useMeta(): DraftMeta {
  return useSyncExternalStore(
    prdStore.subscribeMeta,
    prdStore.getMeta,
    prdStore.getMeta
  );
}

/** The editable contacts rows. */
export function useContacts(): ContactRow[] {
  return useSyncExternalStore(
    prdStore.subscribeContacts,
    prdStore.getContacts,
    prdStore.getContacts
  );
}

/** Autosave status. Subscribed to by the toolbar indicator only. */
export function useSaveState(): SaveState {
  return useSyncExternalStore(
    prdStore.subscribeSaveState,
    prdStore.getSaveState,
    prdStore.getSaveState
  );
}

/**
 * The document index. Returns the library object itself — a snapshot must be
 * reference-stable between notifications, so callers derive the sorted list.
 */
export function useLibrary(): Library {
  return useSyncExternalStore(
    prdStore.subscribeLibrary,
    prdStore.getLibrary,
    prdStore.getLibrary
  );
}
