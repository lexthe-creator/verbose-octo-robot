# App in My Life

Dark-themed personal PWA for ADHD daily execution: morning planning, task tracking, focus sessions, inbox capture, projects, fitness, and a local finance snapshot.

Before changing code, read [SPEC.md](./SPEC.md). It is the living source of truth for product behavior, state shape, interaction patterns, and screen specs.

## Local Setup

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Commands

```bash
npm run dev       # start local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # run ESLint
```

## Live URL

https://lexthe-creator.github.io/verbose-octo-robot/

## Architecture

- Vite + React single-page PWA.
- No router library; screen state is managed by `useNavigate()` and rendered in `App.jsx`.
- Eight domain contexts own localStorage persistence: User, Settings, Day, Fitness, Inbox, Projects, Finance, and Planning.
- Design tokens live in `src/styles/tokens.css`; do not change tokens or UI behavior without checking SPEC first.
- Deployment is GitHub Pages via `.github/workflows/pages.yml`.
