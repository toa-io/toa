# Toa Atomicity

Decisions several replicas have to make together, arbitrated by Redis.

Every component has one as `context.atom`, shared by the replicas of that component. Nothing is
declared in the manifest.

## Partitioning

An exclusive claim on one of a fixed number of slots: while a replica holds a slot, no other
replica of the group holds it.

```javascript
const slots = context.atom.slots(128) // [0, 2, 4, …] — or null, owning nothing
```

Returns `null` while this replica owns nothing — at startup, during a rollout, or while Redis is unreachable.

Uses [n-and-i](https://github.com/temich/nandi).

## Metering

Debt the group has run up under each key, in milliseconds. A call adds its own deltas and answers
what the group has reached.

```javascript
const [debt] = await context.atom.meter(['sam'], [1000])
```

Debt drains a millisecond a millisecond, on Redis' clock. Keys belong to the group.

## Outside a component

```javascript
const { Factory } = require('@toa.io/atomicity')

const atom = new Factory().atom('mail.sender')

await atom.connect()
```

## Configuration

Requires Redis.

```yaml
# context.toa.yaml
atomicity:
  redis: redis://redis.example.com    # a string, or a list of cluster nodes
  interval: 5000                      # how often a replica registers, milliseconds
```

`redis://localhost` under `TOA_DEV=1`.

One client per process, shared by every atom in it, and an unreachable Redis does not fail a
start.
