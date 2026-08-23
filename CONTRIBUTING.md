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
$ npx cucumber-js features/identity.basic.feature   # one file
$ npx cucumber-js --name 'Changing the password'    # one scenario
```

Root `cucumber.js` also defines profiles. A profile that sets `paths` makes Cucumber append
command-line paths instead of replacing them — passing a file there runs the whole suite as well.
Select by name instead:

```shell
$ npx cucumber-js -p exposition
$ npx cucumber-js -p exposition --name 'Changing the password'
```

Profiles set `failFast`, so a run stops at the first failed scenario.

## Tests

`integration/` is obsolete. Do not add or change tests there. New coverage belongs in Cucumber features.
