# ADR-0003 — Role model
- Decision: Use `viewer`, `member`, `moderator`, `admin`, `owner`. No custom roles before v1.0.
- Roles:
  - **viewer**: Read-only access to questions and pulse data
  - **member**: Can submit questions, respond to pulse, upvote
  - **moderator**: Team-scoped moderation (tag, merge, flag questions)
  - **admin**: Tenant-wide administration and moderation
  - **owner**: Full tenant control including settings and user management
- Consequences: Clear tests/docs; explicit permission boundaries; team-scoped vs tenant-scoped access.
