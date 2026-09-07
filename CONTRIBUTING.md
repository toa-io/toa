# Contributing

## Running Features

Cucumber scenarios boot a composition in the test process, so the runtime needs the same
infrastructure a deployed application does.

### Prerequisites

Start the services the runtime connects to, from the repository root:

```shell
$ npm run setup:mongo               # once, generates the replica set keyfile
$ docker compose up -d
```

Without them a scenario hangs at `Starting composition` and prints no error.

### Ports

An application built on Toa is developed on the same machine, and every one of them carries the
same compose file — on the conventional ports, with its services on `8000`-`8004`. So none of
what a Toa checkout binds is conventional: the whole of it sits in `31000`-`31099`, and a
`31xxx` in `ss -tlnp` is Toa's own and nothing else's.

| port    | what                                          | conventionally |
| ------- | --------------------------------------------- | -------------- |
| `31000` | exposition gateway                            | `8000`         |
| `31001` | telemetry readiness probe                     | `8001`         |
| `31002` | introspection UI                              | `8002`         |
| `31003` | configuration UI                              | `8003`         |
| `31004` | exposition readiness probe                    | `8004`         |
| `31005` | the mock IdP of the exposition suite          | —              |
| `31010` | RabbitMQ                                      | `5672`         |
| `31011` | RabbitMQ management                           | `15672`        |
| `31012` | RabbitMQ, the second broker a scenario starts | —              |
| `31020` | MongoDB                                       | `27017`        |
| `31021` | MongoDB, the standalone a scenario starts     | —              |
| `31040` | Redis                                         | `6379`         |
| `31041` | Redis, the second                             | `6378`         |
| `31042` | Redis, the third                              | `6377`         |
| `31050` | LocalStack                                    | `4566`         |
| `31060` | Tempo                                         | `3200`         |
| `31061` | Tempo, OTLP/HTTP                              | `4318`         |
| `31070` | Prometheus                                    | `9090`         |
| `31080` | Grafana                                       | `3000`         |

The block is below `net.ipv4.ip_local_port_range`, so an outgoing connection is never already
holding one of these when the stack comes up.

The ports a deployment uses are the conventional ones and stay that way: `8000` is what the
chart renders and what an application serves on. What moves is only what a checkout binds
locally — the compose file, the suites, and the addresses the `TOA_DEV` fallbacks name.

A stack that ran on the conventional ports has a replica set configured for the old address, and
MongoDB will not start on the new one until that anonymous volume is gone:

```shell
$ npm run compose                   # recreates the stack, volumes and all
```

The deployment scenarios render a chart, so `helm` has to be on the `PATH`; without it the
command produces nothing and the scenario reads an empty `stdout`.

The Cloudinary scenarios upload to a real account, which no compose file can stand up. They are
tagged `@manual` and run in neither group; to run them, name an account in
`features/steps/.env` — see `.env.example` beside it — and select them by tag.

### Transpiling

The components Toa ships run from their transpiled, git-ignored `operations` directories, because
Node does not erase types under `node_modules` and they are read from there once installed. An
application's own component is not transpiled — see the [Node bridge](./connectors/bridges.node/readme.md).
After changing anything under a component `source`, retranspile — or the run silently uses the
previous build:

```shell
$ npm run transpile                 # the workspace and every component
```

The same run writes the digest of the components the extensions ship into `definitions/digest`,
read by a deploy where the extensions are not installed (see [definitions](./definitions/readme.md)),
and then the types. A change to a shipped component's manifest is not seen by `toa deploy` until
the digest is regenerated.

An `operations` directory holds modules and nothing else: the bridge reads every file in it as one
and names the endpoint after the file, so a declaration or a test left there becomes an endpoint.
What building a component means is stated once, in `tsconfig.component.json`, which every
component's own configuration extends.

### Running

From the repository root:

