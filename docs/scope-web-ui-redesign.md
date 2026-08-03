# Project Scope — GetYourRide Web Portal UI Redesign

## Overview

`WebsiteGetYourrride1` is the browser-based staff portal for GetYourRide —
ASP.NET Core (.NET 10) + vanilla HTML/CSS/JS, no framework, serving the
**coordinator**, **admin**, and **driver** dashboards. This is a separate
codebase from the Kotlin/Spring Boot mobile app, but should read as the same
product: same Academic Transit design system, same brand.

This scope covers a **visual restyle only** — bringing the existing screens
in line with new reference designs — carried out through Kiro using specs,
steering files, and hooks.

## Portals & Screens In Scope

| Portal | Screens | Backing API |
|---|---|---|
| Coordinator | `dashboard.html`, `manage-drivers.html`, `manage-shuttles.html`, `schedule-shuttles.html`, `create-schedule.html`, `add-shuttle.html` | `/api/coordinator/*` |
| Admin | `dashboard.html`, `verify-drivers.html`, `driver-ratings.html`, `review-application.html` | `/api/admin/*` |
| Driver | `dashboard.html` | `/api/driver/*` |

Shared layout (280px sidebar, Navy top app bar, card + badge styles) is
restyled once and reused across all three portals.

## Goals

1. Bring all coordinator, admin, and driver screens visually in line with the
   Academic Transit design system already established for the Android app
2. Do this without changing any existing request/response behavior —
   `fetch()` calls, form submissions, and the role-based login redirect all
   keep working exactly as they do today
3. Leave the codebase more readable than it was found: comments on
   non-obvious markup/JS, logging preserved or extended at key state
   transitions
4. Get the repo back to a buildable state first, since it currently has
   unresolved merge conflicts blocking `dotnet build`

## Non-Goals

- This is NOT a rewrite or reframework — no React/Vue/build tooling gets
  introduced; the repo stays vanilla HTML/CSS/JS by design
- This is NOT the place to fix the schema mismatch between `GetYourRide.sql`
  and what `Program.cs` actually queries, or to add password hashing/session
  tokens — those are real issues, but separate work from a UI restyle
- This is NOT adding a student-facing portal here — student flows live in
  the Android app; this repo only covers coordinator/admin/driver
- Not touching `Program.cs` route/SQL logic, except strictly to remove
  merge-conflict markers (Phase 0), which is scoped and reviewed separately
  from the UI work

## Constraints

- **Every screen restyle requires its reference image before work starts.**
  If the reference image for a screen hasn't been shared yet, Kiro must ask
  for it and wait rather than deriving a layout from the design tokens alone.
  The design system (`docs/design-system.md`) defines the shared
  colors/type/spacing; the reference image defines the actual per-screen
  layout — both are required, neither substitutes for the other.
- No functional changes outside Phase 0 (merge conflict cleanup). If a real
  bug is hit mid-restyle, it gets flagged and confirmed before touching
  anything beyond the screen being restyled.
- Existing logging (`console.log`/`console.error`) must be preserved, and
  extended to any new UI branch introduced by the restyle (e.g. a new empty
  state).
- No build step gets introduced — shared layout pieces (sidebar, top bar)
  are implemented as plain JS includes, not a bundler/component framework.
- `Program.cs`'s static file middleware and the four overlapping static
  file registrations stay untouched.

## Success Criteria

1. All coordinator, admin, and driver screens visually match their reference
   images and use the Academic Transit tokens consistently
2. Zero unintended changes to `Program.cs` outside the Phase 0 branch
3. Every existing `fetch('/api/...')` call is unchanged in URL, method, and
   payload shape
4. The repo builds cleanly (`dotnet build` succeeds, no conflict markers)
5. A reviewer can diff any restyle branch against `main` and see HTML/CSS/JS
   changes only — no surprises in the API layer

## Dependencies

- Reference images/designs for each screen (coordinator, admin, driver),
  supplied per screen as work reaches that phase
- `docs/design-system.md` — Academic Transit tokens, shared with the
  Android app
- Phase 0 (merge conflict resolution) completed before any coordinator or
  driver screen work begins, since those portals' JS/CSS files are the ones
  currently holding unresolved conflict markers
