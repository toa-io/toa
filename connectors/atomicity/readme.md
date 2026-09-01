# Toa Atomicity

Decisions several replicas have to make together, arbitrated by Redis.

## Partitioning

An exclusive claim on one of a fixed number of slots: while a replica holds a slot, no other
replica of the group holds it.

```javascript
const { Factory } = require('@toa.io/atomicity')

const atom = new Factory().atom('mail.sender')

await atom.connect()

const slots = atom.slots(128) // [0, 2, 4, …] — or null, owning nothing
```

Returns `null` while this replica owns nothing — at startup, during a rollout, or while Redis is unreachable.

Uses [n-and-i](https://github.com/temich/nandi).

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
