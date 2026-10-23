# Chronicles

## Design concept

A context gains a log of what happened in it, kept in ClickHouse, which an agent reads and builds
views over through the gateway's MCP. Three things write to it: the committed state changes of the
components that declare them, facts an operation states that change no state, and what browsers
send. Toa owns the whole path, from the commit to the table, so an application declares and
annotates; it runs no pipeline of its own.

The path is the one [convergence](./convergence.md#the-binding) laid down for a destination that
ships changes elsewhere: the outbox renders a row, `outbound` publishes it to a channel of its own,
and the broker holds it until the other side takes it. The other side is ClickHouse's RabbitMQ
engine, which consumes a queue Toa declares. Nothing between the two is the application's to run.

### Guarantees

**What reaches the log**

1. A state change of a component that names an event under `chronicles` is written to the log as
   that event renders it: by the event's own `condition` and `payload`. What a receiver of the
   event would have been given is what the log is given, so a payload that leaves out a field
   keeps it out of the log too.
2. A state change reaches the log once it is committed, whether or not the broker or ClickHouse is
   up at the time: the row is the outbox's, which publishes it until the broker confirms it.
3. A message ClickHouse fails to write is kept on the broker, in `chronicles.dead`, rather than
   dropped. ClickHouse rejects a batch it could not write; the queue it consumes dead-letters what
   it rejects.
4. A message is written at least once. Every one carries an `id` that is the same however many
   times it is delivered — the event's derived id, a fresh one per `send`, the client's own for
   what a browser sends — and `events` keeps one row per `id`, which a query reads with `FINAL`.
5. `context.chronicles.send` resolves once the broker has confirmed the message, and rejects
   where it has not. Nothing retries it: an operation that must not lose a fact states it as a
   state change.

**What reads it**

6. A query runs as a user that can do nothing but read the context's database, under limits it
   cannot lift: `readonly`, `max_execution_time` and `max_result_rows` are constraints of its
   profile, so a `SETTINGS` clause that raises one is refused.
7. A view is defined only by a `SELECT` the reader may run. It is checked as the reader before it
   is created, so a view cannot read what a query cannot.
8. Reading requires `system:chronicles:query`, and defining or dropping a view requires
   `system:chronicles:views`. `system:chronicles` grants both.

**Off until turned on**

9. Without a `chronicles` annotation nothing is published, nothing is provisioned, and a manifest
   that declares `chronicles` fails the deploy.
10. The client route exists only where the annotation says `ingest: true`.

**Not promised**

11. No order. `time` and `version` order what a query has to order; delivery does not.
12. No identity on what a browser sends: the route is anonymous, so a `user` in a payload is a
    claim, not a fact.
13. No tenancy within one context: one database, read whole by whoever holds the role.
14. No erasure. ClickHouse deletes are not a tool for removing a person; what must be erasable is
    kept out of the payload.
15. No automatic redrive of `chronicles.dead`. It is an operator's to move back, once whatever
    ClickHouse refused is fixed.
16. No sharded broker: the log is one queue on one broker.

### What a component author does differently

Nothing, unless a component's changes belong in the log — and then it names the events that carry
them:

```yaml
# components/store.orders/manifest.toa.yaml
chronicles: [created, paid, snapshot]
```

Each label is one of the component's events, its own or the prototype's. An event that exists
only for the log is an event file like any other, consumed by nobody:

```typescript
// components/store.orders/events/snapshot.ts
import type { Event } from '../types/index.d.ts'

// every change, as the record without what identifies the customer
export function payload(event: Event) {
  const { email, address, ...rest } = event.state

  return rest
}
```

The prototype's `sync` is the record as it stands, unfiltered.

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
  broker: amqp://rabbitmq.example.com # where components publish; ClickHouse consumes from it
  clickhouse: https://ch.example.com:8443/shop # the path names the database
  retention: 730 # days a row is kept; absent, kept
  ingest: true # the client route; absent, off
```

```shell
$ toa conceal chronicles-broker username=chronicles password=...
$ toa conceal chronicles-clickhouse username=writer password=... reader=...
```

`reader` is the password provisioning gives the reader it creates, `<database>_reader`. Where
ClickHouse reaches the broker at another address than the components do, `clickhouse` is an object:

```yaml
chronicles:
  broker: amqp://localhost:5672
  clickhouse:
    url: http://localhost:8123/shop
    broker: amqp://rabbitmq:5672 # as ClickHouse sees it
```

## The log

### On the wire

What every source publishes, and what ClickHouse parses. One routing key, `events`, on the
channel's `chronicles.out`; the label is in the body.

```json
{
  "id": "5f0c…",
  "label": "store.orders.created",
  "component": "store.orders",
  "time": 1761200000000,
  "entity": "0192f3…",
  "version": 3,
  "trace": "00-4bf9…-00f0…-01",
  "payload": { "total": 120 }
}
```

|             |                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------- |
| `id`        | the event's derived id; a fresh one per `send`; the client's own                              |
| `label`     | `<component>.<event>`, `<component>.<name>` for a `send`, `client.<name>` for a browser       |
| `component` | the component that published it; `chronicles.ingest` for a browser                            |
| `time`      | milliseconds: the row's own for a change, the call's for a `send`, the client's for a browser |
| `entity`    | the id of the record that changed; `null` for the other two                                   |
| `version`   | its `VERSION`; `null` for the other two                                                       |
| `trace`     | the W3C traceparent of the call that caused it, where there was one                           |
| `payload`   | what the event rendered, what was sent                                                        |

### On the broker

Declared by the binding wherever it publishes to the channel, and by the service when it starts,
the same way each time:

| name              | kind             | bound to                        | arguments                                      |
| ----------------- | ---------------- | ------------------------------- | ---------------------------------------------- |
| `chronicles.out`  | exchange, direct |                                 |                                                |
| `chronicles`      | queue, durable   | `chronicles.out` under `events` | dead-lettered to `chronicles.out` under `dead` |
| `chronicles.dead` | queue, durable   | `chronicles.out` under `dead`   |                                                |

What ClickHouse rejects goes back to the channel's own exchange under another key, so the binding
names nothing of the broker's for the extension to know.

The queue is Toa's rather than ClickHouse's. `outbound` publishes with `mandatory`, so a message
routed to no queue comes back — and its row is marked published all the same, because the broker
confirmed it. A queue that exists from the first publication on is the only way nothing is lost
before ClickHouse is first provisioned.

### In ClickHouse

Provisioned by the service as it starts, every statement `IF NOT EXISTS` or `OR REPLACE`, so a
second start changes nothing and two replicas starting together collide on nothing.

```sql
-- the broker, its credentials masked in SHOW CREATE
CREATE NAMED COLLECTION chronicles_<database> AS
  rabbitmq_address = 'amqp://…', rabbitmq_exchange_name = 'chronicles.out',
  rabbitmq_exchange_type = 'direct', rabbitmq_format = 'JSONAsString',
  rabbitmq_queue_consume = 1, rabbitmq_queue_base = 'chronicles',
  rabbitmq_handle_error_mode = 'stream'

CREATE TABLE queue (message String) ENGINE = RabbitMQ(chronicles_<database>)

CREATE TABLE events (
  id String, label LowCardinality(String), component LowCardinality(String),
  time DateTime64(3, 'UTC'), received DateTime64(3, 'UTC') DEFAULT now64(3),
  entity Nullable(String), version Nullable(UInt64), trace Nullable(String), payload JSON
) ENGINE = ReplacingMergeTree PARTITION BY toYYYYMM(time) ORDER BY (label, toDate(time), id)
  [TTL toDateTime(time) + INTERVAL <retention> DAY]

-- the latest payload of each record under each label: `snapshot` is the record as it stands
CREATE TABLE states (
  label LowCardinality(String), component LowCardinality(String), entity String,
  version UInt64, time DateTime64(3, 'UTC'), payload JSON
) ENGINE = ReplacingMergeTree(version) ORDER BY (label, entity)

-- what was not JSON, kept rather than rejected
CREATE TABLE refused (received DateTime64(3, 'UTC') DEFAULT now64(3), message String)
  ENGINE = MergeTree ORDER BY received

CREATE MATERIALIZED VIEW ingest TO events AS SELECT … FROM queue WHERE _error IS NULL
CREATE MATERIALIZED VIEW current TO states AS SELECT … FROM events WHERE entity IS NOT NULL
CREATE MATERIALIZED VIEW refuse TO refused AS SELECT _raw_message AS message FROM queue
  WHERE _error IS NOT NULL

CREATE SETTINGS PROFILE <database>_reader SETTINGS readonly = 2 CONST,
  max_execution_time = 30 CONST, max_result_rows = 10000 CONST, result_overflow_mode = 'break' CONST
CREATE USER <database>_reader IDENTIFIED BY '<reader>' SETTINGS PROFILE '<database>_reader'
GRANT SELECT ON <database>.* TO <database>_reader
```

`_error` is `NULL` for a message that parsed. A message that did not would otherwise fail its whole
batch, which ClickHouse rejects, and which the queue would dead-letter whole.

### Over MCP

`chronicles.query` is served by the extension's service, and its routes are tools where the
context publishes MCP:

| route                                  | tool                                  | operation  | role                      |
| -------------------------------------- | ------------------------------------- | ---------- | ------------------------- |
| `GET /chronicles/query/`               | `chronicles.query.GET`                | `describe` | `system:chronicles:query` |
| `POST /chronicles/query/`              | `chronicles.query.POST`               | `query`    | `system:chronicles:query` |
| `PUT /chronicles/query/views/:name`    | `chronicles.query.views._name.PUT`    | `define`   | `system:chronicles:views` |
| `DELETE /chronicles/query/views/:name` | `chronicles.query.views._name.DELETE` | `drop`     | `system:chronicles:views` |

- `describe` answers the labels with their counts and first and last `time`, the paths of their
  latest payloads (`JSONAllPaths`), and the views with their definitions.
- `query` takes `{ sql }`, one statement, and answers `{ columns, rows, truncated }`, with
  `201 Created` as every `POST` with an output is answered.
- `define` takes `{ sql, refresh? }`. Without `refresh` it is a view, `SQL SECURITY INVOKER`, read
  with the reader's rights; with `refresh`, in seconds and no less than 3600, a refreshable
  materialized view. A name is `^[a-z][a-z0-9_]{0,62}$` and none of the tables above; a context
  has at most 50.

### From a browser

```http
POST /chronicles/ingest/ HTTP/1.1
content-type: application/json

[{ "id": "0192…", "name": "page.viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }]
```

```http
202 Accepted

accepted: 1
```

At most 100 events, each at most 16 KiB of JSON; `id` at most 64 characters; `name` dotted
lowercase segments; a batch that breaks any of it is refused whole, `INVALID` or `OVERSIZED`, with
the index of the event in `cause`. `text/plain` is read as JSON too, so `navigator.sendBeacon` can send it. The
route is anonymous and throttled by address, 60 requests a minute, which needs
[`exposition.ip`](/extensions/exposition/documentation/ip.md) to mean anything.

## The changes, by area

### 1. `comq`: a queue declared and not consumed

`IO.retain(exchange, queue, key, args?)` asserts the direct `exchange`, the durable `queue` with
the queue arguments `args`, and the binding under `key`, on every shard, and consumes nothing. `subscribe`
does the first three and then consumes; this is the half of it a producer needs to guarantee the
queue it publishes to. Released before anything below.

### 2. `bindings.amqp`: an outbound that retains

`Outbound.retain(queue, label, dead?)` calls `comm.retain` with the channel's `out` exchange and
the scoped `queue`; with `dead`, the queue dead-letters to the same exchange under that label. `bindings.Outbound` in `runtime/core/source/types/bindings.ts` gains it,
optional. `bindings.amqp` takes the released `comq`.

### 3. Definitions

`definitions/source/extensions.chronicles`, registered in `DEFINED` and `DIGESTED`, with the
`chronicles` shortcut in `runtime/norm/src/shortcuts.js`:

- `manifest(declaration, manifest)`: an array of labels, each an event of the component; `null`
  is `[]`.
- `deployment(instances, annotation)`: validates the annotation; `TOA_CHRONICLES` (the annotation,
  normalised, as JSON) and the broker pointer to every composition; the service `chronicles-scribe`, with
  `chronicles-query`, `chronicles-ingest` where `ingest` is true, and the ClickHouse credentials,
  which nothing else is given.
- `components()`: the digest. `standalone = true`, so an annotation with no component that declares
  `chronicles` still deploys the service.
- `context()`: the type of `context.chronicles`.
- Schemas: `definitions/schemas/extensions.chronicles/{annotation,declaration}.cos.yaml`.

### 4. `extensions/chronicles`

Shaped like `extensions/cadence`, with the destination of `extensions/convergence`:

- `Destination` renders each declared label for a row and sends what renders with
  `outbound.send('events', message)`, the messages of one row together. `open()` resolves the
  process's one outbound and retains both queues.
- `Sender` is `send(name, payload)`, over the same outbound. The ingest component is given a
  `Client` instead, which checks a batch and publishes it under `client.`; the query component, a
  `Reader` over ClickHouse.
- `Provisioning` runs the statements above, in order, before the service's composition starts.
  The consumer — the named collection, the engine table, the views that read it — is replaced only
  where its fingerprint, the comment on `queue`, says the broker changed.
- `ClickHouse` is an HTTP client over `fetch` — no SDK — that asks for JSON by `default_format`,
  since `EXPLAIN` would take a `FORMAT` clause as its own, and sends `X-ClickHouse-User` and
  `X-ClickHouse-Key`.
- `components/chronicles.ingest` and `components/chronicles.query`, and a `chronicles` shortcut in
  the Node bridge, which puts `context.chronicles.send` on an operation's context.

### 5. The dev stack

`clickhouse/clickhouse-server:26.8.34.13` on `31030` (HTTP) and `31031` (native), user `developer`
with access management and named collection control, and the ports in the table in CONTRIBUTING.
It reaches RabbitMQ as `rabbitmq:5672` over the compose network.

### 6. Documentation

`extensions/chronicles/readme.md`; a line in `documentation/outbox.md` naming chronicles among the
destinations; and, in [toa-io/docs](https://github.com/toa-io/docs), an article in
`userspace/platform`.

## Decisions

1. **The broker, not an insert.** The destination could insert into ClickHouse over HTTP with
   `async_insert` and skip the broker. It would put ClickHouse's latency and its outages on the pump
   of every replica of every component that declares chronicles, where the broker already holds what
   ClickHouse has not taken, and convergence already built the binding for it.
2. **One queue, one routing key.** A table per label, or per component, is what context `events:`
   would have needed: an exchange per label, and an envelope — `{payload, id, telemetry, trail}` —
   that does not say which label it is. One queue gives one engine table and one place to look.
3. **The queue is Toa's.** See [On the broker](#on-the-broker). It is also the only way to give it
   the dead-letter exchange: ClickHouse declares queues without arguments.
4. **Provisioning at the service's start.** There is no deploy-time job in the chart, and the
   statements are idempotent, which a lock would only serialise. A schema change will need versioned
   migrations; until the first one there is nothing to version.
5. **Two users.** The writer provisions and defines views; the reader queries. The limits are the
   reader's profile, not settings a request passes, because a request's settings are what the SQL
   can raise.
6. **Roles, not identity.** The gateway gives an operation no identity, so the query component
   cannot scope a query to a caller; what it can do is refuse a caller without the role.
7. **A `send` is not a change.** It goes straight to the broker. Taking it through the outbox would
   need a row, and a row needs a storage the caller may not have.

## Context

- [`convergence.md`](./convergence.md), _The binding_: `outbound` was made so that "an extension that
  ships changes to an analytics system takes the same `outbound`".
- [`documentation/outbox.md`](/documentation/outbox.md): destinations, at-least-once, no order.
- The realtime destination (`extensions/exposition/source/realtime/Destination.ts`) renders events
  by the component's bridges the same way.

## What happens today

Nothing writes a log of a context. An application that wants one consumes events with receivers of
its own and writes them somewhere, and loses what arrives while that somewhere is down.

## Stages

1. This discussion and the documentation, as a draft pull request.
2. `comq` `retain`, released; `bindings.amqp` `retain`.
3. Definitions: the annotation, the manifest, the deployment.
4. ClickHouse in the dev stack; the client; provisioning.
5. The destination, end to end.
6. The aspect and `chronicles.ingest`.
7. `chronicles.query`, over MCP.
8. The published documentation.

## Verification

- A change of a component that declares `created` is in `events` once, under
  `store.orders.created`, with its entity and version, after the outbox has published it twice.
- Changes committed while ClickHouse is stopped are in `events` once it is started.
- A label that is not an event of the component fails the deploy.
- A manifest that declares `chronicles` in a context without the annotation fails the deploy.
- A second start of the service changes no table.
- `send` is in `events` with `entity` `null`.
- `POST /chronicles/ingest/` is `404` without `ingest`, `202` with it, and its events are in
  `events` under `client.`.
- `chronicles.query.POST` answers rows to the role, `403` without it, and an error for an `INSERT`
  and for a `SETTINGS max_execution_time` above the limit.
- A view defined over `system.users` is refused; one over `events` is read by `query`.

## Compatibility

New throughout. `bindings.Outbound` gains an optional method, so a binding without it still
satisfies the type; chronicles refuses to start over one.

## References

- [ClickHouse RabbitMQ engine](https://clickhouse.com/docs/engines/table-engines/integrations/rabbitmq)
- [ReplacingMergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/replacingmergetree)
- [Refreshable materialized views](https://clickhouse.com/docs/materialized-view/refreshable-materialized-view)
- [Settings constraints](https://clickhouse.com/docs/operations/settings/constraints-on-settings)
- [RabbitMQ dead letter exchanges](https://www.rabbitmq.com/docs/dlx)
