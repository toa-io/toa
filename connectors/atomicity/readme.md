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

## Locking

`routine` runs while no other replica of the group holds `keys`. Acquiring waits for as long as it
takes, and a lease is extended for as long as the routine runs.

```javascript
await context.atom.lock('the ledger', async () => { … })
```

Uses [redlock](https://github.com/mike-marcacci/node-redlock) against one Redis, not a quorum of
independent masters. Mutual exclusion holds while that Redis holds the key: a restart that loses it,
or a failover to a replica that has not received it, can leave two holders. Entity writes do not
rest on this — they have `_version` — so it is a lock for the work, not for correctness.

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
  redis: redis://redis.example.com    # one address
  interval: 5000                      # how often a replica registers, milliseconds
```

`redis://localhost` under `TOA_DEV=1`.

One client per process, shared by every atom in it, and an unreachable Redis does not fail a
start.
