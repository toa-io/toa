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

### Being told

`slots` answers whoever asks. A consumer that asks rarely — once an hour, say — samples one
moment, and a rollout passing through that moment costs it the whole hour. `onassigned` tells it
instead.

```javascript
const off = atom.onassigned((assignment) => { … }) // { i, n } — or null, owning nothing
```

Called with the assignment this replica holds, and again whenever it changes: one arrived, was
lost, or the group resized. A change and not a heartbeat — a group that stays as it is never
calls back. It is called once as it is added, with the assignment as it stands, so a listener
arriving after the group settled is not left waiting for something that has already happened.

The answer removes the listener. A listener that raises ends the loop it was told through, and
that loop is what keeps this replica registered — so this replica owns nothing from that moment,
`slots` answers `null`, and it stands down. What to do about the exception is the runtime's;
nothing here catches it.

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

Uses [redlock](https://github.com/sesamecare/redlock). The key is written to every address and a
majority holding it is the lock, so a minority can be lost or failed over without invalidating one.
Against a single address there is no majority to lose: a restart that drops the key, or a failover
to a replica that has not received it, can leave two holders. Entity writes do not rest on either —
they have `VERSION`.

The routine is given an `AbortSignal` and a context. Extension can fail while the routine runs, and
the signal is how it says so:

```javascript
await context.atom.lock('the ledger', async (signal) => {
  await something()

  if (signal.aborted) throw signal.error
})
```

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
  redis: redis://redis.example.com    # one address, or an odd number of them
  interval: 5000                      # how often a replica registers, milliseconds
```

Several addresses are **independent servers**, not the nodes of a cluster. The lock is taken on a
quorum of them; partitioning and metering use the first, because each of them counts on a single
key. An even number is refused: `floor(n / 2) + 1` means four tolerate one loss exactly as three do,
and two tolerate none at all.

`redis://localhost` under `TOA_DEV=1`.

One set of clients per process, shared by every atom in it, and an unreachable Redis does not fail
a start.

Keys nest by whose they are, then by what they are for: `atom:<group>:slots:{group}…`,
`atom:<group>:meter:<key>`, `atom:<group>:lock:<key>`.
