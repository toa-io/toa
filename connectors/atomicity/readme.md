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
of intervals after a replica joins, restarts or stalls.

## Configuration

Requires Redis.

```yaml
# context.toa.yaml
atomicity:
  redis: redis://redis.example.com    # a string, or a list of cluster nodes
  interval: 5000                      # how often a replica registers, milliseconds
```

One client per process, shared by every atom in it, and an unreachable Redis does not fail a
start.
