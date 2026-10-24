# Toa Chronicles

A log of what happens in a context, kept in a store the context names, and read over the gateway's
[MCP](/extensions/exposition/documentation/mcp.md). The service `chronicles-scribe` writes it, and
is what the store is provisioned by and read through.

## The log

Two tables.

**`events`** holds a row for everything that happened, from three sources:

| source                                      | `label`               | `entity`, `version`                      | `payload`              |
| ------------------------------------------- | --------------------- | ---------------------------------------- | ---------------------- |
| a [change](#changes) of a component         | `<component>.<event>` | the entity that changed, and its version | what the event renders |
| a [fact](#facts) an operation sends         | `<component>.<name>`  | `NULL`                                   | what was sent          |
| an event a [browser](#from-a-browser) sends | `client.<name>`       | `NULL`                                   | what the browser sent  |

An order placed, a search made and a page left are three rows:

| `label`                 | `component`         | `entity` | `version` | `payload`                         |
| ----------------------- | ------------------- | -------- | --------- | --------------------------------- |
| `store.orders.created`  | `store.orders`      | `9c1f…`  | `0`       | `{ total: 120, status: "new" }`   |
| `store.search.searched` | `store.search`      | `NULL`   | `NULL`    | `{ query: "teapot", results: 3 }` |
| `client.page.left`      | `chronicles.ingest` | `NULL`   | `NULL`    | `{ path: "/pricing" }`            |

Every row also has `id`, the same however often it is delivered, so a row is kept once; `time`,
when it happened; `received`, when the store wrote it; and `trace`, the traceparent of the call
that caused it.

**`states`** holds, for each entity under each label, the payload of its latest version. A row of
`events` that names an entity is one of `states` as well, and replaces the one of a lower version:
the history of an order is in `events`, and under a label whose payload is the entity — like
`snapshot` below — the order as it stands is in `states`. Facts and what browsers send name no
entity and are not in `states`.

Nothing is ordered: order by `time`, or by `version` within one entity.

## Changes

```yaml
# manifest.toa.yaml
chronicles: [created, snapshot]
```

Each label is an event of the component — its own, or the prototype's `created`, `updated`,
`deleted` and `sync`. A change is written as the event renders it: where the event's `condition`
does not hold, nothing is written for it; where it has a `payload`, what the payload returns is
what is written. A field a payload leaves out does not reach the store.

An event that exists for the log alone is an event file like any other, and nothing else has to
consume it:

```typescript
// events/snapshot.ts
export function payload(event: Event) {
  const { email, address, ...rest } = event.state

  return rest
}
```

The row says which entity changed, its version and when, by the payload's `id`, `VERSION` and
`UPDATED`: a payload that leaves them out is written without them, at the time it was taken. `sync`
is the entity as it stands, every field of it.

Each change is a row of `events` under `<component>.<event>` for every event it renders. A
committed change is written however long the scribe is away, and once however often it is
delivered. One committed before the scribe first ran in a deployment is not.

## Facts

```typescript
await context.chronicles.send('searched', { query: input.query, results: results.length })
```

The fact is a row of `events` under `<component>.searched`, with what was sent as its payload.
`send` resolves once the broker has it, and it then waits for the scribe as an event does.

`context.chronicles` is given to a component that declares `chronicles`. One that only sends
declares it empty:

```yaml
# manifest.toa.yaml
chronicles: []
```

## From a browser

```yaml
# context.toa.yaml
chronicles:
  ingest: true
```

```http
POST /chronicles/ingest/ HTTP/1.1
content-type: application/json

[{ "id": "0192f3a1-…", "name": "page.viewed", "time": 1761200000000, "payload": { "path": "/pricing" } }]
```

```http
202 Accepted

accepted: 1
```

| property  |                                                                     |
| --------- | ------------------------------------------------------------------- |
| `id`      | the client's own, at most 64 characters; a retry sends the same one |
| `name`    | lowercase segments separated by dots, at most 64 characters         |
| `time`    | when it happened, in milliseconds, by the client's clock            |
| `payload` | an object, at most 16 KiB of JSON                                   |

A request carries at most 100 events. A batch one event of which breaks any of this is written
not at all, and answered with the code `INVALID`, or `OVERSIZED` for a payload too large, and the
`index` of the event in `cause`. `text/plain` is read as JSON, so `navigator.sendBeacon` can send a
batch. The route is anonymous and throttled to 60 requests a minute per address, which takes
[`exposition.ip`](/extensions/exposition/documentation/ip.md) to name the address. Events are
written under `client.<name>`.

Anyone can send anything: a `user` in a payload is what the client said.

## Over MCP

Where the context publishes [MCP](/extensions/exposition/documentation/mcp.md), these are tools:

| tool                                  |                                                                        | role                      |
| ------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `chronicles.query.GET`                | the dialect, the labels with their counts, times and fields, the views | `system:chronicles:query` |
| `chronicles.query.POST`               | one statement: `{ sql }` → `{ columns, rows, truncated }`              | `system:chronicles:query` |
| `chronicles.query.views._name.PUT`    | defines a view: `{ sql, refresh? }`                                    | `system:chronicles:views` |
| `chronicles.query.views._name.DELETE` | drops a view                                                           | `system:chronicles:views` |

`system:chronicles` grants all four.

A query is written in the store's dialect, which `chronicles.query.GET` names. It reads the log and
nothing else, for at most 30 seconds and 10,000 rows; at the rows, it answers what it has and
`truncated: true`. One the store refuses is answered with the code `REFUSED` and the store's own
words in `cause.message`. A view is a statement a query could run. Without `refresh` it is computed
when it is read; with `refresh`, in seconds and at least `3600`, it is computed on that cycle and
read as a table. A name is lowercase letters, digits and underscores, and a context has at most 50
views.

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

|             |                                                  |
| ----------- | ------------------------------------------------ |
| `store`     | the provider that keeps the log, and its address |
| `retention` | days a row of `events` is kept; absent, kept     |
| `ingest`    | the browser route; absent, there is none         |

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
SELECT payload.total, count() FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY 1
SELECT entity, payload FROM states FINAL WHERE label = 'store.orders.snapshot'
```

A view with `refresh` is a refreshable materialized view.
