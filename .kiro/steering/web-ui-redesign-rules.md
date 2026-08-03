# Web Portal UI Redesign Rules

## Stack (overrides any skill/steering default)

This repo is **ASP.NET Core (.NET 10) + plain HTML / CSS / JS**. There is no
build step, no bundler, no package.json for the web assets, no framework.

- NOT Tailwind. NOT React/Vue/Next. NOT shadcn/ui. NOT Radix.
- Any installed design skill (ui-ux-pro-max, ui-styling, design-system,
  shadcn/tailwind references) is consulted for **spacing/color/component
  reasoning only**. Translate its advice into hand-written CSS in
  `assets/css/*.css` using CSS custom properties. Never emit Tailwind utility
  classes, `@apply`, `tailwind.config.*`, `.tsx`, or `npx shadcn` commands
  into this repo.
- When prompting a design skill, state the stack explicitly: "plain
  HTML/CSS/JS, no Tailwind, no framework".

## Scope

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
- Do not modify the static-file middleware registrations
  (UseStaticFiles/UseFileServer) in Program.cs under any circumstance —
  that's infrastructure, not UI, and is explicitly out of scope even though
  it lives in the same file you're avoiding.
- Consult the ui-ux-pro-max skill for spacing/color/component decisions
  before finalizing a screen. It is installed into `.kiro/steering/` and
  activates automatically on UI/UX requests — no need to invoke it manually
  per screen, but state the stack explicitly in the prompt (plain
  HTML/CSS/JS here, not Tailwind) since it defaults to HTML+Tailwind
  otherwise.

## Reference image is required per screen

- Before starting the restyle of any specific screen, ask the user for the
  reference image for that screen if one hasn't already been shared in this
  session. Do not improvise a layout from the design system tokens alone —
  the tokens (color/type/spacing) are the shared foundation, but the
  per-screen layout comes from the reference image. If no image is provided
  after asking, say so explicitly and wait rather than guessing.

## Per-screen checkpoint

- After restyling a screen, run the app (`dotnet run`) and point out the
  URL/page so the user can view the actual rendered result in a browser
  before moving to the next screen. This is a checkpoint, not a formality —
  treat it as expected that the user may ask for changes. Iterate on the
  same screen (spacing, colors, layout tweaks) until they confirm it
  matches what they want, rather than proceeding to the next screen or
  committing on the first pass.
