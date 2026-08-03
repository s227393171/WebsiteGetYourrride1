---
inclusion: fileMatch
fileMatchPattern: '{admin,coordinator,driver,assets}/**/*.{html,css}'
---

Follow the Academic Transit design tokens specified in
#[[file:docs/design-system.md]] — this is the same design system already
applied to the Android app; the web portal should look like the same
product, not a different one.

Implement the tokens as hand-written CSS custom properties in
`assets/css/`. This repo has no build step: no Tailwind, no `@apply`, no
framework components.
