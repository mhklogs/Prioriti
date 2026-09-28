# Prioriti — Architecture Summary

> Generated from static analysis on 2026-09-28.

## Components

| Layer | Present | Evidence |
| --- | --- | --- |
| Presentation / UI | no | 0 route module(s), 0 component file(s) |
| API / server | no | 0 handler(s), entrypoints: none |
| Domain / business logic | unclear | no dedicated layer detected |
| Persistence | no | no database client |
| Authentication | no | none detected |

## Detected frameworks and libraries

| Package | Purpose (inferred) |
| --- | --- |
| `@tailwindcss/vite` | dependency |
| `@types/node` | dependency |
| `@vitejs/plugin-react` | dependency |
| `autoprefixer` | dependency |
| `esbuild` | esbuild |
| `lucide-react` | dependency |
| `motion` | dependency |
| `react` | React |
| `react-dom` | React |
| `tailwindcss` | Tailwind CSS |
| `tsx` | dependency |
| `typescript` | dependency |
| `vite` | Vite |

## Runtime and delivery

| Concern | Finding |
| --- | --- |
| Language mix | TypeScript, HTML, CSS, JavaScript |
| Package manager | npm |
| Container | none |
| Serverless / PaaS | not configured for Vercel |
| CI | none detected |
| Tests | **none detected** |
| Type safety | TypeScript |

## Environment variables referenced

- `DISABLE_HMR`
