# SSE and Moderator Queue

## SSE
- Keep a single subscription hook. Expose health metrics and counts.
- Types shared between API and UI. Clean up listeners on unmount.

## Queue UX contract
- `/moderator/queue` lists **open/answered/under_review** with filters for team, pinned, frozen, tags, and review state.
- Bulk actions must refresh state after success. Approve removes from list; reject deletes with confirm.
