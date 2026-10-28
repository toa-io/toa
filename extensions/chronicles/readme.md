# Toa Chronicles

A log of what happens in a context. Components write to it by the events they declare and the
facts they send, clients by a route of the gateway; the service `chronicles-relay` publishes every
row of it to an analytics broker, and reads it back from a store, by an
[HTTP API](#reading-the-log) — which the gateway also publishes as [MCP](#over-mcp) tools.

Writing and reading meet in nothing Toa does: what takes the rows off the broker into the store,
and who may read what there, is the [store's](#the-store) own setup.

## The log

Three tables, each row of which has the `scope` of the context that wrote it — the context's name,
followed by `TOA_SUFFIX` where one is given — and a reader sees the rows of its own scope.

**`events`** holds a row for everything a component did: an [event](#events-and-states) it
declares, under `<component>.<event>`, with the entity that changed and its version; and a
[fact](#facts) it sends, under `<component>.<name>`, with neither.

| `label`                 | `component`    | `entity` | `version` | `payload`                         |
| ----------------------- | -------------- | -------- | --------- | --------------------------------- |
| `store.orders.created`  | `store.orders` | `9c1f…`  | `0`       | `{ total: 120, status: "new" }`   |
| `store.search.searched` | `store.search` | `NULL`   | `NULL`    | `{ query: "teapot", results: 3 }` |

Every row also has `id`, the same however often it is delivered, so a row is kept once;
`identity`, whose it is, where something [says so](#identity); `time`, when it
[happened](#time); and `trace`, the traceparent of the call that caused it.

**`states`** holds each entity as it stands: for every component that declares a
[state](#events-and-states), a row per entity — `component`, `entity`, `version`, `identity`,
`time` and `payload` — which a higher version replaces. It is the current state and
nothing before it: what an entity was yesterday is read from its events, so an event a question
of history depends on has to carry what that question asks.

**`encounters`** holds what [clients send](#encounters): `id`, `name`, `time`, `received`,
`visitor`, `session`, `identity`, `ip`, `country`, `origin`, `agent`, `browser`, `os`, `device` and
`payload`.

Nothing is ordered: order by `time`, or by `version` within one entity.

### Time

Every time is the one its source says — when it happened — and none is when the store wrote it:

|           | `time`                                                                                    |
| --------- | ----------------------------------------------------------------------------------------- |
| an event  | the payload's [timestamp](#when-a-change-was-made), or when the component made the change |
| a state   | likewise                                                                                  |
| a fact    | when the operation sent it                                                                |
| encounter | when the gateway received it, less how long before sending it the client says it happened |

So a change the relay takes an hour late is written at the time it was made, and the hours it
was away fill in as it catches up: a count of a recent period may still grow. An encounter's
`received` is when the gateway received its batch.

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
that does not is refused, and parked likewise. A row of `events` takes its `entity` and `version`
from the payload's `id` and `VERSION` where it carries them, and is written without them where it
does not. These, the [timestamp](#when-a-change-was-made) and the [identity](#identity) are read
before the contract applies, and are not declared. An event that is both is named in both.

A committed change is written however long the relay or the broker is away, and once however often it is
delivered. One committed before the relay first ran in a deployment is not.

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

### Reading what is declared

`describe` tells, of every declared field of a label or a state, its type and how to read it from
the table in that type:

```yaml
- label: store.orders.paid
  fields:
    - path: total
      type: Int64
      description: The amount paid, in cents
      read: JSONExtract(ifNull(toJSONString(payload.total), 'null'), 'Nullable(Int64)')
```

```sql
SELECT JSONExtract(ifNull(toJSONString(payload.total), 'null'), 'Nullable(Int64)') AS total, count()
FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY total
```

A value that is not of its type reads as `NULL`; the row keeps it as it was written. A contract
that changes changes what `describe` tells, and the rows written before it are read the same way.

### When a change was made

`time` is the payload's `UPDATED`, which the entity as it stands carries, where it is a number,
and where it is not, the moment the component made the change, which every event carries:

```yaml
# manifest.toa.yaml
chronicles:
  timestamp: placed # the property of the payloads that says when, in milliseconds
  events: …
```

A component names another property, or none with `timestamp: ~`, when the moment of the change
is always the time. One property serves every event of the component and its state.

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
the relay as an event does.

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
the context says `encounters: true`, at two routes: one of an identity, and one of no one. Who may
send to which is in [Access](#access).

### `POST /chronicles/encounters/:identity/`

What a signed-in client sends, as the identity it is.

```http
POST /chronicles/encounters/9c1f0a6d5b7e4f3a8d2c1b0a9e8f7d6c/ HTTP/1.1
authorization: Token …
content-type: application/json

{
  "sent": 1761200004000,
  "visitor": "7f3a…",
  "session": "01c2…",
  "events": [{ "id": "0192f3a1-…", "name": "page_viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }]
}
```

```http
202 Accepted

accepted: 1
```

The rows are that identity's, whatever the body says.

### `POST /chronicles/encounters/`

What anyone sends, before signing in or without it. The same body, and rows of no identity; a body
that names one is refused.

A form whose `events` is their JSON, beside `sent`, `visitor` and `session`, is read as the JSON
body, so `navigator.sendBeacon`, which sends no `authorization`, can send a batch here as the page
closes:

```javascript
navigator.sendBeacon(
  '/chronicles/encounters/',
  new URLSearchParams({
    sent: Date.now(),
    visitor,
    session,
    events: JSON.stringify(events)
  })
)
```

A signed-in client sends with `fetch(…, { keepalive: true })` instead.

### The body

`{ sent, visitor?, session?, events }`:

| property  |                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------- |
| `sent`    | when the client sends the batch, in milliseconds, by its clock                                 |
| `visitor` | the client's own id of itself, kept across sessions; at most 64 characters, or `null` for none |
| `session` | the id of one period of the client's activity; at most 64 characters, or `null` for none       |
| `events`  | at most 100 of them                                                                            |

Each event:

| property  |                                                                     |
| --------- | ------------------------------------------------------------------- |
| `id`      | the client's own, at most 64 characters; a retry sends the same one |
| `name`    | lowercase letters, digits and underscores from a letter, at most 64 |
| `time`    | when it happened, in milliseconds, by the client's clock, by `sent` |
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

A client's clock is its own, and may be off by anything; what it measures between two of its
moments is not. So an encounter's `time` is when the gateway received the batch, less `sent`
minus its own `time`: the gateway's clock, at the distance the client measured. A clock that is
wrong moves nothing, and a batch kept offline for an hour is written an hour back. A row is kept
and expires by `received`.

### Address and country

Every encounter has the `ip` and the `country` of the request, as the gateway reads them from the
headers [`exposition.ip` and `exposition.country`](/extensions/exposition/documentation/ip.md)
name, and `NULL` where it has none; a body that names either is overwritten. An address is
personal data, and the log erases nothing, so of an address the log keeps its network — a `/24`
of IPv4, a `/48` of IPv6 — unless the annotation says `ip: full`.

### Origin and agent

Every encounter has the `origin` of the page that sent it and the client's `agent`, from the
request's `Origin` and `User-Agent` headers, and `NULL` where it has none; a body that names either
is overwritten, and a body cannot say one the request does not have. A browser sends `Origin` with
a request to another origin, and with every `POST`, so it tells which of the context's sites a
batch came from.

What the agent says the client is, is three columns of its own, by name and without versions:

|           |                                                                               |
| --------- | ----------------------------------------------------------------------------- |
| `browser` | `Edge`, `Opera`, `Samsung Internet`, `Firefox`, `Chrome`, `Safari`, or `NULL` |
| `os`      | `Windows`, `iOS`, `macOS`, `Android`, `ChromeOS`, `Linux`, or `NULL`          |
| `device`  | `bot`, `tablet`, `mobile` or `desktop`, and `NULL` where there is no agent    |

`bot` is a crawler, a headless browser or a program — what a question of who visits leaves out.
Safari on an iPad says it is a Mac, and is a `desktop` running `macOS` here. A version is read from
`agent` where a question needs one, knowing that browsers freeze what they say of the system:
Safari on iOS 26 says iOS 18, and Chrome on Android says Android 10.

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

It documents, and holds nothing back: a name it does not tell is written as any other.

## Reading the log

A refusal is answered `422` with `{ code, cause }`. Who may read is in [Access](#access).

### `GET /chronicles/queries/`

What the log holds: a guide to reading it, the labels of `events`, the components
with a state, the encounters, and the views.

```http
GET /chronicles/queries/ HTTP/1.1
authorization: Token …
accept: application/yaml
```

```http
200 OK

guide: |
  # Reading the log

  The log is three tables, read with `FINAL`.
  …
labels:
  - label: store.orders.paid
    description: An order's payment completed
    rows: 1204
    first: 2026-10-01 08:12:03.000
    last: 2026-10-24 17:40:51.000
    fields:
      - path: total
        type: Int64
        description: The amount paid, in cents
        read: JSONExtract(ifNull(toJSONString(payload.total), 'null'), 'Nullable(Int64)')
      - path: shipping
        type: Tuple(country String)
        description: Where the order goes
        read: JSONExtract(toJSONString(payload.^shipping), 'Tuple(country Nullable(String))')
      - path: shipping.country
        type: String
        description: ISO 3166 alpha-2
states:
  - component: store.orders
    description: An order as it stands
    entities: 1180
    last: 2026-10-24 17:40:51.000
    fields:
      - path: status
        type: LowCardinality(String)
        description: Where the order is in its life
        read: JSONExtract(ifNull(toJSONString(payload.status), 'null'), 'LowCardinality(Nullable(String))')
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
    read: shop.paid_daily
    title: Orders paid per day
    description: Orders whose payment completed, counted by the day of `time`
    sql: SELECT toDate(time) AS day, count() AS paid FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY day
    refresh: 3600
    refreshed: 2026-10-24 17:00:03
```

`guide` is how to read the log — what its tables and columns mean, and what to be careful of —
and how its store is read, in the store's dialect: what an agent reads before its first query.
Toa writes it; what is particular to an application is in the descriptions of what it declares
and documents, and in [`exposition.mcp.instructions`](/extensions/exposition/documentation/mcp.md).

A label and a state are told by their declaration, with each field's type and how to
[read](#reading-what-is-declared) it in that type; a field of a field is read inside the one that
holds it. A label declared and not yet written is told with no rows. An encounter is
told by what was sent: the fields of the latest payloads, the types they were sent as — two
types of one field are two versions of a client — and the description the
[configuration](#what-the-encounters-are) gives.

`rows` counts what the store holds, a row delivered twice possibly twice. `first` and `last` are
by `time`, the latest change of a state too; an encounter's `received` is the newest batch the
gateway received, which tells whether clients still send.

### `POST /chronicles/queries/`

One statement, in the store's dialect, as the `guide` says.

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

### `PUT /chronicles/queries/views/:name/`

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
view is kept in the database named after the context's scope, and a query reads it by that name:
`shop.paid_daily`. Defining one takes a store whose user may create views there; one that may not
is refused.

| code        | when                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `REFUSED`   | the statement is not one a query could run; `cause.message` says why |
| `RESERVED`  | the name is one of the log's tables                                  |
| `EXHAUSTED` | the context has 50 views, and this is not one of them                |

### `DELETE /chronicles/queries/views/:name/`

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

| tool                                    | route                                     |
| --------------------------------------- | ----------------------------------------- |
| `chronicles.queries.GET`                | `GET /chronicles/queries/`                |
| `chronicles.queries.POST`               | `POST /chronicles/queries/`               |
| `chronicles.queries.views._name.PUT`    | `PUT /chronicles/queries/views/:name/`    |
| `chronicles.queries.views._name.DELETE` | `DELETE /chronicles/queries/views/:name/` |
| `chronicles.encounters.GET`             | `GET /chronicles/encounters/`             |

A refusal is a tool result with `isError`.

## Access

| route                                     | who may call                         | limit                       |
| ----------------------------------------- | ------------------------------------ | --------------------------- |
| `POST /chronicles/encounters/`            | anyone, with no credentials          | 60 a minute per address     |
| `POST /chronicles/encounters/:identity/`  | the identity, by its own credentials | 60 a minute per identity    |
| `GET /chronicles/encounters/`             | `system:chronicles:encounters`       |                             |
| `GET /chronicles/queries/`                | `system:chronicles:query`            |                             |
| `POST /chronicles/queries/`               | `system:chronicles:query`            | the [reader's](#the-reader) |
| `PUT /chronicles/queries/views/:name/`    | `system:chronicles:views`            | 50 views                    |
| `DELETE /chronicles/queries/views/:name/` | `system:chronicles:views`            |                             |

A caller without what a route takes is answered `403`, and past its limit `429`. Over
[MCP](#over-mcp), a tool is listed to a caller that holds its role, and to no one else.

### Roles

|                                |                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `system:chronicles:query`      | reads every row of the log: the identities, the networks, the origins and agents of clients |
| `system:chronicles:views`      | defines and drops the views every reader reads; a view can read only what a query can       |
| `system:chronicles:encounters` | reads what the configuration documents of encounters, and no row                            |
| `system:chronicles`            | all three                                                                                   |

`query` is access to personal data, and is granted as that. `views` changes what other readers are
told a view counts, and changes nothing of the log. `encounters` is for whoever writes a client.
A role is granted as any [role](/extensions/exposition/documentation/access.md) is.

### What a client cannot say

A client sends events and nothing that says who or where it is: `identity` is the path's, which the
credentials have to be the identity's; `ip`, `country`, `origin` and `agent` are what the gateway
read off the request, and a body that names one is overwritten, or refused where it names
`identity` on the route of no one. Anything else in a payload is what the client said — a `user`
there is not a user — so a question that depends on who sent an encounter asks `identity`.

### The reader

A query runs as the context's user of the store, which reads what the [store](#the-store) lets it
— in the reference setup, the rows of its scope and the views of its database — and is never let
lift its limits there. Toa asks a query to be read-only besides, so a query can change nothing even
of what its user may: only `define` and `drop` create and remove views.

## Deployment

```yaml
# context.toa.yaml
chronicles:
  broker: amqp://analytics.internal
  store:
    provider: clickhouse
    url: http://analytics.internal:8123
  retention: 730
  encounters: true
```

|              |                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `broker`     | where the rows are published                                                                     |
| `store`      | where they are read: the provider, and the address of its server; absent, they are not read here |
| `retention`  | days a row of `events` and of `encounters` is kept; absent, kept                                 |
| `encounters` | the routes clients send to; absent, there are none                                               |
| `ip`         | `full` keeps a client's whole address; absent, its network                                       |
| `resources`  | what the service may take, as [`resources`](/migrations/262.md) is stated elsewhere              |

```shell
$ toa conceal chronicles broker_username=… broker_password=… store_username=… store_password=…
```

The service `chronicles-relay` alone is given the secret.

### Writing without reading

A context that names no `store` writes the log and does not read it: it has none of the routes of
[Reading the log](#reading-the-log), nor their tools, and its secret holds the broker's user alone.
Its rows are read where a store's user may read their scope — by a platform that reads the
contexts it runs, say.

```yaml
# context.toa.yaml
chronicles:
  broker: amqp://analytics.internal
  encounters: true
```

```shell
$ toa conceal chronicles broker_username=… broker_password=…
```

The events the components declare travel where the context's `amqp` says, as every event does, and
the relay takes them from there. A fact and an encounter reach it as tasks. Each is acknowledged
once the broker has confirmed its row, so while the broker is away they wait where they are, and
are published once it is back; the relay starts and is ready without it.

## The store

What Toa publishes and what it reads; what takes the one into the other is not Toa's.

**Published:** one JSON row a message, persistent, to the exchange `chronicles` (`direct`) of the
broker, under the key of its table — `events`, `states` or `encounters`. A row has the columns of
its table:

| table        | row                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`     | `scope`, `id`, `label`, `component`, `time`, `entity`, `version`, `identity`, `trace`, `payload`, `expires`                                                      |
| `states`     | `scope`, `component`, `entity`, `version`, `identity`, `time`, `payload`                                                                                         |
| `encounters` | `scope`, `id`, `name`, `time`, `received`, `visitor`, `session`, `identity`, `ip`, `country`, `origin`, `agent`, `browser`, `os`, `device`, `payload`, `expires` |

A time is `YYYY-MM-DD hh:mm:ss.sss`, in UTC; `expires` is `time` — an encounter's `received` — and
`retention` days, or `2106-01-01 00:00:00` where there is none. A row may be delivered more than
once, with the same `id`. The broker's user needs to declare and to write the exchange `chronicles`,
and nothing else.

**Read:** `events`, `states` and `encounters`, with those columns, in the default database of the
`store` user, and a database named after the scope for its views.

The relay writes the scope of its context into every row, and nothing else does: the broker tells
the store nothing of who published a row. What keeps a context from reading another's rows is the
store's.

### ClickHouse

[`store/clickhouse.sql`](./store/clickhouse.sql) sets a store up: the database `chronicles` with the
three tables, which are replaced by key in the background — so a query reads them with `FINAL`,
which collapses what was delivered twice — and a RabbitMQ engine table and a view for each, which
take the rows off the broker. [`store/clickhouse.scope.sql`](./store/clickhouse.scope.sql) adds the
user of a context: its row policy, its limits and its database. A user with no row policy reads
every scope, which is how a platform reads the contexts it runs:

```sql
SELECT scope, count() FROM encounters FINAL GROUP BY scope
SELECT visitor, groupUniqArray(identity) FROM encounters FINAL WHERE identity IS NOT NULL GROUP BY visitor
```

A view with `refresh` is a refreshable materialized view, computed as its definer — the context's
user — and so of its scope.
