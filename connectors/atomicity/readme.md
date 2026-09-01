# Toa Atomicity

What several replicas must agree on, done atomically in one place.

These are the decisions processes cannot arrange by talking to each other: they need a single
arbiter and a step that is indivisible from its point of view. They are small, they are hot, and
they are wrong the moment two replicas each get their own answer.

Redis is that arbiter. What lives here is a script or a counter it runs on the server, so the
decision is made once and the replicas only read it back.

Today that is **partitioning**. Shared rate metering, which lives in
[`stash`](/extensions/stash#shared-rate-metering) for now, belongs here too.

## Partitioning

An exclusive claim on one of a fixed number of slots: while a replica holds a slot, no other
replica of that group holds it.

```javascript
const { Factory } = require('@toa.io/atomicity')

const atom = new Factory().atom('mail.sender')

await atom.connect()

const slots = atom.slots(128) // [0, 2, 4, …] — or null, owning nothing
```

An atom is what one group decides together: replicas find each other by the group name and by
nothing else. `slots` is the first of its decisions, and the others will sit beside it.

`slots(total)` answers with the slots of `0..total` this replica owns, or `null` while it owns
none: after a restart, during a rollout, or while Redis is unreachable. It is answered from memory
and costs nothing to ask, so it can be read on a hot path.

### How it decides

The arithmetic is [n-and-i](https://github.com/temich/nandi). Every replica registers in a Redis
counter once per interval and receives a `{ i, n }` pair — its index and how many there are — once
two consecutive intervals have agreed on it. A replica owns the slots where `slot % n === i`.

Two agreeing intervals is what makes the claim exclusive: a pair that has just changed is not yet
held by the whole group, and taking it up while a replica that has not registered this interval is
still on the old one is what would put two mappings live at once. A replica that has just joined,
stalled or restarted therefore claims nothing until the group has settled, which takes two to
three intervals.

`TOA_ATOMICITY_INTERVAL` overrides the interval, which is 10 seconds by default. Ten to thirty
seconds suits most groups: it wants stability rather than speed, and a shorter one buys nothing
but churn.

### When in doubt, own nothing

A replica that cannot prove a slot is its own reports none, and whoever depends on it stands down
until it can. Claiming without an assignment is not a degraded version of claiming with one — it
is a different guarantee entirely, and callers are written against the strong one.

## Configuration

This Redis is system infrastructure rather than a per-component resource — it holds what the
decisions need and nothing else, a small key apiece — so it is declared once for the whole
deployment.

```yaml
# context.toa.yaml
atomicity: redis://redis.example.com    # a string, or a list for a cluster
```

It reaches the runtime as `TOA_ATOMICITY_REDIS`, space-separated for a list. One client is opened
per process and shared by everything here.

## Availability

**One address is one server.** Its availability is whatever the address points at — a service, a
sentinel-backed endpoint, a managed one — and the client reconnects to it for as long as it takes.

**Several addresses are a cluster**, and the reason to accept one is deployment, not scale. There
is nothing here to shard. But a deployment that already runs Redis Cluster has no standalone
instance to point at, and a cluster cannot be reached with a plain client — the keys would answer
`MOVED`. So the client is a cluster client when given more than one address, and routes to
whichever node holds the key. Keys carry a hash tag, so those a single decision touches land in
one slot and are never cross-slot.

Availability, either way, is the endpoint's own. A cluster promotes a replica when a master goes;
a sentinel-backed address moves; a managed service does whatever it does. This connector arranges
none of it and does not need to.

**Unreachable reads exactly like unconfigured.** Nothing is decided, and whoever asked stands
down. Connecting is therefore not awaited and a failure to connect is not an error: a process that
could not start because coordination was down would be the opposite of standing down. A Redis that
comes up later is picked up on its own, with nothing restarted.

What is deliberately absent is a quorum over independent stores, the way a distributed lock is
built. What this hands out is an exclusive answer, and one that two stores could disagree about
would be worse than no answer at all — so it lives in one place, and losing that place loses the
answer rather than splitting it.

## Diagnostics

Everything here reports through the runtime's own console, forked with the group it belongs to, so
every line carries `context.group`. A healthy group never rises above `info`: `warn` means a claim
was lost, `error` that something outside the coordination broke.
