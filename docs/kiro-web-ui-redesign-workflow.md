# Kiro Workflow Guide — GetYourRide Web Portal UI Redesign

## Objective

Restyle the admin, coordinator, and driver dashboards in `WebsiteGetYourrride1`
to match the Academic Transit design system — **UI only**. This repo has no
framework and no layered architecture: everything lives in one `Program.cs`
(routes + raw SQL) plus static HTML/CSS/JS. That has one big implication for
how Kiro must work here: **there is no natural boundary between "UI" and
"logic" the way there is in the Android app** (no ViewModel/Repository to
avoid touching) — the boundary Kiro must respect is *file-based*: HTML/CSS/JS
under `admin/`, `coordinator/`, `driver/`, `assets/` are in scope;
`Program.cs` is not.

## Prerequisite — This Repo Doesn't Compile Yet

Before any restyle work starts: `Program.cs` and four of the CSS/JS files
Kiro would be editing (`driver-dashboard.css`, `coordinator-schedules.js`,
`coordinator-shuttles.js`, `create-schedule.js`) have **live, unresolved
`<<<<<<< HEAD` merge conflict markers committed to source**. Restyling a file
that still has conflict markers in it means Kiro is styling broken code and
may silently "resolve" the conflict by picking a side without understanding
which one is functionally correct.

This is treated as a separate, blocking phase (Phase 0 in
`tasks-web-ui-redesign.md`) — done first, reviewed on its own, and explicitly
**not** bundled into any UI diff. See that doc for the full conflict list and
the `ScheduleDirectDto` shape mismatch that needs resolving carefully.

## Session Type & Autonomy Mode

- **Spec session per portal** (coordinator / admin / driver), or per screen
  within a portal if a page is large (e.g. `coordinator/schedule-shuttles.html`).
- **Supervised mode, always.** Same reasoning as the Android side: you're
  editing files that already work, review every hunk.

## Steering Files

### `.kiro/steering/web-ui-redesign-rules.md` (always included)

```markdown
# Web Portal UI Redesign Rules

- UI restyle only. Never edit Program.cs during this pass — no route
  changes, no SQL changes, no DTO shape changes. If a restyle seems to need
  a new API field or endpoint, STOP and flag it instead of adding one.
- Adding NEW files is fine and encouraged where it helps (a new shared
  sidebar partial, a new CSS file for design tokens, a new JS helper for
  the badge component, etc.) — this is not the same as changing existing
  functionality, and doesn't need sign-off on its own.
- Do NOT remove or change any existing functionality — existing fetch()
  calls, form submit handlers, validation, redirect logic, event listeners,
  all stay exactly as they behave today. If you believe a functional change
  is genuinely necessary (not just "nicer"), stop, explain exactly what
  would change and why, and wait for explicit confirmation before touching
  it. Never make a functional change silently as a side effect of a
  styling edit.
- If a file still contains `<<<<<<<` / `=======` / `>>>>>>>` conflict
  markers, stop and resolve the conflict as its own separate, reviewed step
  before doing any styling work in that file. Do not fold conflict
  resolution into a styling diff.
- Preserve every existing fetch('/api/...') call exactly as-is — same URL,
  same method, same payload shape. Only the DOM/CSS output changes.
- Preserve the existing login.js role-based redirect flow (data.role ->
  window.location) exactly. Do not introduce auth/session logic that isn't
  already there — that's a separate, larger piece of work, not a restyle.
- Keep every existing console.log/console.error. This app has no server-side
  logging middleware beyond console output, so these are the only
  diagnostics available — do not remove them, and add one at any new
  fetch success/error branch introduced by a restyled form or button.
- Add HTML comments marking major sections and JS comments explaining any
  non-obvious DOM manipulation. There's no component framework here to lean
  on for structure, so comments are the only thing making this readable
  later.
- Apply Academic Transit tokens verbatim from docs/design-system.md:
  280px fixed sidebar, Navy (#1A2E5A) top app bar, 12px card radius, pill
  status badges, Inter typography, 8px spacing grid.
- Sidebar and top bar markup should be near-identical across admin/,
  coordinator/, and driver/ — only the nav links differ per role. If a
  screen ends up with a bespoke sidebar implementation, extract a shared
  partial instead (a small shared sidebar.js that injects nav HTML into a
  placeholder div is enough — no bundler needed, this repo intentionally
  has no build step, keep it that way).
- Do not modify the three static-file middleware registrations
  (UseStaticFiles/UseFileServer) in Program.cs under any circumstance —
  that's infrastructure, not UI, and is explicitly out of scope even though
  it lives in the same file you're avoiding.
- Consult the ui-ux-pro-max skill for spacing/color/component decisions
  before finalizing a screen. It installs directly into `.kiro/steering/`
  (its native Kiro target) via:
  `npm install -g ui-ux-pro-max-cli && uipro init --ai kiro`
  Once installed it activates automatically on UI/UX requests — no need to
  invoke it manually per screen, but state the stack explicitly in the
  prompt (plain HTML/CSS/JS here, not Tailwind) since it defaults to
  HTML+Tailwind otherwise.
- Before starting the restyle of any specific screen, ask the user for the
  reference image for that screen if one hasn't already been shared in this
  session. Do not improvise a layout from the design system tokens alone —
  the tokens (color/type/spacing) are the shared foundation, but the
  per-screen layout comes from the reference image. If no image is provided
  after asking, say so explicitly and wait rather than guessing.
- After restyling a screen, run the app (`dotnet run`) and point out the
  URL/page so the user can view the actual rendered result in a browser
  before moving to the next screen. This is a checkpoint, not a formality —
  treat it as expected that the user may ask for changes. Iterate on the
  same screen (spacing, colors, layout tweaks) until they confirm it
  matches what they want, rather than proceeding to the next screen or
  committing on the first pass.
```

