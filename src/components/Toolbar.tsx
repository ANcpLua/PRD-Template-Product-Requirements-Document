import { useRef, useState } from "react";
import { prd } from "@/data/prd";
import { usePrdDraft } from "@/state/prdDraft";
import { downloadFile, slugify, type PrdDraft } from "@/lib/draft";
import { draftToMarkdown } from "@/lib/markdown";

/** Validate that a parsed object looks like a PrdDraft before importing it. */
function isPrdDraft(value: unknown): value is PrdDraft {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.answers === "object" && Array.isArray(candidate.contacts)
  );
}

/** Save / download / import / copy / print / clear toolbar for the document. */
export function Toolbar() {
  const { draft, saveState, saveNow, clear, replaceDraft } = usePrdDraft();
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importError, setImportError] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const baseName = slugify(draft.meta.product);

  const downloadMarkdown = () =>
    downloadFile(
      `${baseName}.md`,
      draftToMarkdown(prd, draft),
      "text/markdown;charset=utf-8"
    );

  const downloadJson = () =>
    downloadFile(
      `${baseName}.json`,
      JSON.stringify(draft, null, 2),
      "application/json;charset=utf-8"
    );

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(draftToMarkdown(prd, draft));
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
        const defaultMeta = {
          product: "",
          author: "",
          date: "",
          status: "Draft",
        };
        replaceDraft({
          version: 1,
          meta: { ...defaultMeta, ...parsed.meta },
          answers: parsed.answers ?? {},
          contacts: parsed.contacts,
        });
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
    clear();
    setConfirmClear(false);
  };

  return (
    <div className="prd-toolbar" role="toolbar" aria-label="Document actions">
      <button
        type="button"
        className="prd-button prd-button--primary"
        onClick={saveNow}
      >
        {saveState === "saved" ? "Saved ✓" : "Save"}
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
      >
        {confirmClear ? "Click again to clear" : "Clear"}
      </button>

      <span className="prd-save-state" aria-live="polite">
        {saveState === "saving"
          ? "Saving…"
          : saveState === "saved"
            ? "All changes saved"
            : "Autosaves to this browser"}
      </span>

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
