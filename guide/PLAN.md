# Toa developer guide — structure

## Context

Toa's documentation is scattered: a feature-list `readme.md`, a `documentation/` folder that mixes
current pages (outbox, compositions, ports) with stubs (ucp, extensions, deployment) and stale
ones (receiver, design), and per-package readmes of uneven depth. Nothing tells a new developer
what the project is, what its concepts are, and how to go from an empty directory to a deployed
system. A single canonical set, `guide/` at the repository root, replaces that. This plan is the
structure only; page content is a later task. The intro (product–platform separation, opinionated
runtime, motivation) is already written by the user and becomes the top of `guide/readme.md`.

Decisions taken with the user:

- `guide/` is the canonical set. **Every page is written for the guide.** No existing file is
  moved in as it is, and no page is a pointer to a readme elsewhere. Existing documents are
  absorbed by content: each is split across the guide pages its content belongs to, rewritten to
  house style. Once absorbed, the source is deleted, or, where npm shows it (a package readme),
  reduced to one paragraph and a link to the guide.
- Plain Markdown, navigable on GitHub. No site generator.
- Audiences: application developers (parts 1–8) and extension/connector authors (part 9).
  Contributor process docs stay in `CONTRIBUTING.md` and `documentation/contributing/`.
- English. House style is `CONTRIBUTING.md#documentation`: what to declare, what to call, what
  you get back, what you must handle — never how it works inside. `extensions/cadence/readme.md`
  is the reference for tone.

## Ordering and naming

Directories and files in the reading parts are number-prefixed (`2-components/03-operations.md`).
GitHub's tree view sorts alphabetically and has no sidebar, so numbers are the only way the tree
itself reads in order. `8-reference/` files are unnumbered: they are looked up by name. Two-digit
file prefixes leave room to insert without renumbering. Index files are `readme.md`, lowercase,
matching the repository.

## Tree

```
guide/
  readme.md                      intro (user-written) + full table of contents
  images/
  1-start/
    readme.md
    01-concepts.md
    02-install.md
    03-first-app.md
    04-layout.md
  2-components/
    readme.md
    01-manifest.md
    02-entity.md
    03-operations.md
    04-implementation.md
    05-request-reply.md
    06-calls.md
    07-events.md
    08-receivers.md
    09-guards.md
    10-consistency.md
    11-prototype.md
    12-typescript.md
  3-application/
    readme.md
    01-context.md
    02-compositions.md
    03-connectors.md
    04-configuration.md
    05-outbox.md
  4-http/                        the exposition extension
    readme.md
    01-resources.md
    02-authentication.md
    03-authorization.md
    04-oauth.md
    05-traffic.md
    06-files.md
    07-rpc-and-mcp.md
  5-extensions/
    readme.md
    01-cadence.md
    02-stash-and-state.md
    03-atomicity.md
    04-realtime.md
    05-fetch.md
  6-workflow/
    readme.md
    01-run.md
    02-test.md
    03-observe.md
  7-deploy/
    readme.md
    01-build.md
    02-deploy.md
    03-upgrade.md
  8-reference/
    readme.md
    manifest.md
    context.md
    context-object.md
    query.md
    exceptions.md
    cli.md
    environment.md
    ports.md
    glossary.md
  9-extending/
    readme.md
    01-extensions.md
    02-connectors.md
```

47 pages, 10 index files.

## Pages

Each page answers the one question stated. Sections are the intended `##` headings. "Absorbs"
lists the existing documents whose content lands on the page; "Code" lists what the rest is
written from. A source that appears under several pages is split between them.

