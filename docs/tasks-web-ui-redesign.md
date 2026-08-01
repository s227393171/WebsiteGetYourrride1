# Tasks — GetYourRide Web Portal UI Redesign

Restyle the coordinator, admin, and driver dashboards in `WebsiteGetYourrride1`
to match the Academic Transit design system. See
[kiro-web-ui-redesign-workflow.md](kiro-web-ui-redesign-workflow.md) for the
steering rules governing every phase below.

> Screens are listed against the actual files in the repo. Once you share the
> reference image(s)/Stitch screens for each portal, slot the specifics
> (exact nav items, card layouts, empty states) into the relevant phase.

## Branch Strategy

```
main
 ├─ fix/merge-conflicts              (Phase 0 — blocking, not UI work)
 ├─ restyle/web-0-shared-layout
 ├─ restyle/web-1-coordinator
 ├─ restyle/web-2-admin
 └─ restyle/web-3-driver
```

---

## Phase 0 — Merge Conflict Cleanup (Blocking Prerequisite)

**Branch:** `fix/merge-conflicts`

**This is not a UI phase.** It's functional/structural cleanup that has to
happen before restyle work can safely touch the affected files. Treat it as
its own scoped piece of work with its own review, separate from the "UI only"
rule that governs everything after it.

**Objective:** Remove all 22 unresolved conflict markers so the project
actually builds, and clean up the duplicate route registrations that resulted
from the failed merge.

**Deliverables:**
- Resolve 7 conflict blocks in `Program.cs` (lines ~577, 616, 685, 725, 746,
  841, 1289)
- Resolve 2 conflict blocks in `assets/css/driver-dashboard.css`
- Resolve 3 conflict blocks in `assets/js/coordinator-schedules.js`
- Resolve 8 conflict blocks in `assets/js/coordinator-shuttles.js`
- Resolve 2 conflict blocks in `assets/js/create-schedule.js`
- Reconcile the `ScheduleDirectDto` conflict at `Program.cs` line ~1289 —
  the two sides have incompatible constructor shapes for `ShuttleID`; check
  which one matches what `create-schedule.js`'s payload actually sends
  before picking a side
- Remove the resulting duplicate route registrations:
  - `POST /api/coordinator/drivers` (lines 572 and 579)
  - `GET /api/coordinator/stops` (lines 690 and 717)
  - `GET /api/admin/drivers/{driverId}/trips` (lines 1199 and 1241 —
    identical, safe to delete one)

**Kiro Features:**
| Feature | Use |
|---|---|
| Vibe session | Talk through each conflict block to determine which side is functionally correct, rather than picking automatically |
| Supervised mode | Mandatory — this touches Program.cs and real request/response shapes |

**Acceptance Criteria:**
- [ ] `dotnet build` succeeds
- [ ] `grep -r '<<<<<<<' .` returns nothing
- [ ] No duplicate route registrations remain
- [ ] `create-schedule.html`'s form still submits successfully against the
      resolved `ScheduleDirectDto` shape

---

## Phase 1 — Shared Web Layout (Sidebar + Top Bar)

**Branch:** `restyle/web-0-shared-layout`

**Objective:** Establish the 280px sidebar and Navy top app bar once, shared
across all three portals, before touching individual screens.

**Deliverables:**
- Shared sidebar markup (role-aware nav links: Coordinator vs Admin vs Driver)
  extracted into a small reusable partial/include — no bundler, just a shared
  JS snippet that injects nav HTML into a placeholder, consistent with this
  repo's no-build-step approach
- Shared top app bar (Navy background, logo left, notification bell right)
- Shared card styles (12px radius, white background, subtle shadow)
- Shared status badge styles (pill-shaped: Pending amber, Active/Verified
  green, Cancelled/Rejected red, Completed grey)

**Acceptance Criteria:**
- [ ] Sidebar renders correctly on one sample page from each portal
      (`coordinator/dashboard.html`, `admin/dashboard.html`,
      `driver/dashboard.html`)
- [ ] Nav links correct per role
- [ ] Zero changes to `Program.cs`
- [ ] Zero changes to any fetch() call anywhere

