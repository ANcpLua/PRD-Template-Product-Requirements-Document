import { usePrdDraft } from "@/state/prdDraft";
import { emptyContactRow, type ContactRow } from "@/lib/draft";

const COLUMNS: { key: keyof ContactRow; label: string; placeholder: string }[] =
  [
    { key: "name", label: "Name", placeholder: "Name" },
    { key: "role", label: "Role", placeholder: "Role" },
    { key: "comment", label: "Comment", placeholder: "Comment" },
  ];

/** The contacts table as an editable grid with add/remove-row controls. */
export function EditableContactsTable() {
  const { draft, setContacts } = usePrdDraft();
  const rows = draft.contacts;

  const updateCell = (index: number, key: keyof ContactRow, value: string) => {
    setContacts(
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const addRow = () => setContacts([...rows, emptyContactRow()]);

  const removeRow = (index: number) =>
    setContacts(rows.filter((_, i) => i !== index));

  return (
    <div className="prd-table-wrap">
      <table className="prd-table prd-table--editable">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
            <th scope="col" className="prd-table__action-col">
              <span className="prd-sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {COLUMNS.map((col) => (
                <td key={col.key} data-label={col.label}>
                  <input
                    className="prd-input"
                    type="text"
                    value={row[col.key]}
                    placeholder={col.placeholder}
                    aria-label={`${col.label}, row ${index + 1}`}
                    onChange={(event) =>
                      updateCell(index, col.key, event.target.value)
                    }
                  />
                </td>
              ))}
              <td className="prd-table__action-col">
                <button
                  type="button"
                  className="prd-row-remove"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove contact row ${index + 1}`}
                  disabled={rows.length <= 1}
                  title="Remove row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="prd-add-row" onClick={addRow}>
        + Add contact
      </button>
    </div>
  );
}
