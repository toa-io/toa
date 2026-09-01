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

## Availability

**One address is one server.** Its availability is whatever the address points at — a service, a
sentinel-backed endpoint, a managed one — and the client reconnects to it for as long as it takes.

**Several addresses are a cluster**, and the reason to accept one is deployment, not scale. There
is nothing here to shard: a group is one small key, written once per replica per interval. But a
deployment that already runs Redis Cluster has no standalone instance to point at, and a cluster
cannot be reached with a plain client — the keys would answer `MOVED`. So the client is a cluster
client when given more than one address, and routes to whichever node holds the group. A hash tag
is what makes that safe: a group's keys land in one slot, so the two a registration touches are
never cross-slot.

Availability, either way, is the endpoint's own. A cluster promotes a replica when a master goes;
a sentinel-backed address moves; a managed service does whatever it does. This connector arranges
none of it and does not need to.

**Unreachable reads exactly like unconfigured.** Nothing is owned, `slots` answers `null`, and
whoever asked stands down. Connecting is therefore not awaited and a failure to connect is not an
error: a process that could not start because coordination was down would be the opposite of
standing down. A Redis that comes up later is picked up on its own, with nothing restarted.

What is deliberately absent is a quorum over independent stores, the way a distributed lock is
built. What this hands out is an exclusive claim, and a claim that two stores could disagree about
would be worse than no claim at all — so it lives in one place, and losing that place loses the
claim rather than splitting it.

## Invariant

**When in doubt, own nothing.** A replica that cannot prove a slot is its own reports none, and
whoever depends on it stands down until it can. Claiming without an assignment would not be a
degraded version of claiming with one — it would be a different guarantee entirely.

## Diagnostics

The loop reports through the runtime's own console, forked with the group it belongs to, so every
line carries `context.group`. A healthy group never rises above `info`: `warn` means a lease was
lost, `error` that something outside the coordination broke.
