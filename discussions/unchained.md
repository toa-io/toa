# Unchained operations

## Design concept

A call carries the chain of hops that led to it, and one that has been to the same place too often,
or has gone too far, is refused. See [the circuit breaker](./circuit-breaker.md). Some operations
are meant to be entered again from below themselves — a handshake, a walk over a tree that calls
itself per node, an operation re-arming its own next run. Such an operation says so in its
declaration, and each call to it begins a chain of its own.

`unchained` is also the name of the option `context.delay` takes for the same thing about one
delayed call, which is `detached` today.

### Guarantees

**An unchained operation**

1. A call to an operation declared `unchained: true` is made whatever chain it arrives with: the
   chain is dropped where the call enters the operation, and the operation's own hop begins a new
   one.
2. What the operation calls, emits or delays carries the new chain, which begins with that hop.
3. The request's identity and its `readonly` travel on as they do for any other call: they belong
   to the request, and the chain is the only thing dropped. _(today, for every call)_
4. A circle that passes through an unchained operation is refused by neither rule, because every
   lap begins at the operation again. Depth included: a chain grows from the operation onwards and
   is bounded from there.
5. A circle that does not pass through it is refused as before. _(today)_

**A delayed call**

6. `context.delay(endpoint, request, { unchained: true })` makes the call by a chain that begins
   with the delayed call itself. _(today, as `detached`)_
7. `detached` is not read any more. A call that passes it continues the chain that armed it.

### What a component author does differently

Nothing, unless an operation is meant to be entered again from under itself:

```yaml
operations:
  walk:
    type: effect
    scope: none
    unchained: true # calls itself per child
```

## The changes, by area

1. **Manifest schema** (`runtime/norm`). An operation takes `unchained: boolean`.
2. **Core.** `Operation` carries `unchained` from its definition. `Component.invoke` extends an empty
   chain where the operation it serves is unchained.
3. **Cadence.** `DelayOptions.detached` is `unchained`.
4. **Documentation.** `documentation/cycles.md`, `documentation/component/declaration.md`, the cadence
   readme, and the note for the version this breaks.

## Decisions

1. **Declared on the operation.** Only the author knows that re-entry is meant, and the declaration
   is where they state what an operation is. The deployment-wide `TOA_TRAIL_REPEATS=0` stays for a
   deployment that needs its old behaviour while it is fixed.
2. **The chain begins at the operation.** Its hop stays in the new chain, so a circle that leaves
   the operation and comes back is visible in the chain the next lap carries, and the chain still
   says where the call came from.
3. **One word for one thing.** A delayed call that begins its own chain and an operation that begins
   its own chain are the same act at two places, so they share a name.
4. **`detached` is removed outright.** Toa is in alpha, and a note for the version says what to
   rename.

## What happens today

`TOA_TRAIL_REPEATS=0` switches repetition off for a whole deployment. A single delayed call can be
made by a chain of its own with `detached: true`. Nothing lets one operation be re-entered.

## Verification

1. An unchained operation that calls itself runs past the third round, and ends where its own
   algorithm stops.
2. An operation that calls itself without the flag is refused on its third round. _(today)_
3. A delayed call armed with `unchained: true` begins a chain of its own, and an operation re-arming
   itself so runs every round.
4. A delayed call armed with `detached: true` continues the chain, and is refused on its third round.

## Compatibility

- **Manifest.** `unchained` is new.
- **Cadence.** `detached` is renamed to `unchained`. Nothing is stored under either name.
