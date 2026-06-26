import type { Block } from "@/data/prd";
import { EditableContactsTable } from "@/components/EditableContactsTable";
import { TipCallout } from "@/components/TipCallout";

/**
 * Render a section's guidance blocks: prompts (`p`), prompt lists, and tips are
 * shown as guidance; a `table` block renders the editable contacts grid.
 */
export function SectionBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return (
              <p key={index} className="prd-guidance">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={index} className="prd-list prd-guidance">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );
          case "tip":
            return (
              <TipCallout key={index} text={block.text} links={block.links} />
            );
          case "table":
            return <EditableContactsTable key={index} />;
        }
      })}
    </>
  );
}
