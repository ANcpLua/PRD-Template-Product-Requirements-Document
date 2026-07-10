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
| `npm test`          | Playwright end-to-end suite                             |
| `npm run test:ui`   | The same suite, in Playwright's interactive UI          |

## Tests

`tests/` drives the built bundle in a real browser and covers the things that
would quietly lose someone's work: autosave (including typing without ever
pausing, and closing the tab mid-edit), one storage key per document, importing
without overwriting, deleting the right document, migrating a draft saved before
the document library existed, and still rendering when `localStorage` throws.

CI runs lint, formatting, typecheck + build, then this suite. A failing test
blocks the Pages deploy.

## External links

[`LINKS.md`](./LINKS.md) lists every URL this project points a reader at, and is
generated from `src/data/prd.ts` — run `npm run links:write` after editing a
tip. `npm run links:check` fetches each one and fails on a 404; a weekly
workflow runs it and opens an issue when something rots, so a dead reference
surfaces here rather than in front of a reader.

It also tracks which product terms (`Value Curve`, `Opportunity Solution Tree`,
…) the document uses without giving the reader anything to click.

## Layout

```
index.html                       # SPA entry
src/main.tsx                     # React root
src/App.tsx                      # document shell: topbar, hero, TOC, sections
src/data/prd.ts                  # EDITABLE CONTENT (single source of truth)
src/state/prdStore.ts            # the open document, the library, autosave
src/state/prdDraft.tsx           # per-field subscriptions into that store
src/lib/draft.ts                 # draft shape, normalize, download helpers
src/lib/library.ts               # one storage key per document + migration
src/lib/markdown.ts              # prd.ts → fillable Markdown (Copy as Markdown)
src/lib/utils.ts                 # cn() helper
src/hooks/useScrollSpy.ts        # active-section tracking for the TOC
src/hooks/useTheme.ts            # light/dark with localStorage
src/components/                  # Hero, Toolbar, DocSwitcher, DocMeta,
                                 #   AnswerField, EditableContactsTable,
                                 #   TableOfContents, ReadingProgress, Reveal,
                                 #   TipCallout, SectionBlocks, ThemeToggle
src/styles/prd.css               # Tailwind v4 entry + tokens + print + a11y
tests/                           # Playwright end-to-end suite
.github/workflows/deploy-pages.yml  # lint + build + test + deploy to Pages
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
