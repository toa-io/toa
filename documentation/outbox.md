# Transactional Outbox

A state change and the events it produces commit together. Publication happens off the operation's
path, and what fails to publish is recovered from the database.

## When it applies

Wherever the storage can commit a row atomically with the entity: MongoDB on a replica set or a
sharded cluster. A standalone `mongod` publishes inline and says so at startup.

Only for a component whose events something consumes. A component none of whose events are
consumed takes no transaction, and its `{collection}_outbox` is never created. See
[events](/documentation/component/declaration.md#events).

```yaml
# context.toa.yaml
outbox:
  interval: 5000      # the cycle, in milliseconds
  batch: 200          # rows one read brings back
  retention: 86400    # seconds a published row is kept
```

Recovery needs [`atomicity`](/connectors/atomicity) as well. Without it rows are written and
published as they are committed, and the pump reads nothing.

## The row

One row per state change, in `{collection}_outbox`, written in the entity's transaction:

```js
{
  _id,                  // uuid v7, chronological
  lane,                 // which replica pumps this row
  published: false,
  pending,              // not swept before this
  event: { origin, state, trailers, input }
}
```

It holds the event, not the messages it renders to: condition and payload bridges run against a
stored event as against a live one.

## The pump

A committed row is published at once, by the process that wrote it, without the operation waiting.
Its id is held in memory until a cycle marks it.

One cycle at a time, the pump:

1. **reads** a page of rows that are due, unpublished, and in a lane it owns, skipping those this
   process has sent or is sending, and reads on while a page comes back full;
2. **publishes** them, every one of them, whatever the broker refuses;
3. **marks** what it published, together with what the immediate path published since the last
   cycle, in one batched write.

In a healthy system step 1 answers with nothing, every cycle: a row is due only if the process
that wrote it failed to publish or died before marking it.

Publication has no timeout. The broker binding waits for the broker to return rather than failing,
so what bounds the pump is a cap on publications in flight and a bounded drain on shutdown.

### Lanes

A lane says which replica pumps a row, and nothing else. `LANES` is 128, a constant: rows carry
their lane, so lowering it would leave rows in lanes nobody reads. It is also the ceiling on
replicas of one component.

A replica writes into a lane it owns, so what it reads back is its own. Ownership is
`lane % n === i`, an [`atomicity`](/connectors/atomicity) slot. While a replica owns none it reads
nothing, and resumes when an assignment arrives.

### Timings

`gap` guards a lane changing hands between the write and the mark: the row is written by A and
swept by B, whose cycle is unsynchronised with A's.

```
gap = interval * K
```

| | | |
|---|---|---|
| `interval` | 5 s | One cycle reads, publishes and marks. |
| `K` | 3 | Two cycles of separation across a handover, plus one of margin. |
| `gap` | 15 s | Derived. Recovery after a failed publication takes `gap + [0, interval]`. |

Clock skew between the writing replica and whoever inherits its lanes costs an early read, which
is a duplicate, or a late one, which is delay.

A replica busy enough to delay its own registration loses its assignment until the next one, so
the pump reads least when the process is busiest.

## Guarantees

**At-least-once.** A crash between publishing and marking republishes the event. Receivers see
this from AMQP redelivery regardless, and every event carries `_version`.

**No ordering.** The immediate path races the pump, and AMQP fanout gives no cross-channel order.

**Nothing is dropped.** A failed publication leaves the row as it is and a later cycle sends it
again. Every row of a batch is attempted; there is no attempt counter and no backoff.

## The event

```js
{ origin, state, trailers, input }
```

| | |
|---|---|
| `origin` | the pre-image; `null` when the entity did not exist |
| `state` | the new record |
| `trailers` | what the algorithm wrote into `state._trailers` |
| `input` | the operation's input |

An assignment carries `origin` too, and no `trailers` — there is no entity object to hold them.

> **`trailers` values must be serializable.** A row goes through the database.

A payload bridge that throws takes down the publication of every event of that row: they are
published together. The row stays unpublished and is retried every cycle.

One row holds `origin`, `state` and `input`, so a 1 MB entity gives a ~2 MB row against the 16 MB
BSON limit.

## Operating

The collection is a change log and a dead-letter queue at once.

```js
db.tea_pots_outbox.find({ published: false }).sort({ _id: 1 })   // what is stuck, oldest first
```

A published row carries `publishedAt` and expires by TTL. An unpublished row has no `publishedAt`,
and MongoDB's TTL monitor skips documents that lack one, so a row that never made it out is never
reaped.

Two indexes: `{ lane, pending }` over unpublished rows, and a TTL index over `publishedAt`.

## Development

| | |
|---|---|
| `TOA_OUTBOX_DEFER=1` | Skip immediate publication; only the pump delivers. Announced at startup. |
| `TOA_OUTBOX_INTERVAL` | The cycle in milliseconds, from `outbox.interval`. `gap` follows from it. The feature suite runs at 100 ms. |
| `TOA_OUTBOX_BATCH` | Rows one read brings back, from `outbox.batch`. |
| `TOA_EVENTS_<NS>_<NAME>` | The component's events that something consumes, space-separated. Absent, every event is published. |
| `TOA_ATOMICITY_INTERVAL` | The registration interval, from `atomicity.interval`. The feature suite runs at 150 ms. |

Seeding a row directly is the post-crash state, which is how `features/events/outbox.feature`
tests recovery without a crash. Those scenarios need `atomicity` running.