### 1-start — from nothing to a running call

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-concepts.md` | What are the building blocks: component, entity, operation, event, receiver, Context, composition, connector, extension? | one paragraph and one link per noun · the line between product and platform | `documentation/notes/cc.md`, `documentation/design.md` (intro) | — |
| `02-install.md` | What do I need installed, and how do I get `toa`? | prerequisites: Node ≥ 24, Docker, kubectl and helm for deploy · `@toa.io/runtime`, version lock, dist-tags `alpha`/`latest` · local infrastructure: `docker-compose.yaml`, `npm run setup:mongo` · verifying | root `readme.md` (Status), `CONTRIBUTING.md` (Prerequisites) | `docker-compose.yaml`, root `package.json` scripts |
| `03-first-app.md` | How do I write, run and call a minimal application? | one-line `context.toa.yaml` · one component: manifest + one operation file · `toa compose`, `toa call`, the reply · a second component and a remote call | `userland/readme.md` | `userland/example/components/echo`, `math.proxy`, `userland/example/context.toa.yaml` |
| `04-layout.md` | How is an application repository laid out? | component directory: `manifest.toa.yaml`, `operations/`, `events/`, `receivers/`, `guards/`, `rc/`, `lib/` · Context root: `context.toa.yaml`, `.env`, `types/` · names: namespace, name, and what the locator derives (id, label, hostname, env-var names) | `connectors/bridges.node/readme.md` (Algorithm Definition, layout paragraphs), `CONTRIBUTING.md` (Userspace) | `userland/example/`, `/home/temich/claude/ants.toa/application/`, `runtime/core/source/locator.ts` |

### 2-components — declaring and implementing one component

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-manifest.md` | How do I declare a component? | identity keys: `name`, `namespace`, `version`, `prototype` · structural keys: `entity`, `operations`, `events`, `receivers`, `guards`, `bindings`, `bridge` · extension shortcuts and `extensions`; always-on extensions · seeing the result: `toa export manifest` | `documentation/component/declaration.md` (Operations description) | `runtime/norm/src/.component/schema.yaml`, `runtime/norm/src/shortcuts.js` |
| `02-entity.md` | How do I declare the state a component owns? | `entity.schema`, `custom` · system properties `id`, `VERSION`, `CREATED`, `UPDATED`, `DELETED` · `unique`, `index`, `associated` · versions and optimistic concurrency; deletion is a tombstone · `storage` choice | `documentation/design.md` ("Nothing removes a record"), `migrations/285.md` | schema `entity`, `runtime/prototype/manifest.toa.yaml`, `runtime/core/source/types/storages.ts` |
| `03-operations.md` | How do I declare an operation? | types: transition, observation, assignment, computation, effect, unmanaged · scopes and the type/scope/query/concurrency matrix · `concurrency`, `forward`, input defaults (`default: .property`) · declared `errors` vs exceptions · rules an algorithm obeys; unmanaged reads only | `documentation/design.md` (Operations, Types, Safety, Genuine Operations, Declaration) | schema `operations` |
| `04-implementation.md` | How do I implement operations in Node.js? | function, class and factory forms · module layout: `operations/`, `events/`, `receivers/`, `guards/` · the `context` object: `env`, `name`, `operation`, `local`, `remote`, aspect shortcuts · `rc/`: preflight, settle, dispose · Bash bridge for computations | `connectors/bridges.node/readme.md` (Function, Class, Factory, Storing Context, Run Commands), `connectors/bridges.bash/readme.md`, `CONTRIBUTING.md` (Userspace, Exports alias rule) | `connectors/bridges.node/types/context.d.ts` |
| `05-request-reply.md` | What does an operation receive and what must it return? | Request: `input`, `query`, `entity`, `authentic`, `task`, `source` · Query in brief; full in reference · Reply: `output`, `error`, `exception`; what each operation type returns · phases retrieve → run → commit; what the runtime does with the returned state | `documentation/communication/ucp.md`, `documentation/design.md` (phases, Algorithm Example) | `runtime/core/source/types/request.ts`, `exceptions.ts`, `runtime/prototype/` |
| `06-calls.md` | How do I call other components? | `context.local.<op>()`, `context.remote.<ns>.<component>.<op>()` · handling `error` vs exception; `Maybe<T>` · `task: true` · discovery: what must be running for a remote to resolve; `toa call` | `runtime/cli/readme.md` (`call`) | `context.d.ts`, `runtime/core/source/remote.ts`, `discovery.ts`, `userland/example/components/math.proxy` |
| `07-events.md` | How do I emit events from state changes? | system events `created`, `updated`, `deleted`, `sync` · custom events: `events/` files, `conditioned`, `subjective`, `binding` · message shape: `origin`, `state`, `trailers`, `input` · publication gating: Context `events:`, `TOA_EVENTS_*` · delivery guarantee → outbox | `documentation/component/declaration.md` (Events), `documentation/outbox.md` (The event, trailers) | schema `events`, `runtime/prototype/events/` |
| `08-receivers.md` | How do I react to another component's events? | declaration: `operation`, `source`, `binding`, `bridge`, `path` · condition and adaptation: `conditioned`, `adaptive`, `arguments` · concise forms · foreign events | `documentation/component/receiver.md`, `documentation/component/declaration.md` (Receivers) | schema `receivers`, `features/events/arguments.feature` |
| `09-guards.md` | How do I enforce invariants on every state change? | declaration and `guards/` files · what a guard receives, how it rejects · when it runs relative to commit and events | — | schema `guards`, `runtime/core/source/guard.ts`, `features/steps/.workspace/components/collection/transition.guards/` |
| `10-consistency.md` | What is guaranteed between components, and what must my code tolerate? | one object, one version: what `retry` does and when a transition is re-run · events: at-least-once, ordering, duplicates → idempotent receivers · reads may lag writes · what is transactional (state and its events) and what is not (remote calls, delays) | `documentation/outbox.md` (Guarantees), `extensions/cadence/readme.md` (What to expect, both sections), `documentation/notes/logs-ordering.md` (the ordering argument, one paragraph) | `runtime/core/source/transition.ts` |
| `11-prototype.md` | What does the generic prototype give my component, and how do I change it? | inherited: system schema, `transit`, `observe`, `enumerate`, `assign`, `ensure`, `stream`, `terminate`, events · overriding an inherited operation · `prototype: null`; chaining | `documentation/design.md` (prototype mention) | `runtime/prototype/`, schema `prototype`, `features/prototypes/` |
| `12-typescript.md` | How do I write components in TypeScript? | `toa types` and `@components/<name>` · typing operations, entity, context · erasable syntax, `import type`, relative-import extensions · tests | root `typescript.md` (component rules), `connectors/bridges.node/readme.md` (TypeScript), `runtime/cli/readme.md` (`types`), `CONTRIBUTING.md` (Userspace TS paragraph) | — |

