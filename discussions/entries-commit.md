# A transition over entries commits all or nothing

## Design concept

A transition over `entries` reads a set of entities, its algorithm changes them, and the set is
committed. The commit is one compare-and-swap over the whole set: it succeeds where every entity is
still at the version it was read at, and where no entity the transition creates exists already.
Where one of them is not, nothing of the set is written, and the transition goes the way a
single-entity transition goes when it loses: retried under `concurrency: retry`, refused with
`StateConcurrencyException` otherwise.

### Guarantees

1. The set is written whole or not at all, and so are the events it causes: an event is stored in
   the outbox only with the write it describes.
2. An entity changed since it was read is left as the other writer left it.
3. An entity the transition creates — an associated one whose id the read did not find — is created
   only where no live entity holds its id. A deleted one is revived. *(today, for the revival)*
4. A lost commit is counted in `toa.storage.conflicts`, as a single entity's is.

### What a component author does differently

Nothing. A transition over `entries` that used to half-commit under contention now retries or
raises, which is what its `concurrency` already said.

## The changes, by area

1. **MongoDB storage.** `massStore` already writes the set and its outbox rows in one transaction.
   A replacement whose version filter matches nothing is no error in a bulk write, so today the
   transaction commits the rest. After the bulk write the number of entities it matched is compared
   with the size of the set; where it is short the transaction is aborted and `false` is answered.
   A creation matches an existing record only where that record is deleted, so a live one makes the
   upsert collide on `_id`, which aborts the transaction too and answers `false`.
2. **Core.** The contract of `Storage.massStore` says what `false` means.
3. **Documentation.** `documentation/design.md`, and the note for the version this changes.

## Decisions

1. **Abort, and answer `false`.** `false` is what `store` answers for a lost compare-and-swap, and
   `Transition` already knows what to do with it.
2. **Counted once per commit.** A set lost to three writers is one lost commit, and one retry.

## What happens today

A replacement whose version moved matches nothing and is skipped; the rest of the set is written,
`true` is answered, and an outbox row is written for every entity, the skipped one included. A
creation upserts by id alone and replaces whatever is there.

## Verification

1. A transition over `entries` whose set has one member changed under it by another call writes
   nothing, emits nothing, and raises `StateConcurrencyException`.
2. The same where a member it creates is created under it by another call.
3. With nothing changed under it, every member is written and one event is emitted per member.

## Compatibility

- **Behaviour.** A transition over `entries` under contention retries or raises where it used to
  report success over a partial write.
