# Toa Atomicity

Splits a fixed number of slots across the replicas of a group, exclusively: while a replica holds
a slot, no other replica of that group holds it.

```javascript
const { Factory } = require('@toa.io/atomicity')

const partition = new Factory().partition('mail.sender')

await partition.connect()

const slots = partition.slots(128) // [0, 2, 4, …] — or null, owning nothing
```

`slots(total)` answers with the slots of `0..total` this replica owns, or `null` while it owns
none: after a restart, during a rollout, or while Redis is unreachable. It is answered from memory
and costs nothing to ask, so it can be read on a hot path.

## How it decides

The arithmetic is [n-and-i](https://github.com/temich/nandi). Every replica registers in a Redis
counter once per interval and receives a `{ i, n }` pair — its index and how many there are — once
two consecutive intervals have agreed on it. A replica owns the slots where `slot % n === i`.

Two agreeing intervals is what makes the lease exclusive: a pair that has just changed is not yet
held by the whole group, and taking it up while a replica that has not registered this interval is
still on the old one is what would put two mappings live at once. A replica that has just joined,
stalled or restarted therefore claims nothing until the group has settled, which takes two to
three intervals.

## Configuration

This Redis is system infrastructure rather than a per-component resource — it holds interval
counters and nothing else, one small key per group — so it is declared once for the whole
deployment.

```yaml
# context.toa.yaml
atomicity: redis://redis.example.com    # a string, or a list for a cluster
```

It reaches the runtime as `TOA_ATOMICITY_REDIS`, space-separated for a list.
`TOA_ATOMICITY_INTERVAL` overrides the registration interval, which is 10 seconds by default —
ten to thirty seconds suits most groups, and it wants stability rather than speed.

Without it nothing is owned and `slots` answers `null`. That is not a failure mode to work around
but the answer itself: whoever asks must be able to stand down.

## Invariant

**When in doubt, own nothing.** A replica that cannot prove a slot is its own reports none, and
whoever depends on it stands down until it can. Claiming without an assignment would not be a
degraded version of claiming with one — it would be a different guarantee entirely.

## Diagnostics

The loop reports through the runtime's own console, forked with the group it belongs to, so every
line carries `context.group`. A healthy group never rises above `info`: `warn` means a lease was
lost, `error` that something outside the coordination broke.
