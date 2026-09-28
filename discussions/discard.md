# Transitions without commits

## Design concept

A transition's state carries a system property, `DISCARD`, which is `false` when the algorithm
receives it. It lives on the state for as long as the operation runs, as `TRAILERS` does, and is
never stored, validated, answered or emitted.

An algorithm that sets `state.DISCARD = true` has its transition end where one that answered with
an error ends: before the commit. Nothing is written, nothing enters the outbox, no event is
emitted, and the inbox records nothing. The caller receives what the algorithm returned.

Over `entries`, `DISCARD` is per entity: the flagged ones leave the commit, and the rest are
committed all or nothing.

### Guarantees

**A transition over `entry`**

1. A transition whose state is flagged writes nothing and emits nothing. The record keeps its
   `VERSION`, `UPDATED` and `REGION`, and an associated entity the transition would have created
   stays absent.
2. The caller receives the reply the algorithm returned.
3. What the algorithm changed on a flagged state is discarded: guards and the entity schema are
   applied to what is committed, and a flagged state is never committed.
4. An operation declared `once` records no flagged call, as it records no error: the same call made
   again runs again.

**A transition over `entries`**

5. A flagged entity is neither written nor compared, so a change another call makes to it between
   the read and the commit leaves the commit of the rest intact.
6. The entities left are committed as one compare-and-swap, with an event each. _(today)_
7. A set whose every entity is flagged writes nothing and emits nothing.

**What is not promised**

8. An assignment has no `DISCARD`: its changeset is written by an upsert and is no record.

### What a component author does differently

Nothing, unless a transition answers without changing state:

```javascript
export function transition(input, entry) {
  if (entry.balance < input.amount) {
    entry.DISCARD = true

    return { balance: entry.balance, charged: false }
  }

  entry.balance -= input.amount

  return { balance: entry.balance, charged: true }
}
```

A TypeScript transition types its state as `State`, which `toa types` writes beside `Entity`:

```typescript
import type { State } from '../types/index.d.ts'

export function transition(input: ChargeInput, entry: State) {
  entry.DISCARD = true
}
```

## The changes, by area

1. **Entity** (`runtime/core`). `Entity` defines `DISCARD` on the record it holds, beside
   `TRAILERS`: writable, non-enumerable, `false`.
2. **Transition.** `Transition.commit` returns before the entity is set when the state is flagged.
3. **Entity set.** `EntitySet.set` keeps the entities whose value is unflagged, and what it commits
   and emits is those. `State.massCommit` answers `true` without a write where every one is
   flagged.
4. **Manifest** (`runtime/norm`). A component that declares an entity property `DISCARD`, or names
   it in `blank`, is refused.
5. **Types** (`runtime/cli`). `toa types` writes
   `State = Entity & { DISCARD: boolean, TRAILERS: Record<string, unknown> }`.
6. **Documentation.** `documentation/component/declaration.md`, `documentation/design.md`,
   `documentation/inbox.md`, the Node bridge readme, and the note for the version this breaks.

## Decisions

1. **A property of the state.** The algorithm already owns the state and writes `TRAILERS` into it;
   a flag there needs no new return shape, and works per entity over `entries`.
2. **Non-enumerable.** The schema, the storage, a reply and an event read enumerable properties
   alone, so the flag reaches none of them without a line of filtering.
3. **The error's path.** A discarded transition is a refusal that answers with a value, so it skips
   what an error skips, the inbox included.
4. **Transitions alone.** A transition is the operation that holds a record it may leave as it is.
5. **`State` carries `TRAILERS` too.** Both are what a transition's state has beyond the record,
   and a TypeScript transition reaches neither without them.

## Context

[`TRAILERS`](/documentation/outbox.md#the-event) is the first system property that exists on the
state alone. [A transition over entries commits all or nothing](./entries-commit.md) is what the
entities left after the flagged ones are committed by.

## What happens today

A transition always commits: an algorithm that decides to change nothing still bumps the version and
emits an event, or returns an error and loses its reply.

## Verification

1. A flagged transition over an entry answers what it returned, leaves the record at its version,
   and leaves no outbox row.
2. A flagged transition over an associated entity that is absent creates nothing.
3. A flagged call to an operation declared `once` leaves no inbox record.
4. A transition over two entries that flags one writes the other, with one outbox row.
5. A transition over entries that flags every one writes nothing and leaves no outbox row.
6. A transition over entries that flags the one another call changes under it commits the rest.

## Compatibility

- **Manifest.** An entity property named `DISCARD` is refused.
- **Storage.** A collection holding a field named `DISCARD` renames it with a migration.
- **Types.** `State` is new.