---

## Phase 2 — Coordinator Portal

**Branch:** `restyle/web-1-coordinator`

**Prerequisite:** Phase 0 must be complete for this branch —
`coordinator-schedules.js`, `coordinator-shuttles.js`, and `create-schedule.js`
must be conflict-free before restyling the pages that load them.

**Screens:**

| Screen | Reference image | Notes |
|---|---|---|
| `coordinator/dashboard.html` | — | Landing view after coordinator login |
| `coordinator/manage-drivers.html` | — | Uses `/api/coordinator/drivers` |
| `coordinator/manage-shuttles.html` | — | Uses `/api/coordinator/shuttles` |
| `coordinator/schedule-shuttles.html` | — | |
| `coordinator/create-schedule.html` | — | Depends on resolved `ScheduleDirectDto` shape |
| `coordinator/add-shuttle.html` | — | |

**Acceptance Criteria:**
- [ ] All `/api/coordinator/*` fetch calls unchanged
- [ ] Forms/tables restyled to match design tokens; validation behavior unchanged
- [ ] Existing console logging retained
- [ ] `Program.cs` untouched

---

## Phase 3 — Admin Portal

**Branch:** `restyle/web-2-admin`

**Screens:**

| Screen | Reference image | Notes |
|---|---|---|
| `admin/dashboard.html` | — | |
| `admin/verify-drivers.html` | — | Uses `/api/admin/unverified-drivers`, `/api/admin/verify-driver` |
| `admin/driver-ratings.html` | — | Uses `/api/admin/driver-ratings` |
| `admin/review-application.html` | — | Uses `/api/admin/drivers/{id}` |

**Acceptance Criteria:**
- [ ] All `/api/admin/*` fetch calls unchanged
- [ ] Verified/Pending/Rejected status badges match design tokens
- [ ] Existing console logging retained
- [ ] `Program.cs` untouched

---

## Phase 4 — Driver Portal

**Branch:** `restyle/web-3-driver`

**Prerequisite:** Phase 0 must be complete — `driver-dashboard.css` must be
conflict-free before this branch starts.

**Screens:**

| Screen | Reference image | Notes |
|---|---|---|
| `driver/dashboard.html` | — | Uses `/api/driver/profile`, `/api/driver/bookings` |

**Acceptance Criteria:**
- [ ] `/api/driver/profile` and `/api/driver/bookings` fetch calls unchanged
- [ ] Booking cards restyled per design tokens
- [ ] Existing console logging retained
- [ ] `Program.cs` untouched

---

## Phase 5 — QA Pass

**Objective:** Confirm visual parity and zero logic drift across all three
portals before merging to `main`.

**Deliverables:**
- Side-by-side comparison against the reference images for every screen
- `git diff main -- 'Program.cs'` is empty across all restyle branches
  (only the Phase 0 branch touches it, and only for conflict resolution)
- Confirm every `fetch('/api/...')` call in the diff matches the original
  URL/method/payload
- Console log spot-check across coordinator, admin, and driver flows

**Acceptance Criteria:**
- [ ] Visual parity with the reference designs across all three portals
- [ ] No unintended `Program.cs` changes outside Phase 0
- [ ] No duplicate/renamed API calls
- [ ] Sidebar/top bar consistent across all three portals

---

## Summary Table

| Phase | Branch | Focus | Notes |
|---|---|---|---|
| 0 | `fix/merge-conflicts` | Conflict resolution | Blocking, not UI scope — separate review |
| 1 | `restyle/web-0-shared-layout` | Sidebar, top bar, cards, badges | Everything downstream reuses this |
| 2 | `restyle/web-1-coordinator` | 6 screens | Needs Phase 0 done first |
| 3 | `restyle/web-2-admin` | 4 screens | No conflict dependency, can run in parallel with Phase 2/4 |
| 4 | `restyle/web-3-driver` | 1 screen | Needs Phase 0 done first |
| 5 | QA pass | Verification | Confirms zero Program.cs / fetch() drift |