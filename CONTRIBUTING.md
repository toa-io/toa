# Contributing

## Making a Change

The goal of the process is to help teams produce _simple[^1] non-broken[^2] software_ in a fast and
predictable way.

1. **Discussion.** A [discussion](./discussions/readme.md) analyses what is asked for and the
   current state of the system, and decides how the change is made in concept.
2. **Documentation.** How to use what the discussion designs is written in
   [`documentation`](./documentation) and the readmes of the packages it changes. The discussion
   and the documentation are opened as a draft pull request into `dev`. See
   [Documentation](#documentation).
3. **Scenarios.** A change is made by [TDD](https://en.wikipedia.org/wiki/Test-driven_development),
   with feature scenarios as its tests. **The scenarios are written before the code, and each fails
   for the reason expected.**
4. **Change.** The code does what the draft documents, made in [units of work](#unit-of-work). See
   [Constraints](#constraints).
5. **Test.** The scenarios written before the change pass, and so does `npm run features`. See
   [Tests](#tests) and [Running Features](#running-features).
6. **Pull request.** The draft is marked ready for review.

[^1]: Meeting common sense expectations.

[^2]: Meeting the requirements.

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

A change that touches an undocumented area writes that area first, as it stands, and the change
after it.

## Unit of Work

A unit of work is one completed iteration of the
[TDD cycle](https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html):

1. If your tests are failing, you must write code.
2. If your tests are passing, you must write a test, unless you're refactoring or done.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/). The subject line must be able to complete the following sentence:

> If applied, this commit will <<your subject line here>>

## Tests

**A unit test proves that the code matches your expectations. An integration test proves that
your expectations match reality.** Code is *working* once an integration test has run it; until
then it is a *hypothesis*. Toa's integration tests are its feature scenarios, run against the
broker, the database and the network the code relies on.

**"Not mine" is never an answer.** A suite run during a change has to pass, whether or not the
change is what broke it. A failure that was already there is still a failure that is there now,
and the run that found it is the one that owns it — leaving it for the next person means leaving
them a suite that cannot tell them anything, because they will read the same failure the same way
and pass it on again.

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
| `31013` | RabbitMQ, the `eu` convergence broker         | —              |
| `31014` | its management                                | —              |
| `31015` | RabbitMQ, the `us` convergence broker         | —              |
| `31016` | its management                                | —              |
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
| `31090` | the benchmark gateway of the base revision    | —              |
| `31091` | the benchmark gateway of the head revision    | —              |
| `31092` | its readiness probe, base                     | —              |
| `31093` | its readiness probe, head                     | —              |
| `31094` | readiness of the benchmark `bench`, base      | —              |
| `31095` | readiness of the benchmark `peer`, base       | —              |
| `31096` | readiness of the benchmark `bench`, head      | —              |
| `31097` | readiness of the benchmark `peer`, head       | —              |
| `31098` | readiness inside the benchmark gateway, base  | —              |
| `31099` | readiness inside the benchmark gateway, head  | —              |

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
$ npx cucumber-js features/bridges/bash.feature     # one file in the root suite
$ npx cucumber-js --name 'Calling bash operation'   # one scenario in the root suite
```

A file or a name selects only what the run's tags admit, so a scenario that
[`npm run features` leaves out](#what-npm-run-features-leaves-out) is selected with the nightly
set:

```shell
$ TOA_FEATURES=nightly npx cucumber-js features/cli/call.feature
```

From a workspace that has a `features` script (`extensions/configuration`,
`extensions/exposition`, `extensions/introspection`, `extensions/realtime`):

```shell
$ npm run features                                  # all scenarios in that workspace
```

A single file or scenario is run from the same workspace, with the loader its `features` script
carries:

```shell
$ cd extensions/exposition
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

## Performance

`npm run bench` compares the request path of two revisions on one machine: the CPU every process
spends per request, and the messages and database operations a request costs. `--profile` records
where a revision spends it. See [benchmarks](./benchmarks/readme.md).

## Publishing

A package that transpiles states what it ships in `files`: its build, the assets read beside it —
`components`, `schemas`, `digest`, `ui/dist` — and nothing else. Sources, suites, features and
`tsconfig.tsbuildinfo` are not published, because an image that runs the package carries whatever
it publishes, and `extensions.storages` alone was shipping eight megabytes of sample video.

`files` is an allowlist, so build output being git-ignored no longer keeps it out of the tarball,
and a new directory a package needs at runtime is published only once it is named there. What a
package would publish is read before releasing it:

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

## Constraints

- **Secure by default.** What the runtime fetches, accepts or trusts is enumerated in
  configuration, and an empty enumeration admits nothing. A capability that widens what is
  reachable is off until an application turns it on.
- **Zero per-request I/O.** The gateway does no I/O to serve a request, other than an
  operation call.
- **Independent userspace.** An application's component depends on no `@toa.io/*` package, other
  than types imported with `import type`.
- **Coded exceptions.** Startup code — a boot, a manifest being read, a deploy — may assert.
  Runtime code throws a coded exception from `@toa.io/core`.
