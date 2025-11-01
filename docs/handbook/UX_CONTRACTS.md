# UX Contracts (key screens & states)

## Dashboard (default landing)
- URL: `/:teamSlug/dashboard` or `/all/dashboard` (org rollup)
- Cards: Pulse Trend (12 wks), Drivers Heatmap, "This Week's Pulse" CTA, Live AMA Snapshot
- Team Selector: Dropdown to switch between teams or "All Teams"
- States: loading, empty (insufficient data), normal, error
- A11y: keyboard navigable; focus ring on primary actions; contrast ≥ WCAG AA

## Questions Page
- URL: `/:teamSlug/questions` or `/all/questions` (org rollup)
- Tabs: Open, Answered, Archived
- Action Bar: Search, Filters, Presentation Mode, Submit Question
- States: loading, empty, normal, error
- Team Context Bar: Shows current team with selector

## Pulse Dashboard
- URL: `/:teamSlug/pulse/dashboard` or `/all/pulse/dashboard` (org rollup)
- Charts: 12-week trend line, participation rate, team-specific sentiment
- Team Filtering: Show team-specific data or aggregated "All Teams" view
- States: loading, insufficient data (n < threshold), normal, error

## Pulse Response (token link)
- 1-tap buttons (Likert 1–5 or 0–10), optional comment
- Team context shown but not editable (derived from user's primaryTeam)
- Success: thank-you + link back to Dashboard

## Presenter Mode
- URL: `/:teamSlug/presentation`
- Queue → Selected → Answering → Answered
- Keyboard shortcuts: J/K (navigate), Enter (select), P (pin), F (flag)
- Team-scoped question queue