```shell
$ npm run features                                  # root suite, then workspace suites
$ npx cucumber-js features/cli/call.feature         # one file in the root suite
$ npx cucumber-js --name 'Changing the password'    # one scenario in the root suite
```

From a workspace that has a `features` script (`extensions/exposition`, `extensions/realtime`):

```shell
$ npm run features                                  # all scenarios in that workspace
```

A single file or scenario needs the loader the `features` script carries:

```shell
$ TSX_TSCONFIG_PATH=features/steps/tsconfig.json NODE_OPTIONS=--import=tsx \
    npx cucumber-js features/identity.basic.feature
```

The exposition suite also runs over cleartext HTTP/2, booting the gateway and pointing the
agent at it on that protocol:

```shell
$ npm run features:h2c
```

A workspace's suite is run from that workspace, which is where its configuration and its
loader are:

```shell
$ npm run features -w @toa.io/extensions.exposition
```

`cucumber.mjs` states one profile — a configuration written as a module exports the profile
itself, not a map of them — and it sets `failFast`, so a run stops at the first failed scenario.

### What `npm run features` leaves out

Nothing to do here: `npm run features` is the command, and what it runs is what a change has to
pass. The rest of this is for information.

A scenario it leaves out says why by its tag: `@network` reaches a host on the internet,
`@containers` pulls an image and boots a broker or a database of its own, `@timing` waits out a
lifetime, a budget or an interval, `@helm` renders a chart with the binary of that name, `@cli`
runs the `toa` program as a program, `@deployment` writes what a deployment carries, `@manual`
needs a secret and skips where it is absent, and `@skip` is held back and runs nowhere. Write one
of these on a scenario only where it is true of it.

`npm run features:nightly` adds all of them back but `@manual` and `@skip`. Both sets are stated
once, in `cucumber.tags.mjs`; `TOA_FEATURES=nightly` selects between them.

## Tests

Types are checked across the repository by one configuration, `tsconfig.check.json`. It covers
every workspace's sources and the step definitions, and it excludes `*.test.ts`:

```shell
$ npm run typecheck
```

Style is checked by `npm run lint`, which reports nothing. Fix what it finds by hand:
`oxlint --fix` rewrites `if (a) { if (b) c } else d` into an `else` that binds to the inner
`if`, which no test of ours would have caught.

Unit tests run on `node:test`, through `tsx`:

```shell
$ npm run test:unit
$ node --import tsx --test 'runtime/core/test/**/*.test.js'
```

A suite that replaces a module needs `--experimental-test-module-mocks`, which `test:unit`
passes.

## Exports

A declaration carries `export` where it is written, and a barrel re-exports through
`export ... from`:

```javascript
function component(manifest) {}

export { component }
```

```javascript
export function component(manifest) {}
```

```javascript
import { Factory } from './factory.js'

export { Factory }
```

```javascript
export { Factory } from './factory.js'
```

An alias is the exception, because the exported name is the declaration: an operation module
states its type by the name it exports, as in `export { meter as computation }`.

## Userspace

Component code depends on no Toa package: nothing under `@toa.io/*` is imported by an operation,
an event, a receiver or a guard. A type is the exception, and only as `import type`, which is
erased before anything runs. A component may be written as an ES module or a CommonJS one; a
component that is a module says so in a `package.json` beside its manifest.

A module may be written in TypeScript. Node erases the types and compiles nothing else, so a `.ts`
runs with no build step and no loader — and what it cannot erase, it refuses. The rules that
follow from that are in the [Node bridge readme](./connectors/bridges.node/readme.md).

Everything a component needs is on `context`;
a configuration secret, for one, is read as `context.configuration.apiKey.unwrap()`.
A component sees none of the variables the runtime was deployed with: no `TOA_*` in its
`process.env`, in a bash operation's environment, or under `/proc`.

The components an extension ships are Toa's own, and may use its packages.

## Documentation

Documentation says **how to use** a thing, not how it works. What a reader needs is what to
declare, what to call, what they get back, and what they have to handle themselves. How it
arrives at that is not theirs to carry.

