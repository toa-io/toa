# Toa Chronicles

A log of what happens in a context, kept in [ClickHouse](https://clickhouse.com), and read over the
gateway's [MCP](/extensions/exposition/documentation/mcp.md).

Three things write to it: the committed changes of a component, as the events it names render
them; facts an operation sends; and what browsers send to the ingestion route. Each arrives as a
row of one table, `events`.

## Changes

```yaml
# manifest.toa.yaml
chronicles: [created, paid, snapshot]
```

Each label is an event of the component — its own, or the prototype's `created`, `updated`,
`deleted` and `sync`. A change is written as the event renders it: where the event's `condition`
does not hold, nothing is written for it; where it has a `payload`, what the payload returns is
what is written. A field a payload leaves out does not reach ClickHouse.

An event that exists for the log alone is an event file like any other, and nothing has to
consume it:

```typescript
// events/snapshot.ts
export function payload(event: Event) {
  const { email, address, ...rest } = event.state

  return rest
}
```

`sync` is the record as it stands, every field of it.

A committed change is written whether or not the broker or ClickHouse is up when it is committed,
and is written once however often it is delivered: a query reads `events` with `FINAL`.

## Facts

```typescript
await context.chronicles.send('searched', { query: input.query, results: results.length })
```

`send` resolves once the broker has the message and rejects where it does not. Nothing retries
it, so a fact that must not be lost is a state change instead.

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
batch. The route is anonymous and throttled to 60
requests a minute per address, which takes [`exposition.ip`](/extensions/exposition/documentation/ip.md)
to name the address. Events are written under `client.<name>`.

Anyone can send anything: a `user` in a payload is what the client said.

## The log

| column      |                                                                         |
| ----------- | ----------------------------------------------------------------------- |
| `id`        | the same however often a message is delivered                           |
| `label`     | `<component>.<event>`, `<component>.<name>` for a fact, `client.<name>` |
| `component` | the component that wrote it; `chronicles.ingest` for a browser          |
| `time`      | when it happened                                                        |
| `received`  | when ClickHouse wrote it                                                |
| `entity`    | the id of the record that changed; `NULL` for a fact and a browser      |
| `version`   | the record's `VERSION`; `NULL` likewise                                 |
| `trace`     | the traceparent of the call that caused it                              |
| `payload`   | `JSON`                                                                  |

`states` holds the latest `payload` of each record under each label, by `version`: under a label
like `snapshot`, the record as it stands.

```sql
SELECT payload.total, count() FROM events FINAL WHERE label = 'store.orders.paid' GROUP BY 1
SELECT entity, payload FROM states FINAL WHERE label = 'store.orders.snapshot'
```

Nothing is ordered: order by `time`, or by `version` within one record.

## Over MCP

Where the context publishes [MCP](/extensions/exposition/documentation/mcp.md), these are tools:

| tool                                  |                                                                      | role                      |
| ------------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| `chronicles.query.GET`                | the labels, their counts and times, their payloads' paths, the views | `system:chronicles:query` |
| `chronicles.query.POST`               | one `SELECT`: `{ sql }` → `{ columns, rows, truncated }`             | `system:chronicles:query` |
| `chronicles.query.views._name.PUT`    | defines a view: `{ sql, refresh? }`                                  | `system:chronicles:views` |
| `chronicles.query.views._name.DELETE` | drops a view                                                         | `system:chronicles:views` |

`system:chronicles` grants all four.

A query reads the context's database and nothing else, for at most 30 seconds and 10,000 rows;
at the rows, it answers what it has and `truncated: true`. It leaves `FORMAT` out: the answer is
JSON. One ClickHouse refuses is answered with the code `REFUSED` and ClickHouse's own words in
`cause.message`. A view is a `SELECT` a query could
run. Without `refresh` it is computed when it is read; with `refresh`, in seconds and at least
`3600`, it is computed on that cycle and read as a table. A name is lowercase letters, digits and
underscores, and a context has at most 50 views.

## Deployment

```yaml
# context.toa.yaml
chronicles:
  broker: amqp://rabbitmq.example.com
  clickhouse: https://ch.example.com:8443/shop
  retention: 730
  ingest: true
```

|              |                                                                       |
| ------------ | --------------------------------------------------------------------- |
| `broker`     | one RabbitMQ broker, where components publish and ClickHouse consumes |
| `clickhouse` | its HTTP address; the path names the database                         |
| `retention`  | days a row of `events` is kept; absent, kept                          |
| `ingest`     | the browser route; absent, there is none                              |

```shell
$ toa conceal chronicles-broker username=… password=…
$ toa conceal chronicles-clickhouse username=… password=… reader=…
```

The ClickHouse user provisions the database when the service `chronicles-scribe` starts, so it
needs `CREATE`, `access_management` and `named_collection_control`; a database that does not exist
is created. It creates `<database>_reader`, the
user queries run as, with `reader` as its password.

Where ClickHouse reaches the broker at another address than the components do:

```yaml
chronicles:
  broker: amqp://localhost:5672
  clickhouse:
    url: http://localhost:8123/shop
    broker: amqp://rabbitmq:5672
```

### What ClickHouse could not write

A message ClickHouse fails to write is kept on the broker, in the queue `chronicles.dead`, rather
than dropped. Once the cause is fixed, move them back to the
queue `chronicles` — with a [shovel](https://www.rabbitmq.com/docs/shovel), or the management UI's
_Move messages_.
