# Chronicles

## Design concept

A context gains a log of what happened in it, kept in a store the annotation names, which an
agent reads and builds views over through the gateway's MCP. Three things write to it: the
committed changes of the components that name them, as events of the context; facts an operation
states that change no state; and what browsers send. Toa provides one store, ClickHouse, behind
an interface a second one would implement.

Nothing in the path is new machinery. A component's changes reach the log as its events, which
the deployment marks consumed and the extension's service consumes, over the brokers the
context's `amqp` names — as any receiver does. A fact is a task to a component of the service. A
browser's batch is a request to another. The service is the one writer to the store.

### Guarantees

**What reaches the log**

1. A change of a component that names an event under `chronicles` is a row of the log as that
   event renders it: by the event's own `condition` and `payload`. What a receiver of the event
   would have been given is what the log is given, so a payload that leaves out a field keeps it
   out of the log.
2. A change is written once it is committed and the service has taken it, however long the
   service or the store is away: the event waits in the service's queue, and a delivery is
   acknowledged once the row it carried is written. A change committed before the service first
   ran in the deployment is not written, as it would be delivered to no receiver.
3. A row is written once however often it is delivered. Every row carries an `id` that is the
   same on every delivery — the event's, a fresh one per `send`, the client's own — and the store
   keeps one row per `id`.
4. `context.chronicles.send` resolves once the broker has the fact, which waits for the service as
   an event does.

**What reads it**

5. A query runs as a user that can do nothing but read the log, under limits it cannot lift.
6. A view is defined only by a statement a query could run, checked as the reader before it is
   made.
7. Reading requires `system:chronicles:query`, and defining or dropping a view requires
   `system:chronicles:views`. `system:chronicles` grants both.

**Off until turned on**

8. Without a `chronicles` annotation nothing is consumed and nothing is provisioned, and a
   manifest that declares `chronicles` fails the deploy.
9. The client route exists only where the annotation says `ingest: true`.

**Not promised**

10. No order. `time` and `version` order what a query has to order; delivery does not.
11. No identity on what a browser sends: the route is anonymous, so a `user` in a payload is a
    claim, not a fact.
12. No tenancy within one context: one log, read whole by whoever holds the role.
13. No erasure. What must be erasable is kept out of the payload.
14. No portable dialect. A query is written in the store's own, which `describe` names.

### What a component author does differently

Nothing, unless a component's changes belong in the log — and then it names the events that carry
them:

```yaml
# components/store.orders/manifest.toa.yaml
chronicles:
  events: [created, paid] # what happened: rows of `events`
  state: snapshot # the entity as it stands: its row of `states`
```

Each label is one of the component's events, its own or the prototype's; a list is the `events`
alone. The state is whichever event's payload is the entity — `sync` is one, and nothing makes it
special. An event that exists only for the log is an event file like any other, consumed by
nothing else:

```typescript
// components/store.orders/events/snapshot.ts
import type { Event } from '../types/index.d.ts'

// every change, as the entity without what identifies the customer
export function payload(event: Event) {
  const { email, address, ...rest } = event.state

  return rest
}
```

What is said of the entity — which one, its version, when it changed — is read from the payload's
`id`, `VERSION` and `UPDATED`. A state's payload must carry `id` and `VERSION`: one that does not is
refused with `EntityContractException`, which is permanent, so its consumer parks it on the first
delivery. A row of `events` is written without them where its payload leaves them out.

A fact that changes no state is sent:

```typescript
export async function computation(input: SearchInput, context: Context) {
  const results = await search(input.query)

  await context.chronicles.send('searched', {
    query: input.query,
    results: results.length
  })

  return results
}
```

`context.chronicles` is given to a component that declares `chronicles`, which a component that
only sends declares empty: `chronicles: []`.

And for a deployment, one annotation:

```yaml
# context.toa.yaml
chronicles:
  store:
    provider: clickhouse
    url: https://ch.example.com:8443/shop # the path names the database
  retention: 730 # days a row is kept; absent, kept
  ingest: true # the client route; absent, off
```

```shell
$ toa conceal chronicles-store username=writer password=... reader=...
```

`reader` is the password provisioning gives the reader it creates.

## The log

### A row

|             |                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------- |
| `id`        | the event's id; a fresh one per `send`; the client's own                                     |
| `label`     | `<component>.<event>`, `<component>.<name>` for a `send`, `client.<name>` for a browser      |
| `component` | the component it is of; `chronicles.ingestion` for a browser                                 |
| `time`      | milliseconds: the payload's `UPDATED`, or when the service took it; the call's; the client's |
| `entity`    | the payload's `id`; `null` for the other two                                                 |
| `version`   | the payload's `VERSION`; `null` for the other two                                            |
| `trace`     | the W3C traceparent of the call that caused it, where there was one                          |
| `payload`   | what the event rendered, what was sent                                                       |

