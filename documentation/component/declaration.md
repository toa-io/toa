# Component Declaration

## Entity

A stored component declares what it stores. `storage` names the connector and defaults to
`@toa.io/storages.mongodb`.

```yaml
# manifest.toa.yaml
entity:
  properties:
    title: { type: string }
    brewed: { type: integer }
    booked: { type: boolean }
  required: [title]
  blank:
    booked: false
```

`required` names the properties a stored record has. `blank` is what a record holds before
anything is written to it — it need not be whole, but each value must fit the property it names,
and it is read once, when the component boots.

A record carries `CREATED`, `UPDATED`, `VERSION` and `DELETED` besides what is declared. None of
the five may be named in `blank`, and none but `id` may be declared in `properties` — they are the
runtime's to write, and a component that states one is refused:

```
System property 'DELETED' cannot be overridden
```

### Moments

**A property declared as a moment is stored as a date**, so that an index sorts, compares and
reaps by it rather than by text or by a number that happens to be one — which is what a `ttl`
index needs. Two ways to say it, differing in what your code holds rather than in what is stored:

```yaml
entity:
  properties:
    starts: { type: string, format: date-time } # an ISO 8601 string
    expires: { type: integer, format: epoch-millis } # what Date.now() answers
```

`epoch-millis` is a moment and not a duration, which is the other thing a number of milliseconds
is: an interval or a timeout declared with it would be stored as a date in 1970 and reaped by any
`ttl` over it. The system timestamps — `CREATED`, `UPDATED`, `DELETED` — are `epoch-millis`, so a
retention policy is a `ttl` on `DELETED` and needs nothing declared for it:

```yaml
- index:
    name: index_deleted
    keys: { DELETED: asc }
    ttl: 2592000 # a tombstone is kept thirty days
```

A record still in use has `DELETED: null`, and the TTL monitor passes over a field that is not a
date, so nothing live is reaped by that.

The value an operation writes and reads is what was declared, on any storage. Only a property of
the record itself is stored this way: a `date-time` nested in an object or in the items of an
array is an ordinary JSON Schema format, validated and stored as the string it was written as.

**Adding the format to a property that already holds data needs a migration.** MongoDB compares
by type before value, so a date and the string or number a record was written with match nothing
rather than raising, and a collection holding both sorts every number ahead of every date.
Convert what is there in the same release, and stop the deployment first:

```yaml
- update:
    filter: { expires: { $type: number } }
    update:
      - $set: { expires: { $toDate: { $toLong: '$expires' } } }
```

### Migrations

Indexes and data changes are files in the component's `migrations` directory, written as YAML or
JSON. The file name without its extension is the migration's id, and sorting those ids is the
order they are applied in — so name them to sort:

```
migrations/
  0001-indexes.yaml
  0002-brewed-defaults-to-zero.yaml
```

A file is a list of steps, applied in the order they are written:

```yaml
# migrations/0001-indexes.yaml
- index:
    name: unique_title
    keys: { title: asc }
    unique: true
```

```yaml
# migrations/0002-brewed-defaults-to-zero.yaml
- update:
    filter: { brewed: { $exists: false } }
    update: { $set: { brewed: 0 } }
```

What a step may say, for MongoDB:

| Step        | Fields                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `index`     | `name`, `keys` — a property to `asc`, `desc`, `hash` or `text` — and any of `unique`, `sparse`, `partial`, `ttl` |
| `dropIndex` | `name`                                                                                                           |
| `update`    | `filter`, and `update` as an object or as a list to run as an aggregation pipeline                               |
| `delete`    | `filter`, where `{}` means every record                                                                          |

An index whose name is already taken by one of another shape is dropped and made again, so
changing what an index is made of is an edit to its declaration.

Nothing is ever hard-deleted: a terminated record stays as a tombstone, and every read filters
it out with `DELETED: null`. No index carries that unless it says so, which matters most for a
**unique** index — without it a tombstone holds its key for good and the value can never be used
again:

```yaml
- index:
    name: unique_title
    keys: { title: asc }
    unique: true
    partial: { DELETED: null }
```

The same filter keeps tombstones out of an ordinary index, where it is a question of how much
the index holds rather than of what the component can do.

**A migration is applied once for the database** — not once per replica, not once per start —
and never again. An index dropped by hand is not made again; write another migration.

