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

The deployment scenarios render a chart, so `helm` has to be on the `PATH`; without it the
command produces nothing and the scenario reads an empty `stdout`.

The Cloudinary scenarios upload to a real account, which no compose file can stand up. They are
skipped unless `features/steps/.env` names one — see `.env.example` beside it.

### Transpiling

Components run from their transpiled, git-ignored `operations` directories. After changing anything
under a component `source`, retranspile — or the run silently uses the previous build:

```shell
$ npm run transpile                 # the workspace and every component
```

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

## Tests

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
function component (manifest) { }

export { component }
```

```javascript
export function component (manifest) { }
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
an event, a receiver or a guard. A component may be written as an ES module or a CommonJS one; a
component that is a module says so in a `package.json` beside its manifest.

Everything a component needs is on `context`;
a configuration secret, for one, is read as `context.configuration.apiKey.unwrap()`.

The components an extension ships are Toa's own, and may use its packages.

## Publishing

npm packs by `.npmignore` where a package has one, and by `.gitignore` where it does not. Build
output is git-ignored — a component's `operations`, what a `ui` builds — so a package without
`.npmignore` publishes its manifests without the code beside them.

Every extension that transpiles components or builds a page carries one. What a package would
publish is read before releasing it:

```shell
$ npm pack --dry-run                # from the package directory
```

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
