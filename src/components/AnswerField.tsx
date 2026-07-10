import { memo, useEffect, useRef } from "react";
import { prdStore } from "@/state/prdStore";
import { useAnswer } from "@/state/prdDraft";

/**
 * Where `field-sizing` is supported the browser grows the textarea in CSS and
 * the JS path is skipped: reading `scrollHeight` forces a synchronous layout
 * of the document, which is the single most expensive thing a keystroke can do.
 */
const SUPPORTS_FIELD_SIZING =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("field-sizing", "content");

interface AnswerFieldProps {
  /** Key into draft.answers — a section or subsection id. */
  id: string;
  /** Accessible label, e.g. the section title. */
  label: string;
  placeholder?: string;
}

/** A persisted, auto-growing textarea bound to one answer in the draft. */
function AnswerFieldImpl({ id, label, placeholder }: AnswerFieldProps) {
  const value = useAnswer(id);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const lastHeight = useRef(0);
  const frame = useRef<number | undefined>(undefined);

  // Fallback autosize. Batched into a frame, so a burst of keystrokes costs
  // one layout rather than one per character.
  useEffect(() => {
    if (SUPPORTS_FIELD_SIZING) return;
    const node = ref.current;
    if (!node) return;

    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      node.style.height = "auto";
      const next = node.scrollHeight;
      if (next !== lastHeight.current) {
        lastHeight.current = next;
        node.style.height = `${next}px`;
      }
    });

    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="prd-textarea"
      aria-label={`${label} — your content`}
      placeholder={placeholder ?? "Write here…"}
      value={value}
      rows={2}
      onChange={(event) => prdStore.setAnswer(id, event.target.value)}
    />
  );
}

export const AnswerField = memo(AnswerFieldImpl);
