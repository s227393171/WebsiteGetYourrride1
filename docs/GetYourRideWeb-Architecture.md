# GetYourRideWeb — Architecture Report

Repo: `https://github.com/s227393171/WebsiteGetYourrride1.git`
Scanned: 31 July 2026

This is a **separate implementation** of your GetYourRide concept from the Kotlin/Spring Boot Android app — this one is a browser-based staff/admin portal built on **ASP.NET Core (C#) with vanilla HTML/CSS/JS**, no framework, no build step.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Minimal API, **.NET 10**, C# |
| DB driver | `MySqlConnector` 2.6.0 (raw SQL, no ORM/EF Core) |
| Database | MySQL |
| Frontend | Static HTML + vanilla JS (`fetch`) + hand-written CSS — no React/Vue/build tooling |
| Auth | Plaintext email/password lookup against DB (no hashing, no JWT/session tokens) |
| Hosting model | Single ASP.NET Core process serves both the API **and** the static files |

There is no `.csproj` reference to any web framework beyond `Microsoft.NET.Sdk.Web` — this is intentionally minimal, closer to a prototype/MVP than the Spring Boot backend.

---

## 2. High-Level Architecture

```
Browser (Login.html, admin/*.html, coordinator/*.html, driver/*.html)
        │  fetch('/api/...')
        ▼
Program.cs  (ASP.NET Core Minimal API — single file, ~1300 lines)
        │  MySqlConnector, raw parameterized SQL
        ▼
MySQL database ("shuttle_db" per appsettings.json,
                 but GetYourRide.sql creates "getyourride")
```

**Everything lives in one `Program.cs` file** — there are no Controllers, no Services, no Repositories, no DTOs folder. All routes, SQL, and response-shaping logic are inline lambda handlers registered directly on `app`. This is architecturally very different from your Spring Boot backend (interface+impl services, layered entity→repo→service→DTO→controller) — there's no separation of concerns here at all.

### Static file serving
`Program.cs` sets up **three overlapping static file middlewares**:
1. `UseStaticFiles()` — default `wwwroot` (folder exists but is empty/placeholder)
2. `UseFileServer()` — serves the **entire project root** (`Login.html`, `Forgot.html`, `HTMLPage1.html`) at `/`
3. Two more `UseStaticFiles()` blocks explicitly mapping `/admin` and `/assets`

Notably, **`/coordinator` and `/driver` folders are never explicitly mapped** — they only work because of the catch-all `UseFileServer()` on the project root, which happens to also expose the raw project directory tree (including `.sql`, `.json` config files, `.csproj`) at the web root. That's a real exposure risk if this is ever deployed as-is (see §6).

### Roles / portals
The app has four user "roles," each with its own static HTML section:
- **Student** — `Login.html` only in this repo (no student dashboard pages present; student flows may live in the Android app instead)
- **Driver** — `driver/dashboard.html`
- **Coordinator** — `coordinator/dashboard.html`, `manage-drivers.html`, `manage-shuttles.html`, `schedule-shuttles.html`, `create-schedule.html`, `add-shuttle.html`
- **Admin** — `admin/dashboard.html`, `verify-drivers.html`, `driver-ratings.html`, `review-application.html`

Routing between them is done client-side: `login.js` reads `data.role` from `/api/login`'s response and does a plain `window.location` redirect — there's no server-side route guarding, no auth middleware, and no token is issued, so any page can be opened directly by URL without logging in.

---

## 3. API Surface (`Program.cs`)

All endpoints are `app.MapGet/MapPost/MapPut/MapDelete` calls with inline SQL. Grouped by domain:

**Auth**
- `POST /api/login` — checks `users`, `driver`, `student` tables via `UNION ALL`, returns `role`
- `POST /api/auth/forgot-password` — generates a 6-char token, "emails" it by printing to the server console
- `POST /api/auth/reset-password` — resets password by token across all 3 tables

**Driver portal**
- `GET /api/driver/profile?email=`
- `GET /api/driver/bookings?email=`

**Admin**
- `GET /api/admin/driver-ratings`
- `GET /api/admin/unverified-drivers`
- `POST /api/admin/verify-driver`
- `GET /api/admin/drivers/{id}`
- `POST /api/admin/drivers/{id}/status`
- `POST /api/admin/drivers/upsert`
- `GET /api/admin/drivers/{driverId}/trips` — **defined twice** (see §5)

**Coordinator**
- `GET/POST /api/coordinator/shuttles`, `PUT/DELETE /api/coordinator/shuttles/{id}`
- `GET/POST/PUT/DELETE /api/coordinator/drivers` (`POST` **defined twice**)
- `GET /api/coordinator/stops` — **defined twice**
- `GET /api/coordinator/routes`
- `GET/POST/PUT /api/coordinator/schedules`, `GET /api/coordinator/schedules/{id}`
- `GET /api/coordinator/profile?email=`

There is no `/api/coordinator/vehicles` or `/api/coordinator/routes` guard against SQL injection concerns — every query does use parameterized `MySqlCommand.Parameters`, which is good practice and consistently applied.

---

## 4. Database Schema — Two Conflicting Versions

This is the most important structural finding. **`GetYourRide.sql` does not match what `Program.cs` actually queries.**

**`GetYourRide.sql`** creates a database called `getyourride` with PascalCase tables:
`Users`, `Routes`, `Bookings`, `DriverApplications`, `Shuttles`, `ShuttleSchedules` — a single unified `Users` table with a `Role` column for everyone.

**`Program.cs`** queries a different, lowercase snake_case schema:
`users`, `driver`, `student`, `trip`, `trip_booking`, `trip_review`, `vehicle`, `shuttle_stop`/`stops`, `shuttle` — separate tables per role (`driver`, `student`) rather than one unified `users` table, plus `vehicle` (not `Shuttles`) and `trip`/`trip_booking` (not `Routes`/`Bookings`).

**Practical implication:** running `GetYourRide.sql` as-is will **not** produce a database that the API in `Program.cs` can actually use — most endpoints will throw at runtime (unknown table/column) against a fresh install from this SQL file. Either the SQL file is stale (an earlier schema iteration left in the repo), or there's a second schema file/migration not committed. Worth reconciling before anyone else tries to run this locally.

`appsettings.json` also targets a database named `shuttle_db`, while the SQL script creates `getyourride` — a third naming inconsistency.

---

## 5. Unresolved Git Merge Conflicts (blocks compilation)

The repo currently has **live, unresolved `<<<<<<< HEAD` / `=======` / `>>>>>>>` conflict markers** committed directly into source, meaning `dotnet build` will fail as-is. Found in:

| File | Conflict count |
|---|---|
| `Program.cs` | 7 conflict blocks (lines ~577, 616, 685, 725, 746, 841, 1289) |
| `assets/css/driver-dashboard.css` | 2 |
| `assets/js/coordinator-schedules.js` | 3 |
| `assets/js/coordinator-shuttles.js` | 8 |
| `assets/js/create-schedule.js` | 2 |

The conflict at the bottom of `Program.cs` (line 1289) is on the DTO records themselves — `ScheduleDirectDto` has two incompatible shapes on either side of the conflict (different constructor parameter order/type for `ShuttleID`), so resolving it needs care to match whichever version `create-schedule.js`'s payload actually sends.

**Side-effect of the conflict never being resolved:** several endpoints got duplicated wholesale during the failed merge and are each registered **twice** in Minimal API routing (last registration wins, first is dead code):
- `POST /api/coordinator/drivers` (lines 572 and 579)
- `GET /api/coordinator/stops` (lines 690 and 717)
- `GET /api/admin/drivers/{driverId}/trips` (lines 1199 and 1241, byte-for-byte identical)

**Recommendation:** this needs a manual conflict-resolution pass before further feature work — right now `git status`/`grep` shows the merge was never finished and committed with markers intact.

---

## 6. Security Observations

These are worth knowing about even for a student/prototype project:

- **Plaintext passwords** — `GetYourRide.sql` seeds every account with password `1234` stored as plain text, and `/api/login` compares passwords with a plain `=` in SQL (no hashing library like BCrypt anywhere in the codebase).
- **Committed DB credentials** — `appsettings.json` contains a real-looking MySQL password checked into git history. Worth rotating and moving to user-secrets/environment variables regardless of whether it's a "real" credential.
- **No auth/session enforcement** — after `/api/login` succeeds, the client just gets a `role` string and redirects; there's no cookie, JWT, or server-side session, so any dashboard HTML page or `/api/*` endpoint can be hit directly with no credentials, and one user's email can be passed as a query string to view another user's data (e.g. `/api/driver/profile?email=`, `/api/driver/bookings?email=` accept any email).
- **Project-root file server** — the `UseFileServer()` mapped at `""` serves the current working directory, which includes `Program.cs`, `appsettings.json` (with the DB password), and `GetYourRide.sql` unless something else prevents `dotnet run`'s working directory from matching the source tree in production.
- **CORS wide open** — `AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()`, appropriate for local dev, not for a public deployment.

None of this is unusual for a coursework/MVP-stage project, but it's the kind of list worth having before this goes anywhere near a real deployment with real student data.

---

## 7. Suggested Next Steps

1. **Resolve the 22 merge conflicts** across `Program.cs` and the four JS/CSS files — this currently doesn't compile.
2. **Reconcile the schema** — decide which of `GetYourRide.sql` vs. the schema implied by `Program.cs`'s queries is authoritative, and regenerate the other, or add a migration script.
3. Remove the duplicate route registrations once conflicts are resolved.
4. Move the DB password out of `appsettings.json` into `dotnet user-secrets` or an environment variable, and rotate it.
5. Consider whether this ASP.NET portal and the Kotlin/Spring Boot mobile backend are meant to share one database — if so, the schema mismatch above becomes even more important to fix first, since two backends currently disagree on what the tables look like.
