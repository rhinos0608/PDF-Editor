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
- Indentation: 2 spaces; keep lines ≤ 100 chars.
- TS/React: camelCase for vars/functions, PascalCase for classes/components.
- React: No explicit JSX imports, prop-types disabled, function components preferred.
- Formatting: Prettier (2 spaces, single quotes, trailing commas es5) + ESLint.
- Files: group components under `src/renderer/components/`, services under `src/renderer/services/`.

## Testing Guidelines
- Frameworks: Jest with ts-jest for TypeScript support.
- Naming: mirror `src/` with test files in `tests/` organized by type (unit/, integration/, e2e/, security/).
- Coverage: aim ≥ 80% lines/branches (90% for main process, 95% for security modules).
- Run focused tests before pushing; add regression tests for all bug fixes.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits if possible (e.g., `feat: add page rotate tool`). Otherwise, use imperative, 50-char subject + concise body.
- PRs: clear description, linked issue, minimal scope, screenshots/GIFs for UI flows, and notes on testing/risk.
- CI must pass lint, tests, and type checks before review.

## Security & Configuration Tips
- Never commit real PDFs with sensitive data; use sanitized samples in `assets/`.
- Secrets/config: use `.env.local` and add an `.env.example` with placeholders.
- Treat external PDFs as untrusted input; validate paths, block directory traversal, and avoid writing outside the working directory.
