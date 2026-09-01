# Transactional Outbox

A state change and the events it produces commit together. Publication happens off the operation's
path, and what fails to publish is recovered from the database.

## When it applies

Wherever the storage can commit a row atomically with the entity: MongoDB on a replica set or a
sharded cluster. A standalone `mongod` publishes inline and says so at startup. A component with
no declared events takes no transaction.

```yaml
# context.toa.yaml
outbox:
  interval: 5000      # the cycle, in milliseconds
  retention: 86400    # seconds a published row is kept
```

Recovery needs [`atomicity`](/connectors/atomicity) as well. Without it rows are written and
published as they are committed, and the sweep stays suspended.

## The row

One row per state change, in `{collection}_outbox`, written in the entity's transaction:

```js
{
  _id,                  // uuid v7, chronological
  lane,                 // which replica sweeps this row
  published: false,
  pending,              // not swept before this
  event: { origin, state, trailers, input }
}
```

It holds the event, not the messages it renders to: condition and payload bridges run against a
stored event as against a live one.

## The cycle

A committed row is published at once, by the process that wrote it, without the operation waiting.
Its id is held in memory until the next cycle marks it.

Every cycle then does two things, guarded apart so that a publication waiting on a broker cannot
stop the other:

- **marks** what this process published, in one batched write;
- **sweeps** rows that are due, unpublished, and in a lane it owns, skipping those it has sent or
  is sending.

In a healthy system the sweep finds nothing, every cycle: a row is due there only if the process
that wrote it failed to publish or died before marking it.

Publication has no timeout. The broker binding waits for the broker to return rather than failing,
so what bounds the pump is a cap on publications in flight and a bounded drain on shutdown.

### Lanes

A lane says which replica sweeps a row, and nothing else. `LANES` is 128, a constant: rows carry
their lane, so lowering it would leave rows in lanes nobody reads. It is also the ceiling on
replicas of one component.

A replica writes into a lane it owns and marks before it sweeps, so its own rows are already
marked by the time it looks. Ownership is `lane % n === i`, an
[`atomicity`](/connectors/atomicity) slot. While a replica owns none, its sweep is suspended and
resumes when an assignment arrives.

### Timings

`gap` guards a lane changing hands between the write and the mark: the row is written by A and
swept by B, whose cycle is unsynchronised with A's.

```
gap = interval * K
```

| | | |
|---|---|---|
| `interval` | 5 s | One cycle marks, then sweeps. |
| `K` | 3 | Two cycles of separation across a handover, plus one of margin. |
| `gap` | 15 s | Derived. Recovery after a failed publication takes `gap + [0, interval]`. |

Clock skew between the writing replica and whoever inherits its lanes costs an early sweep, which
is a duplicate, or a late one, which is delay.

A replica busy enough to delay its own registration loses its assignment until the next one, so
the sweep is quietest when the process is busiest.

## Guarantees

**At-least-once.** A crash between publishing and marking republishes the event. Receivers see
this from AMQP redelivery regardless, and every event carries `_version`.

**No ordering.** The immediate path races the sweep, and AMQP fanout gives no cross-channel order.

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

Published rows expire by TTL. Unpublished rows have no expiry field and MongoDB's TTL monitor
skips documents that lack one, so a row that never made it out is never reaped.

Two indexes: `{ lane, pending }` over unpublished rows, and a TTL index over the marking timestamp.

## Development

| | |
|---|---|
| `TOA_OUTBOX_DEFER=1` | Skip immediate publication; only the sweep delivers. Announced at startup. |
| `TOA_OUTBOX_INTERVAL` | The cycle in milliseconds, from `outbox.interval`. `gap` follows from it. The feature suite runs at 100 ms. |
| `TOA_ATOMICITY_INTERVAL` | The registration interval, from `atomicity.interval`. The feature suite runs at 150 ms. |

Seeding a row directly is the post-crash state, which is how `features/events/outbox.feature`
tests recovery without a crash. Those scenarios need `atomicity` running.
