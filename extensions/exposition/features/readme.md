# Features

Cucumber scenarios for the Exposition extension. Each scenario boots a gateway and a composition
of the identity components in the test process, so the runtime needs the same infrastructure a
deployed application does.

## Prerequisites

Start the services the runtime connects to, from the repository root:

```shell
$ npm run setup:mongo               # once, generates the replica set keyfile
$ docker compose up -d mongodb rabbitmq redis0 redis1 redis2
```

| Service  | Address                                    | Used for                        |
|----------|--------------------------------------------|---------------------------------|
| RabbitMQ | `localhost:5672`, `developer` / `secret`    | component discovery and calls   |
| MongoDB  | `localhost:27017`, `developer` / `secret`   | component storage, db `toa-dev` |
| Redis    | `localhost:6379`, `6378`, `6377`            | state and cache connectors      |

Without RabbitMQ the lookup never resolves: the runtime logs `Waiting for lookup response` and the
first step fails on the 60 second Cucumber timeout. Without Redis the step fails with
`Connection is closed`.

Then create the secrets file:

```shell
$ cp features/steps/.env.example features/steps/.env
```

## Transpiling

The gateway runs from `source`, but the identity components run from their transpiled, git-ignored
`operations` directories. After changing anything under `components/*/source`, retranspile — or the
run silently uses the previous build:

```shell
$ npm run transpile:federation      # one component
$ npm run transpile                 # the workspace and every component
```

A stale build does not fail fast. An operation missing from `operations` fails manifest validation
(for a new one — `/operations/<name> must have required property 'concurrency'`, since the
operation type is inferred from the transpiled module), the identity composition never comes up,
and every scenario hangs with `Waiting for lookup response` warnings until the Cucumber timeout.

## Running

From this workspace (`extensions/exposition`):

```shell
$ npm run features                                  # all scenarios
$ npx cucumber-js features/identity.basic.feature   # one file
$ npx cucumber-js --name 'Changing the password'    # one scenario
```

From the repository root the `exposition` profile carries its own `paths`, and Cucumber appends the
command line paths to them instead of replacing them — passing a file there runs the whole suite as
well. Select by name instead:

```shell
$ npx cucumber-js -p exposition
$ npx cucumber-js -p exposition --name 'Changing the password'
```

The profile sets `failFast`, so a run stops at the first failed scenario.

## Notes

- Scenarios read and write the `toa-dev` database and truncate the collections they declare, so an
  application sharing the MongoDB instance keeps its own database untouched.
- No feature run is covered by CI — CI runs `eslint` and the unit tests only.
