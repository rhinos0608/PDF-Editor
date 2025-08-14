# UI/UX Audit – PDF Editor

**P0 – Accessibility & Robustness**
- Add `aria-label`, `aria-pressed`, and `:focus-visible` styles to all icon-only buttons in `EnhancedToolbar.tsx`, `Sidebar.tsx`, `StatusBar.tsx`.
- Make sidebar resizer accessible: add `role="separator"`, ARIA attributes, keyboard support, and persist width in `uiStore`.
- Unify PDF.js worker config: remove CDN setup from `src/renderer/index.tsx`, use local worker in `preload.ts` for offline support.

**P1 – IA & Consistency**
- Add Basic/Pro mode or “More tools” toggle to hide advanced panels (`App.tsx`, `Sidebar.tsx`).
- Standardize icons: replace Font Awesome with lucide-react in `Sidebar.tsx`, `StatusBar.tsx`, `SearchPanel.tsx`.
- Ensure all CSS uses theme tokens, not hard-coded colors.

**P2 – Feedback & Layout**
- Centralize dialogs: refactor to a shared Dialog component with focus trap and ARIA.
- Add zoom dropdown in toolbar; persist sidebar width and open panels in `uiStore`.

**Quick Code Pointers**
- Icon/ARIA/focus: `Sidebar.tsx`, `StatusBar.tsx`, `EnhancedToolbar.tsx`, `*.css`.
- Resizer: `Sidebar.tsx`, `src/renderer/state/ui/uiStore.ts`.
- Worker: `src/renderer/index.tsx`, `preload.ts`.
- CSP: move inline loader from `public/index.html` to `public/loading.js`, tighten policy.
