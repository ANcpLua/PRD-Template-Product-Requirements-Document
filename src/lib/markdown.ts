import type { Block, Prd, Section, Subsection } from "@/data/prd";
import type { PrdDraft } from "@/lib/draft";

/** Collect the plain prompts of a section so empty fields keep their guidance. */
function promptHint(blocks: Block[] | undefined): string {
  if (!blocks) return "";
  const first = blocks.find((block) => block.type === "p");
  return first && first.type === "p" ? first.text : "";
}

/** Render an answer, or an italic placeholder hint when the field is empty. */
function answerOrHint(answer: string | undefined, hint: string): string {
  const value = (answer ?? "").trim();
  if (value) return value;
  return hint ? `_${hint}_` : "_(to be completed)_";
}

function contactsTable(draft: PrdDraft): string {
  const head = "| Name | Role | Comment |";
  const divider = "| --- | --- | --- |";
  const rows = draft.contacts
    .map(
      (row) =>
        `| ${row.name || " "} | ${row.role || " "} | ${row.comment || " "} |`
    )
    .join("\n");
  return `${head}\n${divider}\n${rows}`;
}

function hasContactsTable(section: Section): boolean {
  return Boolean(section.blocks?.some((block) => block.type === "table"));
}

function renderUnit(
  unit: Section | Subsection,
  level: "##" | "###",
  numberDot: string,
  draft: PrdDraft
): string[] {
  const out: string[] = [];
  out.push(`${level} ${numberDot} ${unit.title}`, "");

  if ("blocks" in unit && hasContactsTable(unit as Section)) {
    out.push(contactsTable(draft), "");
  }

  out.push(answerOrHint(draft.answers[unit.id], promptHint(unit.blocks)), "");
  return out;
}

/**
 * Serialize the user's filled draft to a clean Markdown PRD — the file the
 * "Download" buttons produce and "Copy as Markdown" copies.
 */
export function draftToMarkdown(doc: Prd, draft: PrdDraft): string {
  const out: string[] = [];
  const title = draft.meta.product.trim() || doc.meta.title;
  out.push(`# ${title}`, "");

  const metaLine = [
    draft.meta.author && `**Author:** ${draft.meta.author}`,
    draft.meta.date && `**Date:** ${draft.meta.date}`,
    draft.meta.status && `**Status:** ${draft.meta.status}`,
  ]
    .filter(Boolean)
    .join(" · ");
  if (metaLine) out.push(metaLine, "");

  for (const section of doc.sections) {
    if (section.subsections && section.subsections.length > 0) {
      out.push(`## ${section.number}. ${section.title}`, "");
      for (const sub of section.subsections) {
        out.push(...renderUnit(sub, "###", sub.number, draft));
      }
    } else {
      out.push(...renderUnit(section, "##", `${section.number}.`, draft));
    }
  }

  out.push("---", "");
  out.push(
    `_${doc.footer.text}_ — [${doc.footer.source.label}](${doc.footer.source.href})`
  );
  return out.join("\n");
}
