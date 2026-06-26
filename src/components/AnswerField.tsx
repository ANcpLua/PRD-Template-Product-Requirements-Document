import { useEffect, useRef } from "react";
import { usePrdDraft } from "@/state/prdDraft";

interface AnswerFieldProps {
  /** Key into draft.answers — a section or subsection id. */
  id: string;
  /** Accessible label, e.g. the section title. */
  label: string;
  placeholder?: string;
}

/** A persisted, auto-growing textarea bound to one answer in the draft. */
export function AnswerField({ id, label, placeholder }: AnswerFieldProps) {
  const { draft, setAnswer } = usePrdDraft();
  const value = draft.answers[id] ?? "";
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Grow the textarea to fit its content.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="prd-textarea"
      aria-label={`${label} — your content`}
      placeholder={placeholder ?? "Write here…"}
      value={value}
      rows={2}
      onChange={(event) => setAnswer(id, event.target.value)}
    />
  );
}
