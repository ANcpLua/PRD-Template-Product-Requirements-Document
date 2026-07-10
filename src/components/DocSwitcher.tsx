import { useMemo, useState } from "react";
import { prdStore } from "@/state/prdStore";
import { useLibrary } from "@/state/prdDraft";
import { sortDocs } from "@/lib/library";

/**
 * Switch between the PRDs stored in this browser. Each document has its own
 * storage key, so starting a new one never overwrites the last. A document is
 * named by its "Product / feature" field — there is no separate title to keep
 * in sync.
 */
export function DocSwitcher() {
  const library = useLibrary();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const docs = useMemo(() => sortDocs(library.docs), [library]);
  const isOnlyDoc = docs.length === 1;

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    prdStore.deleteDocument(library.activeId);
    setConfirmDelete(false);
  };

  return (
    <div className="prd-docbar">
      <label className="prd-docbar__field">
        <span className="prd-docbar__label">Document</span>
        <select
          className="prd-select"
          value={library.activeId}
          onChange={(event) => prdStore.openDocument(event.target.value)}
        >
          {docs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title}
            </option>
          ))}
        </select>
      </label>

      <span className="prd-docbar__count">
        {docs.length === 1 ? "1 document" : `${docs.length} documents`}
      </span>

      <button
        type="button"
        className="prd-button"
        onClick={() => prdStore.createDocument()}
      >
        + New PRD
      </button>

      <button
        type="button"
        className="prd-button prd-button--danger"
        onClick={onDelete}
        title={
          isOnlyDoc
            ? "Deleting your only document leaves a blank one"
            : "Delete this document"
        }
      >
        {confirmDelete ? "Click again to delete" : "Delete document"}
      </button>
    </div>
  );
}
