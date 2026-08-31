# Transactional Outbox

A state change and the intent to publish its events commit together, so a process that dies
between the two cannot lose the event.

## The problem

`State` used to write to storage and then publish, as two unrelated operations:

```js
const ok = await this.storage.store(data)

if (ok === true)
  await this.#emission.emit(state.event(input))   // ← crash here and the event is gone
```

Two defects follow. A process that dies, an emitter that throws, or a broker that is unreachable
between the write and the publish leaves the state changed and the event gone, with nothing to
compensate. And the publish is awaited inside the operation — over a confirmed publish of a
persistent message to a durable exchange, which is a network round trip plus a broker fsync — so
a broker stall becomes an operation failure.

With an outbox the operation waits for one transaction and nothing else. The broker leaves the
operation's path entirely.

## When it applies

There is nothing to switch on. A component publishes through the outbox wherever its storage can
commit a row atomically with the entity, and inline where it cannot — the storage answers that
question, and there is no manifest key to disagree with it.

Today it means MongoDB on a replica set or a sharded cluster. A standalone `mongod` cannot run
transactions, so the runtime says so at startup and publishes inline, exactly as it did before this
existed. A component with no declared events has no outbox and takes no transaction at all.

```yaml
# context.toa.yaml
outbox:
  redis: redis://redis.example.com    # a string, or a list for a cluster
  interval: 5000                      # the cycle, in milliseconds
  retention: 86400                    # seconds a published row is kept as a change log
```

