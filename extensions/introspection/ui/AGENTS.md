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

This app is the introspection UI of the Toa runtime, and lives inside it: the backend is the
repository around it.

- The map is two ordinary components, `extensions/introspection/components/introspection.{nodes,edges}`;
  their `manifest.toa.yaml` declares both the entity and the endpoints it is exposed at.
- The HTTP protocol those endpoints speak — queries, errors, caching, authentication — is
  documented in `extensions/exposition/documentation`.
- The page is served by `extensions/introspection/source/UI.ts` out of `dist`, under the mount
  path `/.introspection`. The API is on the app's own origin, except locally, where it is
  `:8000` — see `src/config/index.ts`.

## Verification

Before calling a change done, verify it:

- **`npm run check`** - Type and Svelte checks pass.
- **`npm run format`** - Lint and format (eslint `--fix`).
- **Check it in a browser** - Load the change in a headless browser and confirm it renders and behaves as intended. Use any available tool: `/agent-browser`, Chrome DevTools MCP, Playwright MCP.

### Measure or Eyeball

A running UI is inspected two ways: **measure** it or **eyeball** it. Measuring reads exact values from the live DOM — `evaluate` JS returning numbers (`getBoundingClientRect`, `getComputedStyle`, `elementFromPoint`) — and is the default for anything with a number: size, position, gap, color, font, real visibility. Eyeball only what the eye alone settles: broken layout at a glance, occlusion, whether the composition reads. A screenshot is a **witness, not a verdict** — it flags a suspicion; the measurement decides. Never read a number off a screenshot.
