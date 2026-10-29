# Imaginarium Theater Planner

Starter React + TypeScript + Vite project.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

Deploy the generated `dist/` folder to a static host such as GitHub Pages. Vite uses a relative base path (`./`).

## Notes

- Ownership, challenge setup, and planner selections are saved to browser `localStorage`.
- The character database in `src/characters.ts` is an editable **starter roster**, not a guaranteed complete or up-to-date game database.
- Difficulty thresholds are provisional. Verify official rules before treating the eligibility estimate as authoritative.
- Act assignments currently do not enforce Vigor, duplicate restrictions, or other game-specific rules.
