## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

## Architecture

Before making any changes to the codebase, **always refer to `architecture.md`** for:

- Domain organization, layer responsibilities, and conventions
- Component organization (domain vs shared)
- Forms pattern and service connectors
- Linked entities pattern
- Svelte conventions (reactivity, navigation, persistent state, class merging)
- Internationalization (i18n)
- Testing (Playwright BDD structure, conventions, running tests)

Understanding the architecture is essential for maintaining code quality and consistency.

## Backend API

This app is the resource discovery UI of the Toa runtime, and lives inside it: the backend is the
repository around it.

- What it reads is one request, `OPTIONS /.discovery`, answered by the gateway itself — every
  route an application serves that this caller may reach. See
  `extensions/exposition/documentation/discovery.md`, and `introspection.md` for what one entry is.
- What a resource and its methods are called comes from the `help` directive family
  (`documentation/help.md`); what guards them — `private`, `protected`, `system` — from `auth`.
- The HTTP protocol it speaks — queries, errors, caching, authentication — is documented in
  `extensions/exposition/documentation`.
- The page is served by the gateway out of `dist`, under the mount path `/.discovery`
  (`source/Discovery/Site.ts`). It is therefore always on the API's own origin, here and in a
  deployment alike — see `src/config/index.ts`.
- It reads without signing in: an anonymous route is described to anyone, and signing in adds
  what that identity may reach besides.
- It also calls: pressing a verb opens a dialog that sends that request as whoever is reading,
  and shows what came back. The calls are real — a `DELETE` is held down rather than clicked.

## Verification

Before calling a change done, verify it:

- **`npm run check`** - Type and Svelte checks pass.
- **`npm run format`** - Lint and format (eslint `--fix`).
- **Check it in a browser** - Load the change in a headless browser and confirm it renders and behaves as intended. Use any available tool: `/agent-browser`, Chrome DevTools MCP, Playwright MCP.

### Measure or Eyeball

A running UI is inspected two ways: **measure** it or **eyeball** it. Measuring reads exact values from the live DOM — `evaluate` JS returning numbers (`getBoundingClientRect`, `getComputedStyle`, `elementFromPoint`) — and is the default for anything with a number: size, position, gap, color, font, real visibility. Eyeball only what the eye alone settles: broken layout at a glance, occlusion, whether the composition reads. A screenshot is a **witness, not a verdict** — it flags a suspicion; the measurement decides. Never read a number off a screenshot.