### 3-application — declaring the whole system

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-context.md` | How do I declare the application? | `name`, `version`, `runtime`, `registry` · environments and `key@env`; `TOA_ENV` · `events`, `atomicity`, `outbox`, `mono`, `ingress`, `resources`, one paragraph each · connector and extension annotations: where they go | `operations/readme.md` (registry, build), `runtime/cli/readme.md` (`mono:` block) | `runtime/norm/src/.context/schema.yaml`, `ants.toa/application/context.toa.yaml`, `userland/example/context.toa.yaml` |
| `02-compositions.md` | How do I group components into deployable units? | declaration; derived compositions · extension services inside a composition; `--service` and `TOA_SERVICES` · resources per composition and the Context default · base image and conflicts | `documentation/compositions.md` (all but deployed names and labels), `runtime/cli/readme.md` (`--service` paragraphs), `operations/readme.md` (compositions) | `runtime/core/source/composition.ts` |
| `03-connectors.md` | How do I choose and connect bindings, storages and bridges? | bindings `amqp` (default) and `loop`; what changes between them · storages `mongodb`, `sql`, `null`, custom by path · connection annotations: `.` default, per-component overrides, credentials · local defaults | `libraries/pointer/readme.md`, `connectors/bindings.amqp/readme.md`, `connectors/storages.sql/readme.md`, `connectors/storages.mongodb/readme.md` | `connectors/bindings.loop/` |
| `04-configuration.md` | How do I pass configuration and secrets to a component? | schema and defaults in the manifest · Context annotation, `$SECRET`, `resources` · reading: `context.configuration`, `.unwrap()` · changing at runtime: HTTP resources, the UI · secrets: `toa conceal`, `TOA_CONFIGURATION_*` override | `extensions/configuration/readme.md`, `runtime/cli/readme.md` (`conceal` example), `CONTRIBUTING.md` (Userspace secret line) | — |
| `05-outbox.md` | How do I get guaranteed event delivery? | what commits together · lanes and ordering · timings: interval, batch, retention, gap · operating: what to watch | `documentation/outbox.md` (Row, Pump, Lanes, Timings, Operating) | `runtime/core/source/outbox/` |

### 4-http — the exposition extension

`readme.md`: one paragraph on what exposition is (a gateway that turns operations into HTTP
resources), the ports it uses, and the ordered page list.

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-resources.md` | How do I expose operations over HTTP? | `exposition:` resource tree, routes, methods · Context annotation: `authorities`, `class`, `annotations`, `protocol`, `ip`, `debug` · query string → Query mapping · HTTP context → input mapping · media types, HTTP/1 and h2c, multipart · `OPTIONS` discovery · readiness and ports | `extensions/exposition/readme.md`, `documentation/{tree,query,map,protocol,authorities,ip,introspection,require}.md`, `documentation/ports.md` (8000, 8004) | — |
| `02-authentication.md` | How do callers prove who they are? | schemes: Basic, Token, Bearer, OTP, authorization code, inception, assertion · tokens and keys: `toa key`, rotation · federation (OIDC) · passkeys · persistent credentials · bans · the identity components' configuration | `documentation/{identity,credentials,passkeys}.md`, `documentation/components.md` (identity.basic, tokens, keys, federation, otp, passkeys, credentials, bans), `runtime/cli/readme.md` (`key`), `CONTRIBUTING.md` (Exposition: no cookies, `authorization` header) | — |
| `03-authorization.md` | How do I control who may call what? | `auth:` directives: `anonymous`, `anyone`, `id`, `role`, `claims`, `rule`, `input`, `delegate` · roles and hierarchies · policies · what a check may read (token and cache, never storage) | `documentation/access.md`, `documentation/components.md` (identity.roles), `CONTRIBUTING.md` (Exposition: request-path I/O rule) | — |
| `04-oauth.md` | How do I act as an OAuth 2.1 authorization server? | annotation: discovery, dynamic client registration, PKCE · the consent page an application serves · clients and grants components | `documentation/{oauth,consent}.md`, `documentation/components.md` (identity.clients, grants) | — |
| `05-traffic.md` | How do I shape requests and responses: cache, throttle, CORS, redirects, stubs? | `cache:` and HTTP caching · `io:` input, output, status; throttling (GCRA) · `cors:` (undocumented today, written here) · `flow:fetch` · `dev:stub` · tracing headers (`ray`) | `documentation/{cache,io,flow,dev,tracing}.md` | `source/directives/cors/`, `features/cors.feature` |
| `06-files.md` | How do I store, upload and serve files? | naming stores and providers: `s3`, `spaces`, `cloudinary`, `fs`, `tmp` · `context.storages.<name>`: `put`, `head`, `get`, `fetch`, `delete`, `move` · entries, variants, deduplication · `octets:` directives over HTTP · secrets for providers | `extensions/storages/readme.md`, `extensions/exposition/documentation/octets.md`, `documentation/components.md` (exposition.octets) | — |
| `07-rpc-and-mcp.md` | How do I call operations as procedures or as tools? | JSON-RPC at `/.rpc` · MCP at `/.mcp`; `mcp:tool` · what both inherit from the tree: authorization, throttling | `documentation/{rpc,mcp}.md` | — |

