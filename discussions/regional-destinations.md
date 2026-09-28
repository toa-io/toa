# Regional destinations

## Design concept

A committed change reaches every destination it is outstanding for, and where a destination writes
to something each region keeps for itself, it is written in every region.

An outbox row is published to destinations that know nothing of each other: the component's
`events`, `convergence`, `realtime`. They differ in where their effect lands:

- what `events` sets off is state, and state converges by itself — doing it again in another region
  would do it twice;
- what `realtime` writes is a Redis stream, which each region keeps for itself and nothing converges
  — another region never sees it unless it is written there too.

A destination of the second kind is **regional**. At the origin it says what it would write, in a
form that needs nothing of the origin to be written elsewhere (`export`); in another region it
writes that (`import`). A destination that carries a change to the other regions — convergence is
the one there is — carries what the regional destinations of the component export beside the
record, and where the change arrives, hands each to the destination of the same name. Neither end
knows what the other is: boot connects them, by what they declare.

A message created in `eu` and routed to its sender and its recipient reaches the recipient's stream
opened in `us`.

### Guarantees

**Delivery**

1. What a regional destination writes for a change in the region that committed it, it writes in
   every region the change converges to.
2. It is written there whether the record it came with is applied or is older than the one stored:
   what happened in one region happened, whichever record wins.
3. What a regional destination fails to write where the change arrives is written again: the change
   is delivered again, the record converges again to no effect, and what it carries is written
   again.
4. Convergence is not held back by a regional destination: one that fails to say what it would
   write has nothing carried for that change, and the record converges all the same.

**What is not promised**

5. **At-least-once.** A change delivered again writes again what it carries, as the origin writes
   a row again that it failed to mark _(today)_.
6. **Order.** Changes arrive in no promised order, and neither does what they carry _(today)_. A
   realtime client reconciles by `VERSION`.
7. **Latency.** What is carried arrives with the record, as late as the federation link makes it.
8. **Where nothing converges.** A component whose storage does not converge has no carrier, and its
   regional destinations write in the region that committed the change alone _(today)_.
9. **What a destination of another region does not have.** What is carried for a destination that
   the arriving region's component does not have is dropped.
10. **What a destination failed to say.** A change a regional destination could not export for
    reaches the other regions without it, and nothing makes it up there — 4 is what it costs.

### What a component author does differently

Nothing. A component that routes realtime events and converges delivers them in every region.

## The changes, by area

1. **Core: the contract.** `outbox.Destination` gains two optional members, and a destination that
   has both is regional:
   - `export(row)`: what it would write for the row, serializable, or `undefined` for nothing;
   - `import(portable)`: write what another region's destination of the same name exported.

   And a carrier: a destination that declares `carries` is given, before it connects, `regional` —
   what the component's regional destinations export for a row, by their names, and the import of
   what arrives. One destination's export failing is logged and leaves it out; an import failing
   fails the import.
2. **Boot.** Once the destinations are made, a destination that `carries` is given the `Regional` of
   the others, as a destination that `renders` is given its `Rendering`.
3. **Convergence.**
   - Its destination `carries`. The message gains `carried`: what `regional.export` returned, and
     absent where it returned nothing.
   - Where a message arrives, the record is converged, then `carried` is imported, and then the
     message is acknowledged. What throws is delivered again.
   - It reads nothing of what it carries.
4. **Exposition: realtime.** The destination is regional. `export` is what `emit` would write — each
   routed event's name, keys and exposed data — and `import` writes it to the streams of the keys,
   the same way. A key nobody reads in the arriving region is written nowhere there either.
5. **Documentation.**
   - [outbox](/documentation/outbox.md): regional destinations, and what a carrier does with them.
   - [convergence](/extensions/convergence/readme.md): what it carries besides the record.
   - [realtime](/extensions/exposition/documentation/realtime.md): an event reaches the streams of
     its key in every region.

## Decisions

1. **A property of a destination, not of realtime.** Convergence is an extension that knows nothing
   of exposition, and exposition nothing of convergence. What makes a write repeatable in another
   region is the destination's to say, and what carries it is the carrier's; core states the
   contract between the two, and boot connects them.
2. **What was written, not what to render.** The arriving region is given what the origin's
   destination would write rather than the event to render again. Rendering there would run the
   component's code in another region, possibly at another version during a rollout, and could give
   a reader there something other than what a reader at the origin was given. It would also put the
   event's `origin`, `input` and `trailers` on the wire, where the rendered payload is what a route
   exposes of it.
3. **On convergence's message, not a transport of its own.** Convergence already carries every
   committed change durably to the same component in every region, by federation that whoever runs
   the brokers configures. Replicating Redis between regions, or processes reaching other regions'
   Redis, would be a second cross-region link to run, and one that is down would hold rows or
   streams in every region.
4. **Written whatever the record's fate.** A record older than the one stored is dropped, but the
   event it came with happened, and a reader at the origin was given it. A reader keeps the version
   it has and drops an older one _(today)_.
5. **An export that fails leaves convergence alone.** One destination does not answer for another
   _(today, for the outbox)_. The price is 10: a change that the destination could not export for
   is not written in the other regions, while at the origin it is retried until it is.
6. **An import that fails is delivered again.** The record has converged by then, so another
   delivery converges nothing and repeats only the import — the duplicate at-least-once already
   allows.
7. **Not sticky routing.** Sending a client to the region its data lives in would not do: a sender
   and a recipient, or the members of a room, are in different regions.

## Context

- [Convergence](./convergence.md): regions, the transport, and "entity state and nothing else",
  which this widens.
- [Realtime streams](./realtime.streams.md): realtime as an outbox destination, written once by the
  process that committed the change.
- [Stream token](./stream-token.md): a stream read from a token finds converged writes; that is a
  pull, not a push.

## What happens today

1. A change is committed in `eu`. Its row is outstanding for `events`, `convergence` and `realtime`.
2. `realtime` writes the routed events to the streams of their keys in `eu`'s Redis.
3. `convergence` publishes `{ record, trace }`, which federation carries to `us`.
4. `us` writes the record through the storage, which emits nothing and writes no row: `us`'s Redis
   is never written, and a reader there is sent nothing.

## Stages

1. Core: the contract, and `Regional`.
2. Boot: a carrier is given the `Regional` of the others.
3. Exposition: realtime exports and imports.
4. Convergence: carries, and imports where it arrives.
5. Documentation.

## Verification

`extensions/exposition/features/realtime.regions.feature`, with the suite as the other region, as
`features/extensions/convergence.feature` is:

- an event routed by a converging component reaches the other region, carried with the record;
- an event carried from the other region reaches a stream of its key here;
- it reaches it where the record it came with is older than the one stored;
- a key nobody reads here is not written for what the other region carried;
- what was carried while the realtime Redis was down reaches the stream once it is back
  (`@containers`).

Unit tests of `Regional`, of the convergence message, and of realtime's `export` and `import`.

## Compatibility

- **Wire:** the convergence message gains an optional `carried`. A region of before ignores it, and
  a message of before has none: during a rollout, what crosses between a region of before and one of
  after is converged without realtime, as it is today.
- **Types:** optional members of `outbox.Destination`.
- **Behavior:** realtime readers receive events of changes committed in other regions, which they
  did not before.