Every field is optional, and each reaches the runtime as one environment variable —
`TOA_OUTBOX_REDIS`, `TOA_OUTBOX_INTERVAL`, `TOA_OUTBOX_RETENTION`. What `redis` is for, and what
happens without it, is [below](#partitioning).

## How it works

Every state change writes one row into `{collection}_outbox`, in the same transaction as the
entity:

```js
{
  _id,                  // uuid v7, so _id order is chronological
  lane,                 // which replica sweeps this row
  published: false,
  pending,              // not before this
  event: { origin, state, trailers, input }
}
```

The row holds the **event**, not the messages it renders to. That is what lets a replica publish
a row it did not write: condition and payload bridges run against the row exactly as they run
against a live event.

Three things then happen, in this order:

1. **Immediately.** The process that committed the row publishes it, without the operation
   waiting, and remembers the row id.
2. **On its next cycle.** It marks every id it remembers as published — one batched write for
   many events, rather than a point update per event.
3. **On every cycle.** It looks for rows that are due, unpublished, and in a lane it owns, and
   publishes them.

The two halves of a cycle are guarded apart. A publication waiting on a broker that is down must
not take the marking down with it, so what is stuck is only the reading. That leaves a row that is
unpublished in the database but already sent, or being sent, by this process — and only this
process knows it, so step 3 filters both out before publishing anything.

Nothing has a publication timeout. A publication is a confirmed write to a durable exchange and
the broker binding waits for the broker to return rather than failing; abandoning one would not
stop it, it would only mean the row goes out twice once it lands. What bounds the pump instead is
a cap on how many publications may be in flight at once, and a bounded drain on shutdown.

Step 3 is the safety net. **In a healthy system it finds nothing, every cycle, forever** — a row
is only due there if the process that wrote it failed to publish or died before marking it. Every
timing below follows from that: they are budgeted for how fast a rare failure heals, not for how
fast events flow.

### Lanes

A lane is a label saying which replica sweeps a row. It carries no other meaning, and in
particular **no ordering**.

A replica writes into a lane it already owns. That is what makes the whole thing cheap: a cycle
marks before it sweeps, so by the time a replica looks at one of its own lanes, its own rows are
already marked and there is no race at all. The publisher and the sweeper are the same process
until a lane changes hands.

`LANES` is 128, a constant rather than a setting. Rows carry their lane, so lowering it would
leave rows in lanes nobody reads any more — events unpublished forever, silently. It is also the
ceiling on replicas of one component, and a power of two so that the common replica counts divide
evenly.

### Partitioning

Ownership is `lane % n === i`, and the pair comes from [n-and-i](https://github.com/temich/nandi):
every replica registers in a Redis counter once per interval and receives an exclusive pair once
two consecutive intervals have agreed on it. A replica owns nothing while it holds no pair —
after a restart, during a rollout, or while Redis is unreachable.

This Redis is system infrastructure rather than a per-component resource — it holds nothing but
interval counters, one small key per component — so it is declared once, in the context's `outbox`
section, and reaches the runtime as a single `TOA_OUTBOX_REDIS`.

**While a replica does not know its lanes, its sweep is suspended.** The cycle keeps running and
keeps marking what it published; only the reading half waits, and it resumes by itself the moment
an assignment arrives. Nothing is restarted and nothing is lost — recovery is delayed by exactly
as long as the group takes to agree.

That is the normal state during a rebalance. A replica joining or leaving costs about an interval
in which nobody holds a pair, and the group settles a couple of intervals later. It is also the
state without `TOA_OUTBOX_REDIS` at all, or while Redis is unreachable: rows are still written and
still published as they are committed, and what fails to publish waits for an owner.

The connector's invariant follows: *when in doubt, own nothing*. Sweeping without an assignment
would not be a degraded version of sweeping with one — it would be a different guarantee, where
every replica publishes every stranded row. A pause is recoverable; uncoordinated publication is
not.

The second thing partitioning buys is the reason a lane is chosen at write time at all: a replica
writes into a lane it owns, so it marks its own rows before it ever sweeps them.

What the loop is doing is reported through the runtime's own logger, at `debug` while a group is
healthy and `info` when a lease is granted or lost — registration round trips, pair agreement, and
the clock skew between the replica and Redis. Anything above `info` means the group is not
healthy: `warn` that a lease was lost, `error` that something outside the coordination broke.

### Timings

`gap` is not a steady-state necessity. It guards the case where a lane changes hands between the
write and the mark: the row was written by A and is swept by B, whose cycle is unsynchronised with
A's. For B not to republish it, A needs its mark in before B's first eligible sweep, which is one
full interval in the worst case.

```
gap = interval * K
```

| | | |
|---|---|---|
| `interval` | 5 s | One cycle marks, then sweeps. In steady state the sweep's query returns nothing and the cycle costs one indexed lookup. |
| `K` | 3 | Two cycles of separation across a handover, plus one of margin. It costs nothing in the normal case, where nothing is ever swept. |
| `gap` | 15 s | Derived. Recovery after a failed publish takes `gap + [0, interval]`. |
| nandi's interval | 10 s | This one wants stability, not latency: standing down only pauses recovery, so a rollout delays nothing in normal operation. |

Clock skew between the writing replica and whoever inherits its lanes costs an early sweep (a
duplicate) or a late one (delay), never a loss.

## Guarantees

**At-least-once.** A crash between publishing and marking republishes the event. This is not a new
burden: AMQP redelivery already means a receiver can see a message twice, and every event carries
`_version`.

**No ordering.** The immediate path races the sweep, and AMQP fanout gives no cross-channel order
regardless. Lanes do not change this.

**Events are never dropped.** A publication that fails is swallowed: the row stays as it is and a
later cycle sends it again. Every row of a batch is given its chance rather than the batch
stopping at the first refusal, and what the broker took is marked while what it refused comes
back. There is no attempt counter and no backoff, deliberately: the failure that dominates is a
broker being down, where flat retry is what you want and backoff would delay recovery exactly when
the broker comes back.

**Recovery needs coordination.** Without an assignment the sweep is suspended, so what fails to
publish is not merely slower to arrive — it waits. The rows are durable and visible throughout,
and they go out when an assignment returns. An outbox running without `TOA_OUTBOX_REDIS` says so
at startup.

## The event

```js
{ origin, state, trailers, input }
```

| | |
|---|---|
| `origin` | the pre-image; `null` when the entity did not exist before |
| `state` | the new record |
| `trailers` | out-of-band values the algorithm wrote into `state._trailers` |
| `input` | the operation's input |

Two changes came with the outbox.

**`changeset` is gone.** With `origin` and `state` both present it was a third copy of the same
data. Use `origin` and `state`.

**An assignment now carries `origin`.** It never did before, because `upsert` was a blind
`findOneAndUpdate`; it now takes the pre-image from its own write and computes the post-image from
it, so a condition or payload bridge can finally tell what an assignment changed. Only `trailers`
is absent there, and necessarily so — there is no entity object for an algorithm to hang them on.

> **`trailers` values must be serializable.** A row goes through the database, so whatever an
> algorithm puts in `_trailers` has to survive the round trip. `Entity.event` copies the bag onto
> the event as an ordinary field, which is what makes a stored event as complete as a live one.

One consequence worth knowing: a payload bridge that throws takes down the publication of every
event of that row, because they are published together. The row stays unpublished and is retried
every cycle, complaining each time. That is a code bug in the bridge, and it is loud rather than
silent — the event is not lost, and it goes out once the fix is deployed.

## Operating

The collection is a change log and a dead-letter queue at once.

```js
db.tea_pots_outbox.find({ published: false }).sort({ _id: 1 })   // what is stuck, oldest first
```

Published rows are kept for a day and then expire by TTL. Unpublished rows have no expiry field,
and MongoDB's TTL monitor skips documents that lack one, so **a row that never made it out is
never reaped**.

Two indexes are maintained on the collection: `{ lane, pending }` over unpublished rows only, so
it stays at in-flight size, and a TTL index over the marking timestamp.

## Development

The mechanism is dormant when everything works, so it needs a way to suppress the happy path.

| | |
|---|---|
| `TOA_OUTBOX_DEFER=1` | Skip immediate publication; only the sweep delivers. This is what makes the sweep, `gap` and recovery observable at all, and it doubles as a kill switch if the immediate path ever misbehaves. It is announced at startup rather than applied silently. |
| `TOA_OUTBOX_INTERVAL` | The cycle in milliseconds — configuration rather than a switch, set from the context's `outbox.interval`. `gap` follows from it, so one value moves both. The feature suite runs at 100 ms. |
| `TOA_OUTBOX_PARTITION_INTERVAL` | Override the registration interval, 10 seconds by default. A replica owns nothing until two consecutive intervals have agreed on its pair, so recovery is not observable before then. The feature suite runs at 150 ms. |

Seeding a row directly *is* the post-crash state — the entity was written, the event was not sent,
and nothing but the sweep is left to send it — which is how `features/events/outbox.feature` tests
recovery without a crash. Those scenarios need coordination running, because a replica that holds
no assignment sweeps nothing.

## A teardown race it uncovered

Publishing after the reply means an event can be delivered while its consumer's composition is
already tearing down — which synchronous publication had made unreachable. Two things in the
runtime were not ready for it, and both are fixed:

A receiver turns a delivery into a call to an operation of its own component, served by that
component's producers. Those producers shared a broker communication with the receiver, and
sealing one seals every consumer on it at once — so a receiver sealed the request serving that its
own drain was waiting for, and shutdown deadlocked. Receivers now pool apart from producers: they
still stop consuming together, but neither seals what the other needs.

The producers were also siblings of the receiver under the composition, torn down alongside it.
A receiver is now torn down before them, so a delivery still draining has something to call.

## Why it is built this way

**No switch.** Whether a row can be committed with the entity is a property of the deployment, not
a preference: where it can, publishing inline is strictly worse, and where it cannot, a flag
asking for it could not be honoured. So the storage answers and nothing overrides it.

**In core, not an extension.** Extensions decorate the runtime; they cannot own a transaction
boundary, and core must not depend on one.

**Core builds the row, the storage only writes it.** Everything about a row — its id, its lane,
when it becomes due — is outbox policy. The storage's job is to insert it inside the transaction
it already owns, and, for an assignment, to fill in the two fields core cannot know before the
write. The row travels *into* the write because that is the entire point: writing it afterwards
would be two writes with a crash window between them, which is the defect being fixed.

**No render before the write.** Condition and payload bridges are userland code and run where they
have always run — after the write succeeded. A transition retries up to 32 times on a lost
compare-and-swap, and no bridge runs on a failed attempt.

**No claim token and no lease.** A lane has exactly one owner, and a replica that is not certain
of its own lanes does not read at all — so there is nothing for a claim to arbitrate. The
guarantee is carried by the assignment rather than by a per-row token, which is why the sweep is
a single query.

## Costs and known gaps

- **The transaction.** A commit becomes a multi-document transaction instead of one
  `findOneAndReplace`. It was expected to cost, and on the one workload measured so far it does
  not: `features/operations/stream.feature` — 2000 transitions against a local replica set and
  broker — runs in about 15.5 s with the outbox and 16.4 s without. The transaction is dearer, and
  the operation no longer waits for a confirmed publish of a persistent message; on that shape of
  work the two cancel. One workload on one machine is not a benchmark: read it as evidence that
  the cost is not obviously large, not as a claim that it is free.
- **Trailers must be serializable.** A new constraint, currently satisfied everywhere, and the
  assumption the row rests on.
- **Ordering is not guaranteed**, before or after this change.
- **Large events.** One row holds `origin`, `state` and `input`. A 1 MB entity gives a ~2 MB row
  against the 16 MB BSON limit.
- **Retention.** Keeping published rows means the collection holds a log of everything the
  component ever emitted for the retention window, plus a second index and a TTL reaper pass every
  minute. That is the price of the change log; `retention: 0` degenerates to deleting on marking.
- **A lease flaps under load.** A replica busy enough to delay its own registration past its slot
  loses the lease and stands down until the next one, which pauses recovery — visible in the
  2000-transition run at the 150 ms interval the feature suite uses. At the production interval of
  ten seconds it takes a very long stall to matter, and standing down is the safe direction, but
  it is worth knowing the sweep is quietest exactly when the process is busiest.
- **Pre-existing, out of scope:** [`Storage.ensure`](connectors/storages.mongodb/src/storage.js:218)
  returns `null` when the record it found is deleted, and
  [`State.ensure`](runtime/core/src/state.js:71) dereferences `record.id` on it.