### 5-extensions — other capabilities a component switches on

`readme.md` is a table: extension → question → enabled where (manifest, Context, always on) →
page. Telemetry and introspection point at `6-workflow/03-observe.md`; configuration at
`3-application/04`; exposition and BLOB storages at part 4.

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-cadence.md` | How do I run operations on a schedule or later? | pulse: `cycle`, `intervals`, the `{ n, i }` input · what to expect from a pulse · delay: `context.delay`, `interval`, `overdue`, `cancel` · discreteness · Context annotation | `extensions/cadence/readme.md` (all; the two "What to expect" sections also feed `2-components/10`), `documentation/component/declaration.md` (Cadence) | — |
| `02-stash-and-state.md` | How do I keep transient data, shared or per instance? | stash: Redis, `context.stash`, `store`/`fetch`, key scoping, annotation as a pointer · state: `state: ~`, `context.state`, per-instance semantics, `rc/` as the place to fill it | `extensions/stash/readme.md`, `extensions/state/readme.md` | — |
| `03-atomicity.md` | How do replicas decide something together? | `context.atom`: `slots` and `onassigned`, `meter`, `lock` · annotation: `redis` list, `interval`; `TOA_DEV` default · what depends on it: cadence, throttling, outbox | `connectors/atomicity/readme.md` | — |
| `04-realtime.md` | How do I push events to clients? | manifest `realtime:` event → key · Context annotation · consuming a stream over HTTP; heartbeat · what is not implemented (dynamic routes) | `extensions/realtime/readme.md` | — |
| `05-fetch.md` | How do I call external HTTP services? | `context.fetch`, retry options · telemetry it emits · what is allowed by default (deny-by-default rule) | `extensions/fetch/readme.md`, `CONTRIBUTING.md` (Security) | — |

### 6-workflow — the daily loop

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-run.md` | How do I run the application locally? | `toa compose` (`--kill`, `--service`, `--dock`, `--context`), `toa mono`, `toa serve` · `toa env` (`--dev`, `--interactive`), `.env`, `TOA_DEV`, `TOA_DEBUG` · `toa export manifest` · startup diagnostics: `--wtf`, `TOA_BOOT_TRACE` | `runtime/cli/readme.md` (Development section, `host.docker.internal` note, `.env*` note) | `docker-compose.yaml`, `ants.toa/package.json` scripts |
| `02-test.md` | How do I test components and the application? | unit-testing an operation function · `@toa.io/userland/stage`: `component`, `composition`, `serve`, `remote`, `shutdown`; environment for tests · feature tests: cucumber and the HTTP agent | `userland/stage/readme.md`, `libraries/agent/readme.md`, root `typescript.md` (Tests, Cucumber with ts-flow) | `userland/example/stage/*.test.js` |
| `03-observe.md` | How do I see what the application is doing? | logs: `--log`, `context.logs`, levels per component · spans: `context.span`, sampling, exporters · readiness probe · introspection: annotation, UI, API · local Grafana, Tempo, Prometheus | `extensions/telemetry/readme.md`, `extensions/telemetry/grafana.md`, `extensions/introspection/readme.md`, `extensions/exposition/documentation/tracing.md` (trace continuation) | `observability/` |

