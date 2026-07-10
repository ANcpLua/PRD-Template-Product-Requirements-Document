# PRD Template (`prd-template`)

A single-page React app that renders an interactive Product Requirements
Document template and deploys to **GitHub Pages**. Static SPA — no backend, no
SSR. **Public repo, public Pages site.**

> **License note.** This repo is public, so it contains **only original,
> MIT-licensed source**. Do **not** add React Bits Pro/Starter component source
> (`@reactbits-*`) here — that is proprietary and publishing it would violate
> the React Bits license (see the sibling private repo `atelier-bella`). The
> React Bits _look_ is reproduced with original CSS instead.

## Stack

- **Vite 8** + **React 19** + **TypeScript** (ESM)
- **Tailwind CSS v4** via `@tailwindcss/vite` — one stylesheet
  `src/styles/prd.css` (no `tailwind.config`; CSS-first tokens + light/dark +
  print + reduced-motion)

## Commands

| Command                           | What it does                                            |
| --------------------------------- | ------------------------------------------------------- |
| `npm run dev`                     | Vite dev server                                         |
| `npm run build`                   | `tsc -b && vite build` — **typecheck is part of build** |
| `npm run preview`                 | Serve the production `dist/`                            |
| `npm run typecheck`               | `tsc -b --noEmit`                                       |
| `npm run lint` / `lint:fix`       | ESLint                                                  |
| `npm run format` / `format:check` | Prettier                                                |
| `npm test`                        | Playwright end-to-end suite (builds, then drives it)    |
| `npm run test:ui`                 | Same suite in Playwright's interactive UI               |

A type error fails `build`, which fails the Pages deploy. Run `typecheck`
before pushing.

## Tests

`tests/` drives the **built** bundle in a real browser, because everything worth
protecting here is a behaviour rather than a pure function: autosave timing, the
one-key-per-document storage layout, and the migration of a pre-library draft.

The suite exists because each of these shipped broken once, silently:

- Starting a second PRD used to overwrite the first — every draft shared one
  `localStorage` key.
- Importing a `.json` replaced whatever document was open.
- A debounce that reset on every keystroke never fired while someone typed
  continuously, so long sessions were never saved at all.
- A failed write was swallowed; the toolbar kept saying "All changes saved".
- Reading `localStorage` during the first render threw in hardened privacy
  modes, rendering a blank page.

Rules of thumb:

- Query by **role and accessible name** (`getByRole("textbox", { name: … })`),
  not CSS classes. A test that breaks when a label changes is doing its job.
- Assert on what **reaches storage**, via `expectPersisted`. The "All changes
  saved" label only lingers ~1.6s, so asserting on it races.
- Seed pre-library drafts with `addInitScript`, never `page.evaluate` after a
  `goto` — migration only runs when no library exists, so seeding late makes the
  test silently prove nothing.
- Each test gets a fresh browser context, so `localStorage` starts empty.

CI runs lint, format, typecheck+build, then this suite. **A failing test blocks
the Pages deploy.**

## Content is config-driven

`src/data/prd.ts` is the **single source of truth** for the document — sections,
subsections, paragraphs, lists, tips, the contacts table, and reference links.
The reader, the table of contents, and the `Copy as Markdown` export
(`src/lib/markdown.ts`) are all derived from it. Editing copy never requires
touching component code.

## Conventions / accessibility

- **Alias:** `@/*` → `src/*` (in `vite.config.ts`, `tsconfig.app.json`, root
  `tsconfig.json`).
- **Accessibility is a requirement:** semantic landmarks, a skip link, visible
  focus rings, `aria-current` on the active TOC link, `aria-pressed` on the
  theme toggle, a labelled `role="progressbar"`, and a `prefers-reduced-motion`
  path that neutralizes the aurora, the word-stagger title, and scroll reveals.
- **Styling:** semantic class names + CSS variables in `prd.css`; theme switches
  via `<html data-theme>`. Don't hand-format — run `format` / `lint:fix`.

## Deployment

GitHub Pages via `.github/workflows/deploy-pages.yml` on push to `main` (or
`workflow_dispatch`). Only the compiled `dist/` ships. `vite.config.ts` sets
`base: "./"` so assets resolve from the Pages project subpath. Pages source =
**GitHub Actions** (Settings → Pages → Source: GitHub Actions).
