# Toa Chronicles

A log of what happens in a context, kept in a store the context names. Components write to it by
the events they declare and the facts they send, clients by a route of the gateway, and it is
read by an [HTTP API](#reading-the-log) — which the gateway also publishes as [MCP](#over-mcp)
tools. The service `chronicles-scribe` writes the log, and is what the store is provisioned by and
read through.

## The log

Three tables.

**`events`** holds a row for everything a component did: an [event](#events-and-states) it
declares, under `<component>.<event>`, with the entity that changed and its version; and a
[fact](#facts) it sends, under `<component>.<name>`, with neither.

| `label`                 | `component`    | `entity` | `version` | `payload`                         |
| ----------------------- | -------------- | -------- | --------- | --------------------------------- |
| `store.orders.created`  | `store.orders` | `9c1f…`  | `0`       | `{ total: 120, status: "new" }`   |
| `store.search.searched` | `store.search` | `NULL`   | `NULL`    | `{ query: "teapot", results: 3 }` |

Every row also has `id`, the same however often it is delivered, so a row is kept once;
`identity`, whose it is, where something [says so](#identity); `time`, when it happened;
`received`, when the store wrote it; and `trace`, the traceparent of the call that caused it.

**`states`** holds each entity as it stands: for every component that declares a
[state](#events-and-states), a row per entity — `component`, `entity`, `version`, `identity`,
`time`, `received` and `payload` — which a higher version replaces. It is the current state and
nothing before it: what an entity was yesterday is read from its events, so an event a question
of history depends on has to carry what that question asks.

**`encounters`** holds what [clients send](#encounters): `id`, `name`, `time` by the client's
clock, `received`, `visitor`, `session`, `identity`, `ip`, `country` and `payload`.

Nothing is ordered: order by `time`, or by `version` within one entity.

## Events and states

A component declares what it logs, and nothing else of it is written:

```yaml
# manifest.toa.yaml
chronicles:
  events:
    paid:
      description: An order's payment completed
      properties:
        total:
          type: integer
          description: The amount paid, in cents
        shipping:
          type: object
          description: Where the order goes
          properties:
            country:
              type: string
              description: ISO 3166 alpha-2
  state:
    event: snapshot
    description: An order as it stands
    properties:
      status:
        type: string
        enum: [new, paid, shipped]
        description: Where the order is in its life
```

Each label under `events` is an event of the component — its own, or the prototype's `created`,
`updated`, `deleted` and `sync` — and `state.event` is the one whose payload is the entity. An
event is written as it renders: where its `condition` does not hold, nothing is written; where it
has a `payload`, what the payload returns is what is written. An event that exists for the log
alone is an event file like any other, and nothing else has to consume it.

### The contract

`description` says what the label means, and `properties` what its payload holds, as
[JSON Schema](https://json-schema.org) of the types [below](#types). Every property, at every
depth, has a `description`; a declaration that leaves one out, or uses what has no type there, is
refused when the component is read.

What is written is the declared properties of the payload, at every depth, and nothing else: a
property the declaration leaves out — an email, a document, a field added to the entity since —
does not reach the store. A payload whose declared property is of another type is not written,
and is kept in the parking queue of its consumer.

A state's payload carries `id` and `VERSION`, which say which entity it is and which version: one
that does not is refused, and parked likewise. A row of `events` takes its `entity`, `version` and
`time` from the payload's `id`, `VERSION` and `UPDATED` where it carries them, and is written
without them, at the time it was taken, where it does not. These are read before the contract
applies, and are not declared. An event that is both is named in both.

A committed change is written however long the scribe is away, and once however often it is
delivered. One committed before the scribe first ran in a deployment is not.

### Types

| declared                                 | read as                  |
| ---------------------------------------- | ------------------------ |
| `string`                                 | `String`                 |
| `string` with `enum`                     | `LowCardinality(String)` |
| `integer`                                | `Int64`                  |
| `number`                                 | `Float64`                |
| `boolean`                                | `Bool`                   |
| `string`, `format: date-time`            | `DateTime64(3, 'UTC')`   |
| `string`, `format: date`                 | `Date32`                 |
| `string`, `format: time`                 | `Time64(3)`              |
| `string`, `format: uuid`, `ipv4`, `ipv6` | `UUID`, `IPv4`, `IPv6`   |
| `integer`, `format: int32`               | `Int32`                  |
| `number`, `format: float`                | `Float32`                |
| any other `format`                       | as its `type`            |
| `object` with `properties`               | `Tuple` of them, by name |
| `array` with `items` of any of these     | `Array` of it            |

### Views of the declared

Every declared label, and every state, is a view of the log by the label with its dots as
underscores — `store_orders_paid`, and `store_orders` for the state — whose columns are what a row
says of itself and the declared properties in their types:

```sql
SELECT shipping.country, sum(total) / 100 AS paid FROM store_orders_paid GROUP BY 1
SELECT item.sku, sum(item.quantity) FROM store_orders_paid ARRAY JOIN items AS item GROUP BY 1
```

A value that is not of its type reads as `NULL` there; the row keeps it as it was written. A
view follows its declaration once the scribe starts after a deploy, so a contract that changes
changes the view, and the rows written before it are read by the new one.

### Identity

`identity` is the payload's `identity`, where it is a string:

```yaml
# manifest.toa.yaml
chronicles:
  identity: customer # the property of the payloads that names whose a row is
  events: …
```

A component names another property, or none with `identity: ~`. One property serves every event of
the component and its state, and a payload that leaves it out is a row of no identity. A property
the component names is one of its entity.

## Facts

```yaml
# manifest.toa.yaml
chronicles:
  facts:
    searched:
      description: A customer searched the catalogue
      properties:
        query:
          type: string
          description: What was typed
        results:
          type: integer
          description: How many products were found
```

```typescript
await context.chronicles.send('searched', { query: input.query, results: results.length })
```

The fact is a row of `events` under `<component>.searched`, with what was sent of its contract as
its payload. `send` throws for a name the component does not declare, or a payload a declared
property of which is of another type; it resolves once the broker has it, and it then waits for
the scribe as an event does.

An operation that knows whose the fact is says so; the extension does not know who called it:

```typescript
await context.chronicles.send(
  'searched',
  { query: input.query },
  { identity: input.customer }
)
```

`context.chronicles` is given to a component that declares `chronicles`.

## Encounters

What clients send: pages viewed, buttons pressed, anything a client tells of itself. Served where
the context says `encounters: true`, at two routes: one of an identity, and one of no one.

### `POST /chronicles/encounters/:identity/`

What a signed-in client sends, as the identity it is.

```http
POST /chronicles/encounters/9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c/ HTTP/1.1
authorization: Token …
content-type: application/json

{
  "visitor": "7f3a…",
  "session": "01c2…",
  "events": [{ "id": "0192f3a1-…", "name": "page_viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }]
}
```

```http
202 Accepted

accepted: 1
```

The token is the identity's, or the request is answered `403`: the rows are that identity's,
whatever the body says. Throttled to 60 requests a minute per identity.

### `POST /chronicles/encounters/`

What anyone sends, before signing in or without it. The same body, and rows of no identity; a body
that names one is refused.

It takes no credentials, and is throttled to 60 requests a minute per address. A form whose
`events` is their JSON, beside `visitor` and `session`, is read as the JSON body, so
`navigator.sendBeacon`, which sends no `authorization`, can send a batch here as the page closes:

```javascript
navigator.sendBeacon(
  '/chronicles/encounters/',
  new URLSearchParams({ visitor, session, events: JSON.stringify(events) })
)
```

A signed-in client sends with `fetch(…, { keepalive: true })` instead. Anyone can send anything: a
`user` in a payload is what the client said.

### The body

`{ visitor?, session?, events }`:

| property  |                                                                            |
| --------- | -------------------------------------------------------------------------- |
| `visitor` | the client's own id of itself, kept across sessions; at most 64 characters |
| `session` | the id of one period of the client's activity; at most 64 characters       |
| `events`  | at most 100 of them                                                        |

Each event:

| property  |                                                                     |
| --------- | ------------------------------------------------------------------- |
| `id`      | the client's own, at most 64 characters; a retry sends the same one |
| `name`    | lowercase letters, digits and underscores from a letter, at most 64 |
| `time`    | when it happened, in milliseconds, by the client's clock            |
| `payload` | an object, at most 16 KiB of JSON                                   |

The client keeps its `visitor` — in `localStorage`, say — and sends the same one before signing
in and after. The rows of the route of an identity have both, so the visitors of an identity are
a query. A visitor is not a person: one identity may have many, and a browser that clears its
storage is a new one.

A request is answered once its events are written. A batch one event of which breaks any of the
above is written not at all, and answered `422` with the code `INVALID`, or `OVERSIZED` for a
payload too large, and the `index` of the event in `cause`.

A payload is written as it was sent, whatever its shape: a client is deployed once and runs for
months, so a shape that changes is a new `name` — `checkout_started_v2` — and the old one stays as
old clients send it.

`time` is kept as the client said, and `received` is when the store wrote it: a row is kept and
expires by `received`, so a clock that is wrong moves nothing but the `time` it reports.

### Address and country

Every encounter has the `ip` and the `country` of the request, as the gateway reads them from the
headers [`exposition.ip` and `exposition.country`](/extensions/exposition/documentation/ip.md)
name, and `NULL` where it has none; a body that names either is overwritten. An address is
personal data, and the log erases nothing, so of an address the log keeps its network — a `/24`
of IPv4, a `/48` of IPv6 — unless the annotation says `ip: full`.

### What the encounters are

What a client sends is told in the configuration of `chronicles.encounters`, by name:

```yaml
# context.toa.yaml
configuration:
  chronicles.encounters:
    page_viewed:
      description: A page was shown
      fields:
        path: The URL path, without the query
        referrer: The page the visitor came from
```

It is what `describe` tells an agent of each encounter's fields, and what whoever writes a client
reads:

```http
GET /chronicles/encounters/ HTTP/1.1
authorization: Token …
accept: application/yaml
```

```http
200 OK

page_viewed:
  description: A page was shown
  fields:
    path: The URL path, without the query
    referrer: The page the visitor came from
```

It takes the role `system:chronicles:encounters`. It documents, and holds nothing back: a name it
does not tell is written as any other.

## Reading the log

Reading takes the role `system:chronicles:query`, and views take `system:chronicles:views`;
`system:chronicles` grants these and `system:chronicles:encounters`. A refusal is answered `422`
with `{ code, cause }`.

### `GET /chronicles/queries/`

What the log holds: the dialect queries are written in, the labels of `events`, the components
with a state, the encounters, and the views.

```http
GET /chronicles/queries/ HTTP/1.1
authorization: Token …
accept: application/yaml
```

```http
200 OK

dialect: ClickHouse SQL; read `events`, `states` and `encounters` with FINAL
labels:
  - label: store.orders.paid
    description: An order's payment completed
    view: store_orders_paid
    rows: 1204
    first: 2026-10-01 08:12:03.000
    last: 2026-10-24 17:40:51.000
    received: 2026-10-24 17:40:52.113
    fields:
      - path: total
        type: Int64
        description: The amount paid, in cents
      - path: shipping
        type: Tuple(country String)
        description: Where the order goes
      - path: shipping.country
        type: String
        description: ISO 3166 alpha-2
states:
  - component: store.orders
    description: An order as it stands
    view: store_orders
    entities: 1180
    received: 2026-10-24 17:40:52.113
    fields:
      - path: status
        type: LowCardinality(String)
        description: Where the order is in its life
encounters:
  - name: page_viewed
    description: A page was shown
    rows: 88123
    first: 2026-10-01 00:00:14.000
    last: 2026-10-24 17:41:02.000
    received: 2026-10-24 17:41:03.020
    fields:
      - path: path
        types: [String]
        description: The URL path, without the query
      - path: utm
        types: [Int64, String]
views:
  - name: paid_daily
    title: Orders paid per day
    description: Orders whose payment completed, counted by the day of `time`
    sql: SELECT toDate(time) AS day, count() AS paid FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY day
    refresh: 3600
    refreshed: 2026-10-24 17:00:03
```

A label and a state are told by their declaration, with the type a [view](#views-of-the-declared)
reads each field as. A label declared and not yet written is told with no rows. An encounter is
told by what was sent: the fields of the latest payloads, the types they were sent as — two
types of one field are two versions of a client — and the description the
[configuration](#what-the-encounters-are) gives.

`rows` counts what the store holds, a row delivered twice possibly twice. `first` and `last` are
by `time`; `received` is the newest row the store wrote, which tells whether rows still arrive.

### `POST /chronicles/queries/`

One statement, in the dialect.

```http
POST /chronicles/queries/ HTTP/1.1
authorization: Token …
accept: application/yaml
content-type: application/yaml

sql: SELECT status, count() AS n FROM store_orders GROUP BY status
```

```http
201 Created

columns:
  - name: status
    type: Nullable(String)
  - name: n
    type: UInt64
rows:
  - [new, 31]
  - [paid, 1149]
truncated: false
```

A query reads the log and nothing else, and cannot write. It runs for at most 30 seconds, answers
at most 10,000 rows and 64 MiB, and a reader runs at most 4 queries at once: past the rows it
answers what it has, with `truncated: true`; past the rest it is refused. It leaves `FORMAT` out.

| code      | when                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `REFUSED` | the store refused the statement; `cause.message` is what the store said |

### `PUT /chronicles/queries/views/:name`

A view over the log, by a statement a query could run. Defining a name again replaces the view.

```http
PUT /chronicles/queries/views/paid_daily/ HTTP/1.1
authorization: Token …
content-type: application/yaml

title: Orders paid per day
description: Orders whose payment completed, counted by the day of `time`
sql: SELECT toDate(time) AS day, count() AS paid FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY day
refresh: 3600
```

```http
204 No Content
```

`title`, at most 100 characters, and `description` tell an agent that finds the view what it
counts. Without `refresh`, a view is computed when it is read. With `refresh`, in seconds and at
least `3600`, it is computed on that cycle and read as a table, and `describe` tells when it last
was. A name is lowercase letters, digits and underscores, and a context has at most 50 views. A
query reads a view by its name.

| code        | when                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `REFUSED`   | the statement is not one a query could run; `cause.message` says why |
| `RESERVED`  | the name is one of the log's tables, or the view of a declared label |
| `EXHAUSTED` | the context has 50 views, and this is not one of them                |

### `DELETE /chronicles/queries/views/:name`

```http
DELETE /chronicles/queries/views/paid_daily/ HTTP/1.1
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
| `chronicles.encounters.GET`             | `GET /chronicles/encounters/`            |

A tool is listed to a caller that holds its role, and a refusal is a tool result with `isError`.

## Deployment

```yaml
# context.toa.yaml
chronicles:
  store:
    provider: clickhouse
    url: https://ch.example.com:8443/shop
  retention: 730
  encounters: true
```

|              |                                                                  |
| ------------ | ---------------------------------------------------------------- |
| `store`      | the provider that keeps the log, and its address                 |
| `retention`  | days a row of `events` and of `encounters` is kept; absent, kept |
| `encounters` | the routes clients send to; absent, there are none               |
| `ip`         | `full` keeps a client's whole address; absent, its network       |

```shell
$ toa conceal chronicles-store username=… password=… reader=…
```

The user provisions the store when the service starts. It creates the reader, the user queries run
as, with `reader` as its password.

The events the components declare travel where the context's `amqp` says, as every event does.

## ClickHouse

`url` is ClickHouse's HTTP address, and its path names the database, which is created where it does
not exist. The user needs `CREATE`, `INSERT` and `access_management`; the reader is
`<database>_reader`.

`events`, `states` and `encounters` are replaced by key in the background, so a query reads them
with `FINAL`, which collapses what was delivered twice. The views of the declared read with
`FINAL` themselves.

```sql
SELECT total, count() FROM store_orders_paid GROUP BY 1
SELECT visitor, groupUniqArray(identity) FROM encounters FINAL WHERE identity IS NOT NULL GROUP BY visitor
```

A view with `refresh` is a refreshable materialized view.