So a guarantee is written as what it means for the code someone writes — "a missed interval is
not made up, so select what is still due rather than everything in its share" — and not as the
mechanism it follows from. Names of what runs inside, the state it keeps, the queries it makes
and the reasoning behind a decision belong in the code, beside what they explain.

What survives the rule is what a reader acts on: a limit that changes what they write, a setting
they choose, a failure they will see and have to answer for.

## Publishing

npm packs by `.npmignore` where a package has one, and by `.gitignore` where it does not. Build
output is git-ignored — a component's `operations`, what a `ui` builds — so a package without
`.npmignore` publishes its manifests without the code beside them.

Every extension that transpiles components or builds a page carries one, and so does
`@toa.io/definitions`, whose digest is git-ignored build output. What a package would publish is
read before releasing it:

```shell
$ npm pack --dry-run                # from the package directory
```

### A package published for the first time

The workflow authenticates to npm with a trusted publisher — OIDC, no token — and a trusted
publisher is configured **per package, on a package that already exists**. A package npm has never
seen has nothing to configure, so the first publish of one fails the whole release:

```
lerna WARN notice Package failed to publish: @toa.io/extensions.cadence
lerna ERR! E404 Not found
```

Every package published before it is published by then, and the version bump does not reach `dev`,
because the step that forwards it runs only where publishing succeeded. So a new package is
published by hand, once, before it is ever part of a release:

1. Give it `publishConfig.access: public`. A scoped package is private by default, and npm answers
   the same `E404` for one it may not create.
2. Build what it ships — `npm run transpile -w <package>` — and read the tarball with
   `npm pack --dry-run`, because nothing else checks that a package can boot what it declares.
3. Publish it from the package directory, as yourself: `npm publish --access public --tag alpha`
   (npm refuses a prerelease without a tag, and `alpha` is the tag the release uses). Its version
   is whatever the release before it left in `package.json`; the release that follows bumps it
   with every other package.
4. On npmjs.com, open the package, then **Settings → Trusted publisher**, and name this
   repository, `.github/workflows/release.yaml`, and no environment.

From then on the workflow publishes it like any other. Do this while adding the package, not while
releasing: the release that discovers it has already published half the workspace and cannot be
re-run as it was.

**A failed publish takes the runtime image with it.** Everything after the publish step is skipped,
so the version bump does not reach `dev` and `ghcr.io/toa-io/runtime:<version>` is never built. The
packages are on npm and nothing says the release is incomplete until an application's deploy fails
on `FROM ghcr.io/toa-io/runtime:<version>: not found`. Finishing it is a dispatch of the same
workflow, which skips versioning, publishes whatever npm is missing, and builds the image:

```shell
$ gh workflow run release.yaml --ref alpha -f from-package=true -f dist-tag=alpha
```

The ref matters: the image is tagged with the version in `runtime/runtime/package.json` as that
tree has it.

### The version of Toa

`@toa.io/definitions` is versioned with every release (`forcePublish` in `lerna.json`), whether or
not anything in it changed: its version is what a context that states no `runtime.version` is
deployed on, and its digest is what the extensions ship at that version. The runtime depends on it,
so the two carry one number.

## Security

A default denies. What the runtime fetches, accepts or trusts is enumerated in configuration, and an
empty enumeration admits nothing. A capability that widens what is reachable is off until an
application turns it on.

## Exposition

The gateway does no I/O of its own on the request path: a request costs the call to its endpoint.
What authentication and authorization need is read from the token, or from a cache with a bounded
lifetime — a custom key once per `identity.tokens.cache.ttl`, a revocation once per
`identity.tokens.refresh`. A check that needs storage is written as an event that changes what a
token is decrypted with, or as a claim, never as a read per request.

Credentials travel in the `authorization` header. Toa does not support cookies and will not;
nothing reads or sets one.
