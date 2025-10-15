# React + Vite + Tailwind

## Components and state
- Functional components with hooks. Co-locate component + test.
- Local state in component. Cross-page state via a single store or React Query only with approval.

## Data flow
- All server calls via typed API client. Explicit loading/error/empty states.
- SSE subscription logic lives in one hook. Always clean up on unmount.

## Styling and a11y
- Tailwind utility-first. Extract repeated patterns with `cn()`.
- Label controls, provide keyboard nav, and manage focus on dialogs.

## Tests
- Vitest + RTL. Test behavior over implementation. Snapshot only for stable UI.