**A migration must be idempotent.** A replica that dies while applying one has it applied again
from its first step by whichever replica takes it over.

**A migration runs before the component serves**, and every other replica waits for it. A
backfill over a large collection belongs in an operation something calls, not here.

**A migration lands while the version before it is still serving.** The first replica to start
applies it, and every replica of the release before it goes on reading the collection it changed.
Where that release can still read what the migration leaves, a rolling update is fine. Where it
cannot — a rename, a field that changes meaning — the deployment stops first: scale it to zero,
deploy, and say so wherever the upgrade is written down.

**Migrations are inherited.** A prototype's migrations are applied to the collection of every
component that takes it, ahead of the component's own, and recorded as `<prototype>:<id>` — so a
prototype that declares migrations has a `name`. The system properties are the runtime's, and so
are their migrations: what `id`, `VERSION`, `CREATED`, `UPDATED` and `DELETED` are held as is
converted by the runtime's own, recorded as `system:<id>`, and a component declares nothing for
them. An index over one of them is declared like any other.

Only `@toa.io/storages.mongodb` applies migrations, and a step is written in its dialect. A
component that declares them against another storage does not start:

```
Component 'pots.pot' declares migrations, which storage '@toa.io/storages.null' does not apply
```

## Operations

An operation may state what it is.

```yaml
operations:
  enumerate:
    description: Every pot that is brewing, newest first.
    type: observation
    scope: objects
```

It is written above the endpoint in the component's generated types, answered by the exposition's
[`OPTIONS`](/extensions/exposition/documentation/introspection.md), and carried by the
[introspection map](/extensions/introspection).

## Events

An event is published where something consumes it: a receiver of another component of the context,
a [realtime](/extensions/realtime) route, or an entry in the context's `events`.

```yaml
# context.toa.yaml
events:
  - store.orders.created # consumed outside this context
```

An event nothing consumes has no exchange and no [outbox](/documentation/outbox.md) row, and a
component none of whose events are consumed has no outbox at all.

Deployment states this per component in `TOA_EVENTS_<NS>_<NAME>`. Without a deployment — a local
run, `toa mono`, a composition booted in a test — every event is published.

## Receivers

Receivers are bound to event labels using the `receivers` declaration section.

### Domestic Events

The following syntax binds a receiver to the `created` event emitted by the `orders` component of
the`store` namespace, with the processing operation `transit`:

```yaml
# manifest.toa.yaml
receivers:
  store.orders.created: transit
```

### Foreign Events

Domestic event declarations don't specify the bindings used to emit those events, so they will be
resolved by UI Discovery at startup. Therefore, events emitted by external applications that don't
support UI Discovery must have a binding declaration.

```yaml
# manifest.toa.yaml
receivers:
  external.orders.created:
    binding: amqp # avoid discovery
    operation: transit
```

This declaration requires that the Context must have the `external.orders` AMQP Pointer to resolve
the address of the broker to connect to.

### Event Sources

An arbitrary event label can be bound to a receiver with the following syntax:

```yaml
# manifest.toa.yaml
receivers:
  something_happened:
    binding: amqp
    source: import # AMQP Pointer annotation group in the Context
    operation: transit
  something_else_happened:
    binding: amqp
    source: import # consume from the same broker as previous
    operation: transit
```

As the event label doesn't conform to the standard event label format, UI Discovery can't resolve
the broker address to connect to. For this purpose, a `source` property must be declared with the
value corresponding to the Pointer group that must be defined in the Context.

> Declarations conforming the standard event label format implicitly define `source`
> as `{namespace}.{name}`.

## Cadence

An operation of the component is called on a cadence, with no schedule stored anywhere:

```yaml
# manifest.toa.yaml
cadence:
  sweep:
    cycle: 86400 # seconds one whole cycle takes
    intervals: 24 # what it is split into, so one call an hour
```

The operation receives `{ n, i }` — the number of intervals in the cycle, and which of them this
call is for. `intervals` defaults to `1`, which is also what the shorthand declares:

```yaml
# manifest.toa.yaml
cadence:
  sweep: 3600 # once an hour
```

`context.delay`, which hands one call over to be made later, comes with the extension. A
component that only delays calls names it and states nothing:

```yaml
# manifest.toa.yaml
cadence: ~
```

See [Cadence](/extensions/cadence) for what is and is not guaranteed.
