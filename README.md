# ntt-data-assessment-web

React frontend for NTT Data interview preparation practice (Java Developer profile).

This app talks to **`ntt-data-assessment-api`** at `http://localhost:8091` (override with `VITE_API_BASE_URL`). Progress and quiz attempts live in the SQLite-backed API — not in local mocks.

A mocked offline copy is kept as sibling folder **`ntt-data-assessment-web-demo`**.

## Specs

- Product behavior: [`../../design/functional-specifications.md`](../../design/functional-specifications.md)
- Frontend demo build: [`../../design/frontend-demo-specifications.md`](../../design/frontend-demo-specifications.md)
- Microservices: [`../../design/microservices-webflux-specifications.md`](../../design/microservices-webflux-specifications.md)

## Prerequisites

1. Start the backend (assessment-api on **8091**, ollama-api on **8092** if AI text grading is needed):

```bat
..\..\backend\start-backend.cmd
```

2. Ensure the SQLite DB was built under `database/`.

## Run

```bash
npm install
npm run dev
```

Optional `.env`:

```
VITE_API_BASE_URL=http://localhost:8091
```

Then open the URL shown by Vite (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

## Walkthrough

1. **Home** — readiness vs COMPETENTE and weak topics (from API)
2. **Baseline** — experiences, strengths, weaknesses, priority topics
3. **Dashboard** — current scores by category/topic
4. **Quiz** — choose topics / role band / depth / mode → take quiz → results
5. **History** — past attempts and attempt detail
6. **Questions** — read-only question bank from SQLite

## Notes

- Default role band preference: `MID` (stored in `localStorage` only as UI preference)
- Multiple-choice scoring and text grading are performed by the backend
- Active profile: **Java Developer** from the assessment API
