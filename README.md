<div align="center">

# prioriti<span style="color:#4F46E5">.</span>

**intelligent task ranking system**

A minimal, offline-first task prioritizer PWA. Rank what matters, instantly.

---

[Features](#features) · [Priority Scoring](#priority-scoring) · [Development](#development)

</div>

`prioriti.` is an ultra-minimalist (Komma-influenced) task tracker that removes the guesswork from "what should I do next?".

Every task is ranked by a transparent **Priority Score**, tasks sort themselves into a live stack, and urgent uncompleted work raises the flag — even when you're offline.

No account. No cloud. No API key required. Your tasks live in your browser's local storage and your PWA install works fully offline.

---

## Features

- **Priority scoring** — every task is scored `Importance (1–5) × Difficulty (1–5)` and the stack re-sorts itself in real time (descending score).
- **Offline-first PWA** — a service worker caches the app shell and icons, so the tool keeps working with zero connectivity, and installs to your home screen on any device.
- **System + in-app alerts** — high-priority tasks (`score ≥ 15`) that stay uncompleted for 10+ seconds trigger a native notification *and* an in-app warning toast.
- **Context tags** — tag tasks (`#work`, `#health`, …) to keep context at a glance.
- **Local-first privacy** — everything is stored in `localStorage`. No account, no backend, no tracking.
- **Adaptive aesthetic** — clean Komma-style design with automatic light/dark theming that follows your system.

**No secrets needed.** There is no server and no third-party API call anywhere in the app — no `GEMINI_API_KEY`, `.env`, or config is required to run everything. (The dependency set is deliberately pruned to keep installs fast and builds reproducible.)

---

## Priority Scoring

```
Priority Score = Importance × Difficulty
```

- Both factors range **1–5** (default 3).
- Active tasks sort first (descending score), then completed tasks.
- Scores `≥ 15` are flagged **high priority** and eligible for system alerts.

---

## Development

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:3000)
npm run dev
```

### Scripts

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start the Vite dev server on port 3000     |
| `npm run build`    | Production build to `dist/`                |
| `npm run preview`  | Preview the production build               |
| `npm run lint`     | Typecheck with `tsc --noEmit`              |
| `npm run clean`    | Remove the `dist/` output                  |

**Typecheck:** `npm run lint` (same as `npm run typecheck`) runs TypeScript in no-emit mode; a passing build + lint is the project's verification gate.

### Deploy

The build output in `dist/` is a fully static PWA — serve it from any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, …). No server-side configuration needed.

---

## Tech Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Motion** — spring/flip animations
- **lucide-react** — icon set
- **Service Worker + Web Notifications + localStorage** — offline-first PWA primitives

---

## Project Structure

```
Prioriti/
├── index.html            # App shell, meta, manifest + icon wiring
├── vite.config.ts        # Vite + Tailwind config
├── public/
│   ├── manifest.json     # PWA manifest (installable)
│   ├── sw.js             # Offline service worker
│   └── icon-*.png        # Brand icons (also used for notifications)
└── src/
    ├── main.tsx          # React entry + SW registration
    ├── App.tsx           # Whole app UI + logic
    ├── types.ts          # Task model
    └── index.css         # Theme tokens (incl. dark mode) + base styles
```

---

## Compatibility

Install and offline features need a modern evergreen browser (Chrome, Edge, Firefox, or Safari 16+). Web Notifications additionally require the user to grant permission — the app degrades gracefully with in-app toasts if denied.

---

<div align="center"><sub>Structured as an easily parsed, offline-first PWA. Prioritized by design, not by habit.</sub></div>