Two tables: `events`, a row for everything that happened, and `states`, each entity of a
component that names a state, by `(component, entity)`, a higher `version` replacing a lower.

### The provider

```ts
interface Provider {
  readonly dialect: string
  readonly tables: string[]
  provision(): Promise<void>
  write(rows: Row[]): Promise<void>
  labels(): Promise<Label[]>
  query(sql: string): Promise<Result>
  validate(sql: string): Promise<void>
  views(): Promise<View[]>
  define(name: string, sql: string, refresh?: number): Promise<void>
  drop(name: string): Promise<void>
}
```

What a provider refuses — a statement, a view — it throws as a `Refusal` in its own words, which
the query component answers as `REFUSED`.

### ClickHouse

Provisioned as the service starts, every statement `IF NOT EXISTS`, so a second start changes
nothing and two replicas starting together collide on nothing; the retention is compared with what
the table states and changed only where it differs.

```sql
CREATE TABLE events (
  id String, label LowCardinality(String), component LowCardinality(String),
  time DateTime64(3, 'UTC'), received DateTime64(3, 'UTC') DEFAULT now64(3),
  entity Nullable(String), version Nullable(UInt64), trace Nullable(String), payload JSON
) ENGINE = ReplacingMergeTree PARTITION BY toYYYYMM(time) ORDER BY (label, toDate(time), id)
  [TTL toDateTime(time) + INTERVAL <retention> DAY]

CREATE TABLE states (
  component LowCardinality(String), entity String, version UInt64,
  time DateTime64(3, 'UTC'), received DateTime64(3, 'UTC') DEFAULT now64(3), payload JSON
) ENGINE = ReplacingMergeTree(version) ORDER BY (component, entity)

CREATE SETTINGS PROFILE <database>_reader SETTINGS readonly = 2 CONST,
  max_execution_time = 30 CONST, max_result_rows = 10000 CONST, result_overflow_mode = 'break' CONST
CREATE USER <database>_reader IDENTIFIED BY '<reader>' SETTINGS PROFILE '<database>_reader'
GRANT SELECT ON <database>.* TO <database>_reader
```

Both tables are replaced by key in the background, so a query reads them with `FINAL`; the dialect
`describe` answers says so. Rows are written in batches of what arrives within half a second, or
of a thousand, as `JSONEachRow`. A view is `SQL SECURITY INVOKER`; one with `refresh` is a
refreshable materialized view.

### Over MCP

`chronicles.queries` is served by the service, and its routes are tools where the context publishes
MCP:

| route                                    | tool                                    | operation  | role                      |
| ---------------------------------------- | --------------------------------------- | ---------- | ------------------------- |
| `GET /chronicles/queries/`               | `chronicles.queries.GET`                | `describe` | `system:chronicles:query` |
| `POST /chronicles/queries/`              | `chronicles.queries.POST`               | `query`    | `system:chronicles:query` |
| `PUT /chronicles/queries/views/:name`    | `chronicles.queries.views._name.PUT`    | `define`   | `system:chronicles:views` |
| `DELETE /chronicles/queries/views/:name` | `chronicles.queries.views._name.DELETE` | `drop`     | `system:chronicles:views` |

- `describe` answers the dialect, the labels with their counts, first and last `time` and the
  fields of their latest payloads, the components with a state with how many entities each has and
  the fields of the state, and the views with their definitions.
- `query` takes `{ sql }`, one statement, and answers `{ columns, rows, truncated }`, with
  `201 Created` as every `POST` with an output is answered.
- `define` takes `{ sql, refresh? }`, `refresh` in seconds and no less than 3600. A name is
  `^[a-z][a-z0-9_]{0,62}$` and none of the provider's tables; a context has at most 50.

### From a browser

```http
POST /chronicles/ingestion/ HTTP/1.1
content-type: application/json

[{ "id": "0192…", "name": "page.viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }]
```

```http
202 Accepted

accepted: 1
```

At most 100 events, each at most 16 KiB of JSON; `id` at most 64 characters; `name` dotted
lowercase segments; a batch that breaks any of it is refused whole, `INVALID` or `OVERSIZED`, with
the index of the event in `cause`. `text/plain` is read as JSON too, so `navigator.sendBeacon` can
send it. The route is anonymous and throttled by address, 60 requests a minute.

## The changes, by area

### 1. Definitions

`definitions/source/extensions.chronicles`, registered in `DEFINED` and `DIGESTED`, with the
`chronicles` shortcut for a context and for a manifest:

- `manifest(declaration, manifest)`: an array of labels, each an event of the component; `null`
  is `[]`.