### 7-deploy

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-build.md` | How do I build and publish images? | `toa build`, `toa push`; registry, credentials, `build.image` · image kinds: composition, mono, service; deployed names and tags · `toa export images \| tags` · base image `ghcr.io/toa-io/runtime:<version>` | `runtime/cli/readme.md` (`build`, `export tags`), `operations/readme.md` (image, credentials), `documentation/compositions.md` (deployed names, images, tags), `documentation/deployment.md` (image, if it says anything the text does not) | `operations/src/deployment/images/` |
| `02-deploy.md` | How do I deploy to Kubernetes? | `toa deploy` (`--namespace`, `--wait`, `--dry`, `--mono`); `toa export deployment` · environments and `key@env` · secrets: `conceal`, `reveal`, `export secrets` · ingress, resources, extension services, pod labels · `toa shell`, `toa limits` | `runtime/cli/readme.md` (Operations section), `documentation/compositions.md` (labels), `migrations/282.md` (labels) | `operations/src/deployment/chart/values.yaml`, `.context/schema.yaml` |
| `03-upgrade.md` | How do I move to a newer runtime version? | version lock and the `runtime` key · reading `migrations/<N>.md` and the changelog · bumping every `@toa.io/*` together | `migrations/README.md` (reader's half) | `CHANGELOG.md`, `ants.toa/package.json` (`toa:upgrade`) |

### 8-reference — looked up, not read

| Page | Question | Absorbs | Code |
|---|---|---|---|
| `manifest.md` | What does every `manifest.toa.yaml` key accept? Includes the type/scope/query/concurrency matrix and the shortcuts table. | — | `.component/schema.yaml`, `shortcuts.js` |
| `context.md` | What does every `context.toa.yaml` key accept, including every annotation? | annotation sections of every extension readme, `libraries/pointer/readme.md` (format) | `.context/schema.yaml`, `.context/dependencies/` |
| `context-object.md` | What is on `context` inside an operation, and which page explains each member? | — | `connectors/bridges.node/types/context.d.ts`, `src/shortcuts/` |
| `query.md` | What are the Query fields and the RSQL criteria grammar? | `extensions/exposition/documentation/query.md` (grammar part) | `runtime/core/source/types/request.ts`, `query/criteria.ts` |
| `exceptions.md` | What does each exception code mean, and which side raised it? | — | `runtime/core/source/exceptions.ts` |
| `cli.md` | What are all `toa` commands and options? | `runtime/cli/readme.md` (option lists) | `runtime/cli/src/commands/` |
| `environment.md` | Which environment variables does the runtime read? | `documentation/outbox.md` (`TOA_OUTBOX_*`), `extensions/telemetry/readme.md`, `extensions/configuration/readme.md`, `runtime/cli/readme.md` | `runtime/cli/src/handlers/env.js` |
| `ports.md` | Which TCP ports are reserved? | `documentation/ports.md` | — |
| `glossary.md` | What does each term mean, exactly? One line per term, alphabetical. | — | the terminology table below |

### 9-extending — for extension and connector authors

| Page | Question | Sections | Absorbs | Code |
|---|---|---|---|---|
| `01-extensions.md` | How do I write an extension? | Factory hooks: `aspect`, `tenant`, `service`, `component`, `context`, `manage`, `storage`, `emitter`, `receiver`, `manifest` · `Contribution` and generated types · terms: aspect, tenant, annotation · packaging; the `open()` rule; a BLOB provider as a worked example | `documentation/extensions.md`, `extensions/storages/source/providers/readme.md` | `runtime/core/source/types/extensions.ts`, `extensions/stash/`, `runtime/boot/src/extensions/` |
| `02-connectors.md` | How do I write a storage, binding or bridge? | storage contract; custom storage by relative path · binding contract; `loop` as the reference · bridge contract | — | `runtime/core/source/types/{storages,bindings,bridges}.ts`, `connectors/storages.null/`, `connectors/bindings.loop/`, `connectors/bridges.bash/` |

## Terminology

Resolved in `8-reference/glossary.md` and applied on every page.

| Collision | Canonical | Rule |
|---|---|---|
| context: application vs object vs hook vs CLI path | **Context** / `context` | Capitalised **Context** is the application declared by `context.toa.yaml` (the CLI already says "Deploy a Context"). Code-formatted `context` is the object an operation receives. In prose where the distinction does not matter, "the application". The extension hook is "the `context` hook" (part 9 only). |
| operations: manifest key, source directory, `operations/` workspace | **operation** | An endpoint of a component. The directory is always `operations/` with the slash. The deployment tooling is never called "operations" in the guide; that part is "Deploy". |
| ports | **port** | TCP only. What a component exposes are operations. |
| locator / discovery / pointer | all three, distinct | **locator**: identity derived from `namespace.name`. **discovery**: runtime lookup of a remote component. **pointer**: connection-URL resolution from an annotation. |
| event | **event** | A message a component publishes on a state change. Prototype ones are **system events**; realtime output is a **stream**. |
| state | **entity state** vs **instance state** | The persisted object vs the `state` extension's in-memory object. |
| properties | always qualified | **entity properties** (schema) vs **system properties** vs **component properties** (manifest key). |
| source | always qualified | **event source** (receiver) vs **request source**. |
| aspect / tenant / annotation | keep | Defined once in `9-extending/01-extensions.md`; the glossary carries one line each. |

## Navigation convention

- **Root `guide/readme.md`**: the intro, then `## Contents`: one numbered item per part, each
  with a nested list `- [Title](1-start/02-install.md) — question`. This is the only place a
  page's question appears outside the page.
- **Per-folder `readme.md`**: `# Part title`, one sentence stating what the reader can do after
  the part, then the ordered `[Title](file) — question` list. `5-extensions/readme.md` is the
  table described above. Footer as below.
- **Footer** on every page except the root readme, after a `---` rule, one line:
  `[← Entity](02-entity.md) · [Components](readme.md) · [Operations →](03-operations.md)`.
  Order: previous · up · next. First page of a part: previous is the part readme. Last page:
  next is the next part's readme. Titles in the footer equal the page's `#` heading.
- **Links**: relative only, from the linking file. Links out of the guide go to code, never to
  another document; a fact a page needs is written on the page. Anchors are GitHub's
  lowercase-hyphen form.
- **Images**: `guide/images/<part>-<slug>.<ext>`; prefer YAML and tables over diagrams.
  `documentation/notes/tree.jpg` is the only candidate to move.

## What happens to the sources

The rule: once every page that absorbs a document exists, the document is deleted. A package
readme that npm displays is instead cut to one paragraph, what the package is, and links to the
guide pages that cover it. Nothing is deleted or cut in this task.

| Source | After absorption |
|---|---|
| `documentation/*.md`, `documentation/component/`, `documentation/communication/`, `documentation/notes/cc.md` | delete; `documentation/` then holds `contributing/` and `notes/logs-ordering.md` only |
| root `typescript.md` | keep the package-authoring half (tsconfig, workspaces) — it is contributor material; cut the component half |
| `runtime/cli/readme.md`, `userland/stage/readme.md`, `userland/readme.md`, `operations/readme.md`, `libraries/pointer/readme.md`, `libraries/agent/readme.md`, `connectors/*/readme.md`, `extensions/*/readme.md`, `extensions/telemetry/grafana.md` | cut to a paragraph and links |
| `extensions/exposition/documentation/*.md` | delete; `notes/` stays (design notes) |
| `extensions/storages/source/providers/readme.md` | delete |
| `extensions/configuration/notes/consistency.md`, `extensions/exposition/documentation/notes/` | keep; design notes, not documentation |
| `migrations/README.md` | keep; its writer's half is contributor material |
| root `readme.md` Features section | replace with a link to `guide/readme.md` |
| `CONTRIBUTING.md` Userspace, Security, Exposition sections | keep; they are rules for Toa's own code, restated for application developers where the tables above say so |

## First pages to write

1. `guide/readme.md` and all ten folder readmes with questions only, so the set is navigable
   from day one.
2. `8-reference/glossary.md` — locks terms before any prose is written.
3. `1-start/01-concepts.md`
4. `2-components/01-manifest.md`
5. `2-components/03-operations.md`
6. `2-components/05-request-reply.md`
7. `1-start/03-first-app.md`
8. `2-components/07-events.md`
9. `6-workflow/01-run.md`

The pages with the most absorbed content (`3-application/05-outbox.md`, `4-http/*`,
`5-extensions/01-cadence.md`) cost least per page and can be written in any order after these.

## Verification

- Every page in the tree exists and its `#` heading matches its footer and index titles.
- Every relative link resolves: `find guide -name '*.md' | xargs grep -o '](\.[^)]*)'` checked
  against the filesystem, or `npx markdown-link-check`.
- Every section of every source in the tables above is accounted for by a page, so no fact is
  lost when the source is deleted. Checked by reading each source once against the guide before
  its deletion.
- The root readme's Features list has a guide page for each bullet, or the bullet is dropped
  (e.g. "Flow control", which nothing in the repository defines).
