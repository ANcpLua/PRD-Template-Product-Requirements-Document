// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE CONTENT — this file is the single source of truth for the document.
// Fill in the blanks for a real PRD by editing the strings below; the reader,
// the table of contents, and the "Copy as Markdown" export are all generated
// from this data. No component code needs to change.
//
// Template content adapted from the Product Compass PRD template by Paweł Huryn
// (https://www.productcompass.pm/p/prd-template) — see the footer + README.
// ─────────────────────────────────────────────────────────────────────────────

/** A reference link shown as a chip under a tip. */
export interface RefLink {
  label: string;
  href: string;
}

/** A renderable content block inside a section or subsection. */
export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; text: string; links?: RefLink[] }
  | { type: "table"; head: string[]; rows: string[][] };

export interface Subsection {
  id: string;
  number: string;
  title: string;
  blocks: Block[];
}

export interface Section {
  id: string;
  number: string;
  title: string;
  blocks?: Block[];
  subsections?: Subsection[];
}

export interface Prd {
  brand: string;
  meta: {
    title: string;
    eyebrow: string;
    subtitle: string;
    intro: string;
    source: RefLink;
  };
  sections: Section[];
  footer: {
    text: string;
    source: RefLink;
  };
}

const PRD_GUIDE: RefLink = {
  label: "Product Compass — PRD template",
  href: "https://www.productcompass.pm/p/prd-template",
};

export const prd: Prd = {
  brand: "PRD Template",
  meta: {
    title: "Product Requirements Document",
    eyebrow: "Template",
    subtitle:
      "A lightweight, opinionated structure for aligning a team on what you are building and why.",
    intro:
      "This template is just a recommendation. Adjust it to your specific situation.",
    source: PRD_GUIDE,
  },

  sections: [
    {
      id: "summary",
      number: "1",
      title: "Summary",
      blocks: [
        {
          type: "p",
          text: "What is this document about? Write 2–3 sentences for those who might not have time to read the entire content.",
        },
      ],
    },

    {
      id: "contacts",
      number: "2",
      title: "Contacts",
      blocks: [
        {
          type: "table",
          head: ["Name", "Role", "Comment"],
          rows: [
            ["", "Product Manager", ""],
            ["", "Product Designer", ""],
            ["", "Lead Engineer", ""],
            ["", "Stakeholder", ""],
          ],
        },
        {
          type: "p",
          text: "List any dedicated Slack/Teams channels for interested parties to join.",
        },
      ],
    },

    {
      id: "background",
      number: "3",
      title: "Background",
      blocks: [
        { type: "p", text: "In a few sentences, explain the context:" },
        {
          type: "list",
          items: [
            "What is this initiative about?",
            "Why are you building it now? Has something changed?",
            "Is it something that just recently became possible (e.g., AI)?",
          ],
        },
      ],
    },

    {
      id: "objective",
      number: "4",
      title: "Objective",
      blocks: [
        { type: "p", text: "Briefly explain:" },
        {
          type: "list",
          items: [
            "What’s the objective?",
            "Why does it matter?",
            "How will it benefit the company and the customers?",
            "How does it align with your vision and strategy?",
            "How will you measure the success (key results)?",
          ],
        },
        {
          type: "tip",
          text: "Keep your objective SMART (specific, measurable, achievable, relevant, and time-bound) and inspiring. A favorite format is OKR (Objectives and Key Results).",
          links: [
            {
              label: "OKRs 101 & advanced techniques",
              href: "https://www.productcompass.pm/p/okrs-101-advanced-techniques",
            },
          ],
        },
      ],
    },

    {
      id: "market-segments",
      number: "5",
      title: "Market segment(s)",
      blocks: [
        {
          type: "p",
          text: "Briefly explain for whom you are building it, such as “Substack writers who struggle with acquisition.”",
        },
        {
          type: "p",
          text: "Are there any constraints (e.g., geographic, language, regulatory)?",
        },
        {
          type: "tip",
          text: "Remember that markets are defined by people’s problems/jobs, not their characteristics. You can learn more about outcome-based segmentation from the resources below.",
          links: [
            {
              label: "Jobs-to-be-Done Masterclass (Tony Ulwick)",
              href: "https://www.productcompass.pm/p/jobs-to-be-done-masterclass-with",
            },
            {
              label: "How to Achieve Product-Market Fit",
              href: "https://www.productcompass.pm/p/how-to-achieve-the-product-market",
            },
          ],
        },
      ],
    },

    {
      id: "value-propositions",
      number: "6",
      title: "Value proposition(s)",
      blocks: [
        {
          type: "p",
          text: "What customer jobs/needs do you want to focus on? What will they gain, and which pains will they avoid by using your solution?",
        },
        {
          type: "tip",
          text: "Consider linking research results. These might include, among other things, the Opportunity Solution Tree, Jobs to be Done, interviews, surveys (e.g., Opportunity Score), or data insights.",
        },
        {
          type: "p",
          text: "Which of those problems will you solve way better than the competitors?",
        },
        {
          type: "tip",
          text: "Consider including a Value Curve and market research insights.",
        },
      ],
    },

    {
      id: "solution",
      number: "7",
      title: "Solution",
      subsections: [
        {
          id: "solution-ux",
          number: "7.1",
          title: "UX / Prototypes",
          blocks: [
            {
              type: "p",
              text: "Provide an overview of the user experience, including user flow diagrams (key screenshots) and links to prototypes (e.g., Figma).",
            },
            { type: "tip", text: "A picture is worth thousands of words." },
          ],
        },
        {
          id: "solution-features",
          number: "7.2",
          title: "Key features",
          blocks: [
            {
              type: "p",
              text: "List the key features, providing a brief description of each.",
            },
            {
              type: "tip",
              text: "Make sure it’s clear how those features contribute to the overall objective and the key results.",
            },
          ],
        },
        {
          id: "solution-technology",
          number: "7.3",
          title: "(Optional) Technology",
          blocks: [
            {
              type: "p",
              text: "A high-level overview of the technology used, only if non-standard and relevant. Avoid detailed technical specifications.",
            },
          ],
        },
        {
          id: "solution-assumptions",
          number: "7.4",
          title: "Assumptions",
          blocks: [
            {
              type: "p",
              text: "What are the value, usability, viability, and feasibility assumptions? Did you validate your business model, too, if applicable?",
            },
            {
              type: "p",
              text: "Which risks do you accept? How can you mitigate the others?",
            },
            {
              type: "tip",
              text: "You might link your hypotheses, experiments, and learnings library and just briefly summarize them here. Do not overload this document.",
            },
          ],
        },
      ],
    },

    {
      id: "release",
      number: "8",
      title: "Release",
      blocks: [
        {
          type: "p",
          text: "How long could it take? What might be included in the first version, and what might be left for the future?",
        },
        {
          type: "tip",
          text: "Avoid exact, absolute dates. This is an estimate, not a contract. Focus on outcomes, objectives, and when they might be achieved, not on the details.",
        },
      ],
    },
  ],

  footer: {
    text: "Template structure from The Product Compass newsletter by Paweł Huryn.",
    source: PRD_GUIDE,
  },
};