### `.kiro/steering/design-system.md` (file-match on `*.html`, `*.css` in `admin/`, `coordinator/`, `driver/`, `assets/`)

```markdown
Follow the Academic Transit design tokens specified in
#[[file:docs/design-system.md]] — this is the same design system already
applied to the Android app; the web portal should look like the same
product, not a different one.
```

## Agent Hooks

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Block Program.cs Edits During Restyle",
      "trigger": "PreToolUse",
      "matcher": "fs_write|str_replace",
      "action": {
        "type": "agent",
        "prompt": "If this edit targets Program.cs, stop and ask for explicit confirmation before proceeding — the web restyle pass should only touch admin/, coordinator/, driver/, and assets/ HTML/CSS/JS files."
      }
    },
    {
      "name": "Refuse To Style Over Conflict Markers",
      "trigger": "PreToolUse",
      "matcher": "fs_write|str_replace",
      "action": {
        "type": "command",
        "command": "grep -q '<<<<<<<' ${file} && echo 'BLOCKED: resolve merge conflict markers in this file first' && exit 2 || exit 0"
      }
    },
    {
      "name": "Lint JS/CSS on Save",
      "trigger": "PostFileSave",
      "matcher": "\\.(js|css)$",
      "action": { "type": "command", "command": "npx eslint --fix ${file}" }
    }
  ]
}
```

The conflict-marker hook is the one doing the real work here — it's a hard
stop rather than a reminder, since this is the failure mode most likely to
turn a "restyle" into a silently-broken merge.

## Multi-File Context

For each screen, load together: the reference design image/Stitch screen +
the current `.html` file + its paired `.js` file + `assets/css` shared
styles + `docs/design-system.md`. Given there's no component structure, the
HTML/JS pairing is the closest thing this repo has to "the screen," so both
need to be in context at once.

## Practical Workflow

```
1. Phase 0: resolve conflict markers in Program.cs + the 4 affected
   CSS/JS files. Separate commits, separate review, not a UI change.
2. Lock the shared sidebar/top bar/card/badge styles once
   (Phase 1 in tasks-web-ui-redesign.md).
3. One Spec session per portal (coordinator, admin, driver).
4. Load: reference image + current .html + paired .js + design tokens.
5. Supervised execution, review each hunk.
6. Confirm: fetch() calls unchanged, console logs intact, comments added,
   Program.cs untouched.
7. Run the app (`dotnet run`) and show the user the live screen. Iterate on
   this same screen until they confirm it matches before moving on.
8. Run the conflict-marker + lint hooks, commit per screen.
```