# Toa Chronicles

A log of what happens in a context, kept in a store the context names. Components write to it by
the events they name and the facts they send, browsers by a route of the gateway, and it is read
by an [HTTP API](#reading-the-log) — which the gateway also publishes as [MCP](#over-mcp) tools.
The service `chronicles-scribe` writes the log, and is what the store is provisioned by and read
through.

## The log

Two tables.

**`events`** holds a row for everything that happened, from three sources:

| source                                           | `label`               | `entity`, `version`                      | `payload`              |
| ------------------------------------------------ | --------------------- | ---------------------------------------- | ---------------------- |
| an [event](#events-and-states) a component names | `<component>.<event>` | the entity that changed, and its version | what the event renders |
| a [fact](#facts) an operation sends              | `<component>.<name>`  | `NULL`                                   | what was sent          |
| an event a [browser](#from-a-browser) sends      | `agent.<name>`        | `NULL`                                   | what the browser sent  |

An order placed, a search made and a page left are three rows:

| `label`                 | `component`            | `entity` | `version` | `payload`                         |
| ----------------------- | ---------------------- | -------- | --------- | --------------------------------- |
| `store.orders.created`  | `store.orders`         | `9c1f…`  | `0`       | `{ total: 120, status: "new" }`   |
| `store.search.searched` | `store.search`         | `NULL`   | `NULL`    | `{ query: "teapot", results: 3 }` |
| `agent.page_left`       | `chronicles.ingestion` | `NULL`   | `NULL`    | `{ path: "/pricing" }`            |

Every row also has `id`, the same however often it is delivered, so a row is kept once;
`identity`, whose it is, where something [says so](#identity); `ip` and `country`, of the
browser that [sent it](#from-a-browser); `time`, when it happened; `received`, when the store wrote
it; and `trace`, the traceparent of the call that caused it.

**`states`** holds each entity as it stands: for every component that names a
[state](#events-and-states), a row per entity — `component`, `entity`, `version`, `identity`,
`time`, `received` and `payload` — which a higher version replaces.

Nothing is ordered: order by `time`, or by `version` within one entity.

## Events and states

```yaml
# manifest.toa.yaml
chronicles:
  events: [created, paid] # what happened: rows of `events`
  state: snapshot # the entity as it stands: its row of `states`
```

Each label is an event of the component — its own, or the prototype's `created`, `updated`,
`deleted` and `sync`. An event is written as it renders: where its `condition` does not hold,
nothing is written; where it has a `payload`, what the payload returns is what is written. A field
a payload leaves out does not reach the store. A list is the `events` alone:

```yaml
# manifest.toa.yaml
chronicles: [created, paid]
```

The state is any event whose payload is the entity, `sync` among them. An event that exists for
the log alone is an event file like any other, and nothing else has to consume it:

```typescript
// events/snapshot.ts
export function payload(event: Event) {
  const { email, address, ...rest } = event.state

  return rest
}
```

A state's payload carries `id` and `VERSION`, which say which entity it is and which version: one
that does not is refused, and kept in the parking queue of its consumer rather than written. A row
of `events` takes its `entity`, `version` and `time` from the payload's `id`, `VERSION` and
`UPDATED` where it carries them, and is written without them, at the time it was taken, where it
does not. An event that is both is named in both.

A committed change is written however long the scribe is away, and once however often it is
delivered. One committed before the scribe first ran in a deployment is not.

### Identity

`identity` is the payload's `identity`, where it is a string:

```yaml
# manifest.toa.yaml
chronicles:
  events: [created, paid]
  state: snapshot
  identity: customer # the property of the payloads that names whose a row is
```

A component names another property, or none with `identity: ~`. One property serves every event of
the component and its state, and a payload that leaves it out is a row of no identity. A property
the component names is one of its entity.

## Facts

```typescript
await context.chronicles.send('searched', { query: input.query, results: results.length })
```

The fact is a row of `events` under `<component>.searched`, with what was sent as its payload.
`send` resolves once the broker has it, and it then waits for the scribe as an event does.

An operation that knows whose the fact is says so; the extension does not know who called it:

```typescript
await context.chronicles.send(
  'searched',
  { query: input.query },
  { identity: input.customer }
)
```

`context.chronicles` is given to a component that declares `chronicles`. One that only sends
declares it empty:

```yaml
# manifest.toa.yaml
chronicles: []
```

## From a browser

Served where the context says `ingest: true`, at two routes: one of an identity, and one of no one.

### `POST /chronicles/ingestion/:identity/`

What a signed-in client sends, as the identity it is.

```http
POST /chronicles/ingestion/9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c/ HTTP/1.1
authorization: Token …
content-type: application/json

{ "events": [{ "id": "0192f3a1-…", "name": "page_viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }] }
```

```http
202 Accepted

accepted: 1
```

The token is the identity's, or the request is answered `403`: the rows are that identity's,
whatever the body says. Throttled to 60 requests a minute per identity.

### `POST /chronicles/ingestion/`

What anyone sends, before signing in or without it. The same body, and rows of no identity; a body
that names one is refused.

```http
POST /chronicles/ingestion/ HTTP/1.1
content-type: application/json

{ "events": [{ "id": "0192f3a2-…", "name": "page_left", "time": 1761200000000 }] }
```

It takes no credentials, and is throttled to 60 requests a minute per address. A form whose
`events` is their JSON is read as the JSON body, so `navigator.sendBeacon`, which sends no
`authorization`, can send a batch here as the page closes:

```javascript
navigator.sendBeacon(
  '/chronicles/ingestion/',
  new URLSearchParams({ events: JSON.stringify(events) })
)
```

A signed-in client sends with `fetch(…, { keepalive: true })` instead. Anyone can send anything: a
`user` in a payload is what the client said.

### The body

`{ events }`, at most 100 of them, each a row of `events` under `agent.<name>`:

| property  |                                                                     |
| --------- | ------------------------------------------------------------------- |
| `id`      | the client's own, at most 64 characters; a retry sends the same one |
| `name`    | lowercase letters, digits and underscores from a letter, at most 64 |
| `time`    | when it happened, in milliseconds, by the client's clock            |
| `payload` | an object, at most 16 KiB of JSON                                   |

A request is answered once its events are written. A batch one event of which breaks any of the
above is written not at all, and answered `422` with the code `INVALID`, or `OVERSIZED` for a
payload too large, and the `index` of the event in `cause`.

### Address and country

Every row a browser sent has the `ip` and the `country` of the request, as the gateway reads them
from the headers [`exposition.ip` and `exposition.country`](/extensions/exposition/documentation/ip.md)
name, and `NULL` where it has none; a body that names either is overwritten. An address is
personal data, and the log erases nothing, so of an address the log keeps its network — a `/24` of
IPv4, a `/48` of IPv6 — unless the annotation says `ip: full`.

## Reading the log

Reading takes the role `system:chronicles:query`, and views take `system:chronicles:views`;
`system:chronicles` grants both. A refusal is answered `422` with `{ code, cause }`.

### `GET /chronicles/queries/`

What the log holds: the dialect queries are written in, the labels of `events`, the components
with a state, and the views.

```http
GET /chronicles/queries/ HTTP/1.1
authorization: Token …
accept: application/yaml
```

```http
200 OK

dialect: ClickHouse SQL; read `events` and `states` with FINAL
labels:
  - label: store.orders.created
    rows: 1204
    first: 2026-10-01 08:12:03.000
    last: 2026-10-24 17:40:51.000
    paths: [VERSION, id, status, total]
states:
  - component: store.orders
    entities: 1180
    paths: [VERSION, id, status, total]
views:
  - name: daily
    sql: SELECT toDate(time) AS day, count() AS orders FROM events FINAL GROUP BY day
    refresh: 3600
```

`rows` counts what the store holds, a row delivered twice possibly twice; `paths` are the fields of
the latest payloads.

### `POST /chronicles/queries/`

One statement, in the dialect.

```http
POST /chronicles/queries/ HTTP/1.1
authorization: Token …
accept: application/yaml
content-type: application/yaml

sql: SELECT payload.status AS status, count() AS n FROM states FINAL GROUP BY status
```

```http
201 Created

columns:
  - name: status
    type: Dynamic
  - name: n
    type: UInt64
rows:
  - [new, 31]
  - [paid, 1149]
truncated: false
```

A query reads the log and nothing else, and cannot write. It runs for at most 30 seconds and
answers at most 10,000 rows: at the rows it answers what it has, with `truncated: true`. It leaves
`FORMAT` out.

| code      | when                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `REFUSED` | the store refused the statement; `cause.message` is what the store said |

### `PUT /chronicles/queries/views/:name`

A view over the log, by a statement a query could run. Defining a name again replaces the view.

```http
PUT /chronicles/queries/views/daily/ HTTP/1.1
authorization: Token …
content-type: application/yaml

sql: SELECT toDate(time) AS day, count() AS orders FROM events FINAL GROUP BY day
refresh: 3600
```

```http
204 No Content
```

Without `refresh`, a view is computed when it is read. With `refresh`, in seconds and at least
`3600`, it is computed on that cycle and read as a table. A name is lowercase letters, digits and
underscores, and a context has at most 50 views. A query reads a view by its name.

| code        | when                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `REFUSED`   | the statement is not one a query could run; `cause.message` says why |
| `RESERVED`  | the name is one of the log's tables                                  |
| `EXHAUSTED` | the context has 50 views, and this is not one of them                |

### `DELETE /chronicles/queries/views/:name`

```http
DELETE /chronicles/queries/views/daily/ HTTP/1.1
authorization: Token …
```

```http
204 No Content
```

| code        | when                  |
| ----------- | --------------------- |
| `NOT_FOUND` | there is no such view |

### Over MCP

Where the context publishes [MCP](/extensions/exposition/documentation/mcp.md), each of these
routes is a tool, under the name the gateway gives a route, and taking what the route takes:

| tool                                    | route                                    |
| --------------------------------------- | ---------------------------------------- |
| `chronicles.queries.GET`                | `GET /chronicles/queries/`               |
| `chronicles.queries.POST`               | `POST /chronicles/queries/`              |
| `chronicles.queries.views._name.PUT`    | `PUT /chronicles/queries/views/:name`    |
| `chronicles.queries.views._name.DELETE` | `DELETE /chronicles/queries/views/:name` |

A tool is listed to a caller that holds its role, and a refusal is a tool result with `isError`.

## Deployment

```yaml
# context.toa.yaml
chronicles:
  store:
    provider: clickhouse
    url: https://ch.example.com:8443/shop
  retention: 730
  ingest: true
```

|             |                                                             |
| ----------- | ----------------------------------------------------------- |
| `store`     | the provider that keeps the log, and its address            |
| `retention` | days a row of `events` is kept; absent, kept                |
| `ingest`    | the browser route; absent, there is none                    |
| `ip`        | `full` keeps a browser's whole address; absent, its network |

```shell
$ toa conceal chronicles-store username=… password=… reader=…
```

The user provisions the store when the service starts. It creates the reader, the user queries run
as, with `reader` as its password.

The events the components name travel where the context's `amqp` says, as every event does.

## ClickHouse

`url` is ClickHouse's HTTP address, and its path names the database, which is created where it does
not exist. The user needs `CREATE`, `INSERT` and `access_management`; the reader is
`<database>_reader`.

`events` and `states` are replaced by key in the background, so a query reads them with `FINAL`,
which collapses what was delivered twice:

```sql
SELECT payload.total::Float64, count() FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY 1
SELECT entity, payload FROM states FINAL WHERE component = 'store.orders'
```

A view with `refresh` is a refreshable materialized view.