- `deployment(instances, annotation)`: validates the annotation; the declared events, as consumed;
  the service `chronicles-scribe`, with `chronicles-facts`, `chronicles-queries`, and
  `chronicles-ingestion` where `ingest` is true, given `TOA_CHRONICLES` — the store, the
  retention, `ingest`, the events and the states — and the store's credentials, which nothing else
  is given.
- `components()`: the digest. `standalone = true`, so an annotation with no component that declares
  `chronicles` still deploys the service.
- `context()`: the type of `context.chronicles`.

### 2. `extensions/chronicles`

- `Scribe`, the service: provisions the provider, consumes every declared event with
  `host.receive` in the group `chronicles.scribe`, and composes the components it ships.
- `Recorder`, one per event: a message is a row, written through the `Writer`, which batches and
  answers each delivery once its batch is written.
- `Sender`, `context.chronicles.send`: a task to `chronicles.facts`.
- `Facts`, `Client` and `Reader`: what `chronicles.facts`, `chronicles.ingestion` and
  `chronicles.queries` are given.
- `Provider` and `clickhouse/`, its one implementation, over `fetch`: no SDK.
- A `chronicles` shortcut in the Node bridge puts `context.chronicles.send` on an operation's
  context.

### 3. Core

`extensions.Host.receive` is typed with the `group` the runtime already takes, which is what makes
one queue the replicas of the service share and that holds what arrives while none is there.

### 4. The dev stack

`clickhouse/clickhouse-server:26.8.34.13` on `31030` (HTTP) and `31031` (native), user `developer`
with access management, and the ports in the table in CONTRIBUTING.

### 5. Documentation

`extensions/chronicles/readme.md`; and, in [toa-io/docs](https://github.com/toa-io/docs), an
article in `userspace/platform`.

## Decisions

1. **Events, not a channel of its own.** A destination publishing to a channel of the extension's
   own would need a broker of its own beside the context's `amqp`, which names brokers per
   namespace and per component. A component's events already travel where `amqp` says, and the
   extension consumes them as any receiver does.
2. **The service is the consumer.** A store that consumes the broker itself — ClickHouse's
   RabbitMQ engine — would tie the transport to the provider. The service writes to any provider
   through one interface, and what it cannot write is delivered again as any receiver's is.
3. **Provisioning at the service's start.** There is no deploy-time job in the chart, and the
   statements are idempotent, which a lock would only serialise.
4. **Two users of the store.** The writer provisions and defines views; the reader queries, under
   limits that are its profile's, not settings a request passes.
5. **Roles, not identity.** The gateway gives an operation no identity, so the query component
   cannot scope a query to a caller; what it can do is refuse a caller without the role.
6. **A `send` is a task.** It travels as calls do and waits for the service as an event does; a
   fact needs no state of the sender's.
7. **The entity from the payload.** A message carries what the event rendered, not the entity, so
   the entity's id, version and time are the payload's to carry.
8. **A state is declared, not derived.** Every event that carries an `id` could feed `states`, and
   would make it the latest payload of whichever events a component names — of no single meaning.
   One event names the state, and nothing else writes it.

## Context

- [`documentation/outbox.md`](/documentation/outbox.md): at-least-once, no order.
- The configuration extension consumes an event of the context with `host.receive`, and its
  deployment marks it consumed, the same way.

## What happens today

Nothing writes a log of a context. An application that wants one consumes events with receivers of
its own and writes them somewhere.

## Stages

1. This discussion and the documentation, as a draft pull request.
2. Definitions: the annotation, the manifest, the deployment.
3. ClickHouse in the dev stack; the provider.
4. The scribe consuming events; facts; the client route.
5. `chronicles.queries`, over MCP.
6. The published documentation.

## Verification

- A change of a component that declares `created` is in `events` once, under
  `chronicled.orders.created`, with its entity and version, and its state in `states`.
- A state whose payload carries no `id` is refused, and holds up no other event.
- A change committed while the service is stopped is in `events` once it is started again.
- A label that is not an event of the component fails the deploy.
- A manifest that declares `chronicles` in a context without the annotation fails the deploy.
- `send` is in `events` with `entity` `null`.
- `POST /chronicles/ingestion/` is `202` with `ingest`, and its events are under `client.`.
- `chronicles.queries.POST` answers rows to the role, `403` without it, and `REFUSED` for an
  `INSERT` and for a `SETTINGS max_execution_time` above the limit.
- A view defined over `system.users` is refused; one over `events` is read by `query`.

## Compatibility

New throughout. `extensions.Host.receive` gains an overload the runtime already served.

## References

- [ReplacingMergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/replacingmergetree)
- [Refreshable materialized views](https://clickhouse.com/docs/materialized-view/refreshable-materialized-view)
- [Settings constraints](https://clickhouse.com/docs/operations/settings/constraints-on-settings)
