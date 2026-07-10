# PRD Template — Product Requirements Document

An **interactive, accessible Product Requirements Document template**, deployed
as a static GitHub Pages site. It turns a plain PRD outline into a clean reading
experience with a scroll-spy table of contents, a reading-progress bar, a
light/dark theme, deep-linkable sections, print/PDF export, and one-click
**Copy as Markdown** so you can start filling in a real PRD in seconds.

**Live:** https://ancplua.github.io/PRD-Template-Product-Requirements-Document/

## Why

A PRD is usually a wall of text in a doc tool. This makes the _structure_ of a
good PRD legible at a glance and gives readers real affordances (navigate,
export, print) without adding noise. The aesthetic is deliberately calm —
clean, not flashy.

## Where your work is stored

Everything you type stays in **your browser**. There is no account, no server,
and nothing is uploaded — the site is a static page on GitHub Pages.

- **Autosave** writes to `localStorage` shortly after you stop typing, at least
  every five seconds while you keep typing, and immediately when you switch away
  from or close the tab.
- **Multiple PRDs.** Each document has its own storage key and appears in the
  switcher above the form. Starting a new one never touches the last one. A
  document is named by its _Product / feature_ field.
- **Nothing syncs.** A different browser, a different device, or clearing your
  site data means a different (or empty) set of documents. Use **Download .json**
  to keep a copy or move a document elsewhere, and **Import .json** to bring one
  back — importing adds a document rather than replacing the open one.
- If a save ever fails (private browsing, full storage quota) the toolbar says
  so instead of quietly pretending it worked.

## Stack

- **Vite 8** + **React 19** + **TypeScript** (ESM)
- **Tailwind CSS v4** via `@tailwindcss/vite` — one stylesheet,
  `src/styles/prd.css` (CSS-first design tokens, light/dark, print, reduced
  motion). No `tailwind.config`.
- No runtime UI dependencies beyond React, `clsx`, and `tailwind-merge`. All
  animation is original CSS + `IntersectionObserver` — no WebGL, no heavy libs.

## Edit the content

Everything you see is generated from **one file**:

```
src/data/prd.ts     # the whole document: sections, tips, contacts table, links
```

Change the strings there and the reader, the table of contents, and the
Markdown export all update — no component code needs to change. To use it for a
real product, fork the repo, fill in the blanks in `prd.ts`, and deploy.

## Develop

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Vite dev server                                         |
| `npm run build`     | `tsc -b && vite build` — **typecheck is part of build** |
| `npm run preview`   | Serve the production `dist/`                            |
| `npm run typecheck` | `tsc -b --noEmit`                                       |
| `npm run lint`      | ESLint                                                  |
| `npm run format`    | Prettier                                                |

## Layout

```
index.html                       # SPA entry
src/main.tsx                     # React root
src/App.tsx                      # document shell: topbar, hero, TOC, sections
src/data/prd.ts                  # EDITABLE CONTENT (single source of truth)
src/lib/markdown.ts              # prd.ts → fillable Markdown (Copy as Markdown)
src/lib/utils.ts                 # cn() helper
src/hooks/useScrollSpy.ts        # active-section tracking for the TOC
src/hooks/useTheme.ts            # light/dark with localStorage
src/components/                  # Hero, TableOfContents, ReadingProgress,
                                 #   Reveal, TipCallout, ContactsTable,
                                 #   SectionBlocks, DocActions, ThemeToggle
src/styles/prd.css               # Tailwind v4 entry + tokens + print + a11y
.github/workflows/deploy-pages.yml  # build + deploy to GitHub Pages
```

## Accessibility

Semantic landmarks, a skip link, visible focus rings, `aria-current` on the
active TOC entry, `aria-pressed` on the theme toggle, a labelled progress bar,
and a `prefers-reduced-motion` path that neutralizes every animation.

## Deployment

GitHub Pages via `.github/workflows/deploy-pages.yml` on push to `main` (or
`workflow_dispatch`). `vite.config.ts` sets `base: "./"` so the bundle works
from the Pages project subpath. Pages source = **GitHub Actions**.

## Design inspiration & content credit

- **Visual style** is inspired by [React Bits](https://reactbits.dev) and the
  companion [`atelier-bella`](https://github.com/ANcpLua/atelier-bella) /
  [`portfolio`](https://github.com/ANcpLua/portfolio) projects. This repository
  is public and ships **only original, MIT-licensed component code** — no
  proprietary React Bits Pro/Starter source is included.
- **Template structure** is adapted from the
  [Product Compass PRD template](https://www.productcompass.pm/p/prd-template)
  by Paweł Huryn.

## License

[MIT](./LICENSE) © Alexander Nachtmann
