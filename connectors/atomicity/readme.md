# Toa Atomicity

Decisions several replicas have to make together, arbitrated by Redis.

Today that is **partitioning**. Shared rate metering, which lives in
[`stash`](/extensions/stash#shared-rate-metering) for now, belongs here too.

## Partitioning

An exclusive claim on one of a fixed number of slots: while a replica holds a slot, no other
replica of the group holds it.

```javascript
const { Factory } = require('@toa.io/atomicity')

const atom = new Factory().atom('mail.sender')

await atom.connect()

const slots = atom.slots(128) // [0, 2, 4, …] — or null, owning nothing
```

An atom is what one group decides together; replicas find each other by the group name and by
nothing else.

`slots(total)` is answered from memory, so it is free to ask on a hot path. It returns `null`
while this replica owns nothing — at startup, during a rollout, or while Redis is unreachable —
and a caller has to be able to stand down rather than assume.

The scheme is [n-and-i](https://github.com/temich/nandi)'s. Nothing is owned for the first couple
of intervals after a replica joins, restarts or stalls. `TOA_ATOMICITY_INTERVAL` sets the
interval, 10 seconds by default.

## Configuration

Requires Redis.

```yaml
# context.toa.yaml
atomicity: redis://redis.example.com    # a string, or a list of cluster nodes
```

`TOA_ATOMICITY_REDIS` at runtime, space-separated for a list. One client per process, shared by
every atom in it.

Several addresses are a cluster. Nothing here needs sharding, but a deployment that already runs
one has no standalone instance to point at, and a cluster cannot be reached with a plain client.

A cluster does not spread a group, though: its keys share a hash tag and so live in one slot, on
one master. Lose that master and the cluster promotes its replica, after which the group carries
on; lose it with no replica and that group owns nothing until the slot is back, while groups on
other nodes are unaffected. Either way what a lost node costs is standing down.

There is no quorum over independent stores: an exclusive answer that two of them could disagree
about would be worse than no answer.

Connecting is not awaited and a failure to connect is not an error — unreachable reads exactly
like unconfigured, and a Redis that comes up later is picked up on its own.

## Diagnostics

Reported through the runtime's console, forked with the group, so every line carries
`context.group`.
