# A schedule an operation hands over

## Design concept

A [schedule](./cadence.schedule.md) is declared in a manifest, so there is one per entry and it is
the same for every item. Work whose calendar belongs to an item — this account's digest at nine in
its own zone, that subscription's renewal on the day it began — has no manifest entry to be. Today
it is written as an operation that [re-arms a delay](/extensions/cadence#a-delay-is-a-hop) as it
runs: a chain the operation keeps alive by hand, which stops for good the first time one link is
not made.

An operation hands a schedule over at runtime, as it hands over a delay:

```javascript
const id = await context.schedule('mail.digest.send', { input: { account } }, '0 9 * * 1')

await context.schedule.cancel(id)
```

The schedule is stored, and its target is called at every occurrence until it ends or is
cancelled. What
makes the calls is what makes every delayed call, so each occurrence is late rather than lost where
nothing was running at its moment, and nothing a call does or fails to do ends the ones after it.

### Guarantees

**Handing one over**

1. `context.schedule(endpoint, request, schedule)` stores a schedule and answers its id.
   `context.schedule.cancel(id)` ends it, and raises where the id was never issued.
2. `schedule` is a cron expression, or `{ schedule, zone, overdue, expires }`. The expression has
   five fields, or six where the first is seconds; `zone` is UTC where none is stated; `overdue` is
   in milliseconds, as a delay's is; `expires` is the moment, in milliseconds since the epoch, after
   which no occurrence is made, and there is none where it is not stated.
3. An expression or a zone that does not parse, an `expires` already past, a request that names an
   `instance`, and an input that is not an object or that states `at` are refused with a
   `RequestContractException`, and nothing is stored.
4. The same endpoint, request, expression, zone and `expires` handed over again is the same
   schedule: the same id is answered and nothing is added.
5. Storing it is a write, so it raises from a chain that
   [may only read](/documentation/readonly.md). _(today, of `delay`)_

**The calls**

6. The target is called at each occurrence with the request that was handed over, its input given
   `at`: the moment of the occurrence, in milliseconds since the epoch, whenever the call is made.
7. One call is made for an occurrence, however many replicas the metronome has. A second call of one
   occurrence is the same call, so an operation that declares
   [`once`](/documentation/inbox.md) changes state once per occurrence.
8. An occurrence is owed until the next one comes due, or for `overdue` where it is stated, and is
   made late within that where nothing was there to make it on time.
9. An occurrence that was not made is not made up, and changes nothing about the next one: the
   schedule goes on from the next occurrence after now.
10. Each call begins a chain of its own, as a call made from the clock does.
11. A schedule goes on until it is cancelled, until `expires`, or until its target refuses a call
    in a way that will not change — an endpoint it no longer has, a request its contract no longer
    fits — which ends it and says so.

**Regions**

12. A schedule is made by the region that stored it, a region that is gone has its schedules taken
    over by naming its rank in `cadence.regions`, and a cancellation reaches the region that owns
    the schedule by convergence. _(today, of `delay`)_

**Not promised**

13. Occurrences closer together than [`discreteness`](/extensions/cadence#discreteness) are made at
    most once a pass; the ones in between are not made.
14. A schedule cancelled within `discreteness` of an occurrence may be called for it.
15. Nothing keeps a call from running while the one before it still is.
16. Nothing changes a schedule in place, and nothing lists them. A schedule is changed by cancelling
    it and handing the new one over; its id is kept by whoever handed it over, beside the item it is
    for.

### What a component author does differently

```yaml
# manifest.toa.yaml
cadence: ~ # nothing declared; the component hands schedules over

operations:
  subscribe:
    type: transition
  send:
    type: effect
    input:
      account: string
      at: integer # the occurrence, added to the input handed over
```

```javascript
// operations/subscribe.js — the account's digest, at nine on Mondays where it lives
export async function transition({ zone }, account, context) {
  account.digest = await context.schedule(
    'mail.digest.send',
    { input: { account: account.id } },
    { schedule: '0 9 * * 1', zone }
  )
}
```

```javascript
// operations/send.js — the digest for the week `at` ends, however late it runs
export async function effect({ account, at }, context) {
  await compile(account, week(at))
}
```

The `delay` that re-armed itself, with `unchained: true`, and the reconciliation that re-armed it
where a link was lost, are no longer written.

## The changes, by area

1. **The aspect.** `context.schedule` is a second aspect of the extension beside `delay`. It parses
   the expression and the zone with the `occurrences` a manifest's schedule is read by, refuses
   what guarantee 3 lists, and stores a row whose `due` is the first occurrence after now, under an
   id derived from the endpoint, the canonical form of the request, the expression, the zone and
   `expires`.
   It is stored by `ensure`, as a manifest's schedule stores an occurrence, and carries no trail.
2. **The row.** A row may carry `schedule`, `zone` and `overdue` — what it recurs by, and the bound
   each occurrence was given. `expires` keeps its meaning, the moment after which the row is not
   made at all: for a schedule, the one handed over, or the end of representable time.
3. **The metronome.** `settle` moves a recurring row to its next occurrence after now rather than
   tombstoning it, and only where the row is still at the occurrence the dispatcher made — so a
   settle that arrives twice, or after the row has moved, moves nothing. It tombstones the rows it
   is told have ended, and a row whose next occurrence falls after its `expires`. The index and the
   retention are unchanged: a live schedule is a live row.
4. **The dispatcher.** A recurring row is called with `at` added to its input and with an id
   derived from the row and the occurrence, so a second call of one occurrence is that call again
   and the next occurrence is another. An occurrence is lapsed past `due + overdue`, or past the
   next occurrence where no bound was stated — computed from the row, not stored — and is settled
   without the call, which moves the row on. A row past its `expires`, and a permanent refusal of
   a recurring row's call, are reported to `settle` as an end.
5. **Types.** The `Schedule` aspect in the cadence definitions, and in what `toa types` generates
   for a component that declares `cadence`.
6. **Documentation.** The cadence readme gains the schedule an operation hands over, beside the
   delay; the published reference gains it with the context.

## Decisions

**A method of its own, rather than an option of `delay`.** A delayed call is made once, and what
`delay` promises is written against that. A call that repeats until it is cancelled is another
thing, with another answer to a caller that hands it over twice.

**One row, moved on as it is settled, rather than a row per occurrence.** A manifest's schedule
stores each occurrence and keeps the next one stored from the component, because the manifest is
the declaration and a stored expression would be a second copy of it. A schedule handed over has
no declaration but the row, so the row carries its expression and the metronome derives each
occurrence from it. It is moved on whether the call was made, lapsed or failed on the way out, so
no occurrence depends on the one before it, and nothing outside the metronome has to be running for
it to go on.

**On from now, never from the occurrence that was due.** What is past is not handed over again, as
a manifest's schedule does not: a metronome that was away for a week owes one occurrence, not a
week of them.

**The id is what is scheduled.** A random id makes a second schedule of a request that arrived
twice — a redelivery, a transition declared `concurrency: retry` — and a second schedule is a
second call at every occurrence for good. A delay pays for a duplicate once; a schedule would pay
forever. Derived, the duplicate is the same row. Two identical schedules are the same calls anyway,
so nothing a caller could mean is lost.

**`at` in the input, rather than the request as it was handed over.** It is what a manifest's
schedule calls with, for the same reasons: the period a late call is for, and what tells two calls
of one occurrence apart. Adding it to the caller's input rather than replacing it keeps one request
for the item and one target contract for both kinds of schedule. An input that already states `at`
is refused rather than overwritten.

**A target that refuses for good ends the schedule.** A row whose request no longer fits would
otherwise be called and refused at every occurrence for as long as the application runs. A delay
settles such a row once; a schedule settles it the same way, and stops.

**Every call begins a chain.** The call is made from the clock long after the chain that handed the
schedule over has ended, and is a hop of nothing.

**`context.schedule`, rather than `context.cadence.schedule`.** An aspect is named by what it does,
and `context.delay` already is. A `cadence` object would either move `delay` under it, breaking
every caller, or leave the two named two ways.

**An expression as the third argument, an object for the rest.** As a manifest states a schedule:
the expression alone, or with a zone and a bound. `overdue` is in milliseconds, as everything
`context` is given is; a manifest states seconds.

**`expires` is the schedule's end, and the bound of an occurrence is computed.** `expires` is what
every row has, and means that nothing of the row is made after it; for a delay that is one call,
for a schedule the whole of it. Given to the bound of each occurrence instead, it would change
meaning by the kind of row, and a schedule would have no end but a cancellation. The bound of an
occurrence follows from the row — `due`, `overdue`, the expression — so it is derived where it is
read, rather than stored and moved with every occurrence. Named `expires` where it is handed over
as well, because it is the same thing.

**No default `overdue` refused, unlike `delay`.** A delay states it on every call because nothing
knows when the next call is. A schedule does, so it has the default a manifest's schedule has.

**No update and no listing.** An update is a cancellation and a schedule, and is written as one.
A listing is a query over the metronome's rows by request, which is the application's data stored
in the runtime's collection; the application keeps the id beside the item it is for instead.

## Context

The cadence readme sends recurring work per item to an operation that re-arms a delay, and the
discussion of [a call on a calendar](./cadence.schedule.md) declined a `delay` that takes a
schedule, on the grounds that a stored expression is a second copy of a declaration and answers to
nothing once its caller is gone. The first holds of a manifest's schedule and not of one handed over,
which has no other copy; the second is answered by the id, which is what cancels it, and by a target
that refuses ending it.

Related: [a call on a calendar](./cadence.schedule.md), whose expression, zone and bound this
takes as they are; [unchained](./unchained.md), which is how a re-armed delay is written today;
[convergence](./convergence.md), which carries a schedule's row and its cancellation across regions.

## What happens today

A schedule per item is an operation that, as it runs, delays a call to itself at the next
occurrence it computes, `unchained` so that the third round is not refused as a cycle. A call that
was not made — expired, refused, or lost to a crash before the next one was armed — is the last one,
and nothing says so. An operation that arms its next call twice, by a redelivery or a retry, runs
twice at every occurrence after it.

## Stages

1. The discussion and the documentation.
2. The scenarios.
3. The aspect and the row: storing a schedule, the id, and what is refused.
4. The metronome and the dispatcher: `at`, moving a row on, and ending one.

## Verification

1. **A schedule is called at its occurrences.** An operation hands over a schedule of every other
   second under a `discreteness` of one second; the target records the `at` of each call, and they
   are consecutive occurrences.
2. **The request is the one handed over.** The target receives the input it was given, with `at`.
3. **The same schedule twice is one.** An operation hands over one schedule twice; the two ids are
   equal and no occurrence is called twice.
4. **A cancelled schedule is not called.** It is cancelled further out than `discreteness`; no
   occurrence after that is recorded.
5. **A missed occurrence is made late.** The target's component is stopped past an occurrence and
   composed again; the call arrives with the `at` of that occurrence, and the schedule goes on.
6. **A schedule outlives a failure.** A call that lapsed past its `overdue` is not made, and the
   next occurrence is.
7. **A schedule ends at `expires`.** A schedule of every other second expiring a few seconds out
   is called for no occurrence after it, and its row is tombstoned.
8. **A target that refuses for good ends it.** The target's contract no longer fits the request;
   it is called once, the refusal is logged, and the schedule is called no more.
9. **What does not parse is refused.** An expression, a zone, an `expires` already past, an
   `instance`, and an input stating `at` each raise, and nothing is stored.
10. **A delay is what it was.** The existing cadence scenarios pass unchanged.

## Compatibility

`delay`, a manifest's schedule and a pulse are unchanged, and so are the rows they store.

A recurring row read by a metronome of the release before is made once and tombstoned, so the
release is rolled out to the metronome before an application hands a schedule over. A deployment
whose metronome and components ship in one image has nothing to do.

`toa types` gains `context.schedule` for a component that declares `cadence`; nothing is removed.

## References

- [crontab(5)](https://man7.org/linux/man-pages/man5/crontab.5.html) — the expression.
- [IANA Time Zone Database](https://www.iana.org/time-zones) — what `zone` names.
