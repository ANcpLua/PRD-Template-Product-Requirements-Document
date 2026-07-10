import { useRef, useState } from "react";
import { prd } from "@/data/prd";
import { prdStore } from "@/state/prdStore";
import { useSaveState } from "@/state/prdDraft";
import {
  downloadFile,
  normalizeDraft,
  slugify,
  type PrdDraft,
} from "@/lib/draft";
import { draftToMarkdown } from "@/lib/markdown";

/** Validate that a parsed object looks like a PrdDraft before importing it. */
function isPrdDraft(value: unknown): value is PrdDraft {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.answers === "object" && Array.isArray(candidate.contacts)
  );
}

const STATUS: Record<string, string> = {
  saving: "Saving…",
  saved: "All changes saved",
  error: "Couldn’t save to this browser — download a copy",
  idle: "Autosaves to this browser",
};

/**
 * Say plainly where the work lives. Drafts never leave the browser, so a
 * cleared profile or a different device means a different set of documents.
 */
const STORAGE_NOTE =
  "Your PRDs are stored in this browser only — nothing is uploaded. Download .json to keep a copy or move one to another device.";

/** Save / download / import / copy / print / clear toolbar for the document. */
export function Toolbar() {
  // Only the save indicator is reactive; the draft is read on demand at click
  // time, so typing never re-renders this toolbar.
  const saveState = useSaveState();
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importError, setImportError] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const baseName = () => slugify(prdStore.getDraft().meta.product);

  const downloadMarkdown = () =>
    downloadFile(
      `${baseName()}.md`,
      draftToMarkdown(prd, prdStore.getDraft()),
      "text/markdown;charset=utf-8"
    );

  const downloadJson = () =>
    downloadFile(
      `${baseName()}.json`,
      JSON.stringify(prdStore.getDraft(), null, 2),
      "application/json;charset=utf-8"
    );

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(
        draftToMarkdown(prd, prdStore.getDraft())
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the download buttons are the fallback.
    }
  };

  const onImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isPrdDraft(parsed)) throw new Error("bad shape");
        setImportError(false);
        // Import as a *new* document. Loading a file used to overwrite whatever
        // was open, with no warning and no way back.
        prdStore.createDocument(normalizeDraft(parsed, prd));
      } catch {
        setImportError(true);
        window.setTimeout(() => setImportError(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  const onClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    prdStore.clear();
    setConfirmClear(false);
  };

  const saveLabel =
    saveState === "saved"
      ? "Saved ✓"
      : saveState === "error"
        ? "Save failed"
        : "Save";

  return (
    <div className="prd-toolbar" role="toolbar" aria-label="Document actions">
      <button
        type="button"
        className="prd-button prd-button--primary"
        onClick={prdStore.flush}
      >
        {saveLabel}
      </button>
      <button type="button" className="prd-button" onClick={downloadMarkdown}>
        Download .md
      </button>
      <button type="button" className="prd-button" onClick={downloadJson}>
        Download .json
      </button>
      <button
        type="button"
        className="prd-button"
        onClick={() => fileInput.current?.click()}
      >
        {importError ? "Invalid file" : "Import .json"}
      </button>
      <button type="button" className="prd-button" onClick={copyMarkdown}>
        {copied ? "Copied ✓" : "Copy Markdown"}
      </button>
      <button
        type="button"
        className="prd-button"
        onClick={() => window.print()}
      >
        Print / PDF
      </button>
      <button
        type="button"
        className="prd-button prd-button--danger"
        onClick={onClear}
        title="Empty every field in the open document"
      >
        {confirmClear ? "Click again to clear" : "Clear fields"}
      </button>

      <span
        className="prd-save-state"
        data-state={saveState}
        aria-live="polite"
      >
        {STATUS[saveState]}
      </span>

      <p className="prd-storage-note">{STORAGE_NOTE}</p>

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="prd-sr-only"
        onChange={onImportFile}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
