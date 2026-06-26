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

A type error fails `build`, which fails the Pages deploy. Run `typecheck`
before pushing.

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
