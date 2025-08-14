# Repository Guidelines - Professional PDF Editor (Electron)

## Project Structure & Module Organization
- `src/main/`: Electron main process (main.ts, preload.ts) - Window management, IPC handlers
- `src/renderer/`: React UI (components/, services/) - PDF viewer and editing tools
- `src/types/`: TypeScript definitions for external libraries
- `tests/`: Jest tests organized by type (unit/, integration/, e2e/, security/)
- `dist/`: Built Electron app (main/, renderer/) - Auto-generated, not committed
- `public/`: Static assets (icons, HTML templates)

## Build, Test, and Development Commands
- **Start**: `npm start` (production), `npm run start:safe` (GPU issues), `START.bat`
- **Development**: `npm run dev` (hot reload), `npm run start-dev`
- **Build**: `npm run build`, `node build.js`, `BUILD.bat`
- **Tests**: `npm test` (all), `jest --testNamePattern="searchName"` (single test)
- **Test types**: `jest --selectProjects=unit|integration|e2e|security`
- **Lint**: `npm run lint` (ESLint), **Format**: Prettier (integrated with ESLint)

## Coding Style & Naming Conventions
- Indentation: 4 spaces; keep lines ≤ 100 chars.
- Python: snake_case for modules/functions, PascalCase for classes; prefer type hints.
- JS/TS: camelCase for vars/functions, PascalCase for classes/components.
- Formatting: Black/Ruff for Python; Prettier/ESLint for JS/TS. Do not hand-format; run the tools.
- Files: group related modules under `src/editor/`, `src/io/`, etc.; avoid “misc/util” catch-alls.

## Testing Guidelines
- Frameworks: PyTest (Python) or Jest/Vitest (JS/TS).
- Naming: mirror `src/` with `tests/test_<module>.py` or `<module>.spec.ts`.
- Coverage: aim ≥ 80% lines/branches for changed code.
- Run focused tests before pushing; add regression tests for all bug fixes.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits if possible (e.g., `feat: add page rotate tool`). Otherwise, use imperative, 50-char subject + concise body.
- PRs: clear description, linked issue, minimal scope, screenshots/GIFs for UI flows, and notes on testing/risk.
- CI must pass lint, tests, and type checks before review.

## Security & Configuration Tips
- Never commit real PDFs with sensitive data; use sanitized samples in `assets/`.
- Secrets/config: use `.env.local` and add an `.env.example` with placeholders.
- Treat external PDFs as untrusted input; validate paths, block directory traversal, and avoid writing outside the working directory.
