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

Redis being down is not an error here. Connecting is not awaited, so it cannot fail a start, and
while it is unreachable nothing is owned and callers stand down. It is picked up again on its own.

## Diagnostics

Reported through the runtime's console, forked with the group, so every line carries
`context.group`.
