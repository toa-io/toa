# A call on a calendar

## Design concept

A pulse puts work on the clock: a cycle of so many seconds, counted from the epoch. It cannot say
"at noon on weekdays" — a calendar has months of different lengths, days of the week, and time
zones whose offsets move — and it stores nothing, so a call that came due while nothing was running
is gone. Both are right for a sweep that selects what is still due, and both are wrong for work
that belongs to a moment: a report for a day, an invoice for a month.

A component declares a **schedule** for such work: a cron expression beside the operation it calls.
Each occurrence is a [delayed call](/extensions/cadence#delay), handed over one occurrence ahead by
the component that declares it — so it is stored before it is due, made by what makes every delayed
call, and late rather than lost where nothing was running at its moment.

Two things come with it, and belong to a pulse as much as to a schedule. An entry may name the
**region** that makes it, where an application is deployed as several and the work is one for all
of them. And an operation may be given **several entries**, so one operation has a schedule per
region, or a pulse and a schedule both.

### Guarantees

**The declaration**

1. An entry under `cadence:` is a pulse or a schedule. A number, or an entry stating `cycle`, is a
   pulse _(today)_; a string, or an entry stating `schedule`, is a schedule.
2. A schedule is a cron expression of five fields, or six where the first is seconds, read in the
   time zone its `zone` names and in UTC where it names none.
3. An operation is given one entry or a list of them, and the entries of a list are independent of
   one another.
4. A declaration that mixes what belongs to the two kinds, or that states an expression or a zone
   that does not parse, is refused when the manifest is read.

**The call**

5. The operation is called with `{ at }`: the moment the call was scheduled for, in milliseconds
   since the epoch, whenever it is actually made.
6. One call is made for an occurrence, however many replicas the component has.
7. An occurrence is handed over as soon as the one before it comes due, so it is made where no
   replica of the component is running at its moment — late, once one is.
8. An occurrence that could not be made before the next one came due is not made. A schedule that
   states `overdue` is bounded by that instead.
9. No occurrence follows from the one before it. One that failed, expired or was never made changes
   nothing about the next.

**Regions**

10. An entry that states `region` is made by the deployment of that rank and by no other. One that
    states none is made by every region, which is what a pulse does _(today)_.
11. A deployment that names another region's rank in `cadence.regions` makes that region's entries
    together with its delayed calls.

**What is inherited**

12. Everything a delayed call is: it may be made more than once, it is given one attempt, and it is
    made by a chain of its own. Where `atomicity` is not configured it is not made at all.
    _(today, of `delay`)_

**Not promised**

13. An occurrence is lost where no replica of the component ran between the occurrence before it
    and its own moment. Nothing stored it, so nothing makes it up.
14. A schedule that was changed or removed may be called once more at the moment it had already
    been handed over for.
15. Nothing keeps two entries of one operation from overlapping, and nothing keeps a call of a
    schedule from running while the one before it still is.

### What a component author does differently

```yaml
# manifest.toa.yaml
cadence:
  sweep: 3600 # a number is a pulse, as it was
  report: 0 12 * * 1-5 # a string is a schedule: noon UTC on weekdays
  digest:
    schedule: 0 9 * * 1
    zone: Europe/Berlin
    overdue: 3600 # seconds it may be late and still be made
  invoice:
    schedule: 0 6 1 * *
    region: 0 # one for the whole application
```

```javascript
// operations/report.js — made for the day `at` falls on, however late it runs
export async function effect({ at }, context) {
  await compile(day(at))
}
```

`at` is what the operation computes its period from, rather than the clock: a call made twenty
minutes late is still the report for noon. It is also what tells a second call for one occurrence
from the first.

An operation takes a list where it has more than one entry:

```yaml
# manifest.toa.yaml
cadence:
  digest:
    - schedule: 0 9 * * 1
      zone: Europe/Berlin
      region: 0
    - schedule: 0 9 * * 1
      zone: America/New_York
      region: 1
  sweep:
    - cycle: 3600
    - schedule: 0 3 1 * *
      region: 0
```

## The changes, by area

1. **Declaration.** The schema of an entry is one of two closed shapes, a pulse or a schedule, and
   an operation's value is one entry or a list of them. What a manifest states is expanded to a
   list per operation: a number to a pulse, a string to a schedule, `zone` to `UTC` where none is
   stated. `region` joins both shapes. The expression and the zone are parsed when the manifest is
   read.
2. **Deployment.** `cadence.regions` is given to every composition, and not to the metronome alone,
   so that what a deployment makes of other regions' work is one setting.
3. **The metronome.** An operation that stores a call under an id its caller derived, at a moment
   its caller states, and leaves a row already there as it is. `delay` is unchanged.
4. **The extension.** A tenant per schedule entry, in every replica of the component that declares
   it, which keeps the next occurrence stored. An entry whose `region` is not one of the ranks this
   deployment makes builds nothing, pulse or schedule.
5. **Documentation.** The cadence readme gains the schedule, the region and the list, and the
   convergence readme points to `region`. The component declaration reference loses what it
   said of cadence and of continuity: what an extension declares is in its own readme.

## Decisions

**A stored call, rather than a pulse on a calendar.** A cron expression is a function of the clock
as a cycle is, and a schedule could be a pulse with another way of finding its boundary: nothing
stored, an interval nobody was up for gone. But a pulse is rescued by its receiver selecting what is
still due, and a schedule has nothing to select — a report that was not made at noon is not found
by the next one. What a schedule needs is what the readme already sends such work to: a stored
schedule. A delayed call is one.

**`at`, rather than a count.** An iteration number has to come from somewhere. Stored, it starts
again when a declaration changes and has no answer for an occurrence that was skipped. Counted from
the calendar, it changes meaning with the expression. The scheduled moment is what such a number
would be for: unique to an occurrence, ordered, the period a late call is for, and the key a
duplicate is recognised by.

**The component hands each occurrence over, rather than the row repeating itself.** A row that
carried its expression and was re-armed as it was dispatched would need nothing from the component
— and would answer to nothing either. The manifest is where a schedule is declared, and a stored
expression is a second copy of it: changed in the manifest it goes on as it was, removed from it it
goes on for good. A row per occurrence is derived from the declaration every time, so what is
declared is what is made, bar the one occurrence already handed over.

**So `context.delay` does not take a schedule.** It would be the repeating row, with the same
answer for a caller that goes away, and it would end "a delayed call is made once", which is what
the rest of what a delay promises is written against. An operation that re-arms itself
[`unchained`](/documentation/cycles.md) is how a schedule of an item's own is written today, and it
is the item that decides when it stops.

**One occurrence ahead, and never the past.** What is handed over is the next occurrence from now:
at boot, when a halt ends, and each time the one handed over comes due. That is enough for the call
to be stored through any outage shorter than a whole gap, and it leaves nothing to reconcile —
handing over an occurrence already past would need to know whether it had been made, and the record
of that is kept for thirty days against schedules of a year.

**The moment is known by the clock.** A replica that handed an occurrence over waits for its moment
and hands over the next. It hears nothing from the metronome and is told nothing of the call, which
is why nothing here is a chain: every replica computes the same occurrence from the same
expression, and any of them, or any boot, hands it over.

**Every replica hands it over, and one row is stored.** The id of the row is derived from what the
occurrence is — the region, the component, the operation, the moment — so the replicas of a
component write one row between them without agreeing on who does. Asking an `atom` would save the
writes that find the row there, and would make a schedule depend on the component's replicas
agreeing, which a delayed call does not.

**Late until the next occurrence, where nothing is stated.** A delay has no default for `overdue`
because nothing knows whether a late call is still the right call. A schedule knows one thing a
delay does not: when the next call is. So an occurrence is owed until the next one comes due and
not after — at most one is ever waiting, a missed one is made late rather than dropped, and an
outage of a month does not come back as thirty reports. No bound at all is refused for the same
reason.

**No default for `region`.** Rank `0` as the default would make one call for the whole application
without anybody asking, and would make the first thing in the runtime that needs a region of rank
`0` to exist — in an application whose ranks are `1` and `2`, a schedule that silently never runs,
which no deployment can see because each reads only its own declaration. Required, it would be
stated by every application that is one place and has no regions to name. Absent means every
region, which is what a pulse has always done; an application with regions that forgets to say gets
a call per region, which is seen.

**A list, rather than a `region` that takes several.** Regions that share a schedule could be named
in one entry. But what differs between regions is rarely only who makes the call — it is the hour,
in the zone that region serves — and a list says that, and a pulse beside a schedule as well, with
one construct.

**`region` beside `scope: replica` is refused.** Work that lives inside a process is that
process's own in every region, and a rank has nothing to say about it.

## Context

The cadence readme sends work that has to happen "even if nothing was running when it came due" to
a stored schedule, and says time zones and calendar months are not supported. This is that.

Related: [a pulse every replica makes](./cadence.scope.md), which made `scope` the answer to how
much of the fleet a pulse is for; [convergence](./convergence.md), which is where a rank comes from
and why a row carries one; [unchained](./unchained.md), which is how a call begins a chain of its
own; [halt](./halt.md), which a schedule goes quiet under as a pulse does.

## What happens today

A component that wants a call at a time of day declares a pulse whose cycle is a day and reads the
clock, in UTC, with no way to state a weekday or a month. A call that came due during a rollout is
not made. In an application of several regions every region makes every pulse, and one that wants
the work done once reads `context.region` in the operation and returns.

`cadence.regions` reaches the metronome and nothing else.

## Stages

1. The discussion and the documentation.
2. The scenarios.
3. The declaration: the two shapes, the list, `region`, and what is refused.
4. The metronome's operation.
5. The tenant, and `region` for a pulse.

## Verification

1. **A schedule is called for its occurrences.** A component declaring a schedule of every other
   second records the `at` of each call; the moments recorded are consecutive occurrences.
2. **One call for an occurrence.** Two replicas of the component record the calls they received;
   no occurrence is recorded twice.
3. **A call nothing was running for is made late.** The component is stopped past an occurrence
   already handed over and composed again; the call arrives with the `at` of that occurrence.
4. **An entry of another region is not made.** A component declares one schedule for the rank it is
   deployed as and one for another; only the first is called.
5. **A pulse is what it was.** The existing cadence scenarios pass unchanged.

## Compatibility

A manifest that states a number or `cycle` is expanded to what it was, as a list of one, and
behaves as it does today. The declaration the extension is given changes shape — a list per
operation — which nothing outside the runtime reads.

A row of a schedule is a row of a delayed call: nothing is added to what is stored, and a
metronome of the release before dispatches one as it does any other. A component of this release
against a metronome of the one before has no operation to hand an occurrence over to; the handing
over is retried until there is one, so a rollout of the two in either order loses nothing that was
further out than the rollout took.

`TOA_CADENCE_REGIONS` reaching a composition changes nothing for one that states no `region`.

## References

- [crontab(5)](https://man7.org/linux/man-pages/man5/crontab.5.html) — the expression.
- [IANA Time Zone Database](https://www.iana.org/time-zones) — what `zone` names.
