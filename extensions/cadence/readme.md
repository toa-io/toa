# Toa Cadence

Calls a component makes to itself, and calls it puts off.

A **pulse** calls an operation of its own component on a cadence its manifest states. A **delay**
hands one call over to be made later.

Both rest on [`atomicity`](/connectors/atomicity), which is what keeps two replicas from making
one call and where that promise is written down. Where it is not configured, nothing is called
at all.

## Pulse

```yaml
# manifest.toa.yaml
cadence:
  sweep:                # an operation of this component
    cycle: 86400        # seconds one whole cycle takes
    intervals: 24       # what it is split into, so one call an hour
```

The gap between calls is `cycle / intervals`, derived rather than declared, so the two cannot
disagree. `intervals` defaults to `1`, one call per cycle, which is also what the shorthand
declares:

```yaml
# manifest.toa.yaml
cadence:
  sweep: 3600           # once an hour
```

The operation is called with the cycle and the interval as its input:

```javascript
async function sweep ({ n, i }, context) { }
```

`n` is `intervals` and `i` is which of them this call is for, from `0` to `n - 1`. They are there
so that one sweep can be spread across its cycle rather than run whole every time: an operation
that takes `i` as its share of the work does a twenty-fourth of it every hour instead of all of
it at midnight.

A pulse may name any operation a receiver may — `transition`, `assignment`, `effect` or
`unmanaged`. An operation that produces no side effects has nothing to be called periodically
for.

A cycle is measured from the Unix epoch rather than from a calendar, so `86400` means UTC
midnight and `3600` the top of the hour. A cycle that is not a divisor of a day lands on a
boundary that is not any particular time of day. Time zones and calendar months are not
supported.

### What to expect

**An interval may not be called.** A rollout, a crash, or an operation that raised or ran past
its own interval each cost that interval, and nothing makes it up afterwards.

**So select by state, not by position.** With `intervals` above `1` the shares are a partition —
`i = 5` missed is not covered by `i = 6`, and waits a whole cycle. Write the operation to take
what in its share is still due, rather than everything in its share, and a missed interval costs
a delay instead of a day. An operation written the other way loses a day's work to a
thirty-second rollout.

Where a call has to happen even if nothing was running when it came due, it needs a stored
schedule: [`delay`](#delay) is one.

**An interval is called once.** Two calls for one interval need the clocks of two machines to
disagree and the work to change hands in the same moment, which is a window the width of that
disagreement.

**A call is never made while the one before it is still running.** If the work does not fit the
gap the interval is skipped and says so; where that is logged, the cycle is too short or has too
few intervals.

**An operation that raises loses its interval, and nothing is retried.** Skipping is a choice
rather than a conclusion, and there is no setting for it — retrying would be as defensible, and
either answer put to everyone who wanted an operation called every hour is a worse cost than
picking one.

`intervals` is not a replica count. With `intervals: 24` and three replicas each makes eight of
the day's calls: the cycle is spread over *time*, not over the fleet. Replicas beyond `intervals`
make none.

## Delay

```javascript
const id = await context.delay('mail.sender.remind', { input: { user } },
  { interval: 7 * 24 * 3600 * 1000, overdue: null })

await context.delay.cancel(id)
```

| | |
|---|---|
| `interval` | milliseconds from now |
| `overdue` | milliseconds the call may be late and still be made, or `null` for no bound |

The call is made once the delay has passed, and waits for the target where it is not there to
take it. The id it answers cancels it, and `cancel` raises where the id was never issued.

Nothing is declared for it beyond naming the extension. A component that only delays calls says
so with an empty declaration:

```yaml
# manifest.toa.yaml
cadence: ~
```

### How late is too late

`overdue` bounds lateness, and lateness is mostly what a failure causes rather than what the
ordinary path has: a call is made at the moment it is due. How much is left of that in practice
depends on how coarsely the calls are looked over — see [Discreteness](#discreteness).

| | |
|---|---|
| `null` | no bound: made whenever it can be, however late that is |
| `0` | on time or never |
| a number | made if no more than that many milliseconds late |

**There is no default, and it is stated on every call.** Only the caller knows whether a late
call is still the right call — an unpaid order expires on time or not at all, a report is wanted
whenever it can be had — and nothing else in the system can tell those apart. A default would
answer for it, and either answer is wrong for somebody: the wrong `null` makes a stale call, and
the wrong number drops a call and says nothing.

### Discreteness

Calls waiting to be made are looked over on a period — `discreteness`, a minute by default — and
everything here is measured against it.

**A delay shorter than `discreteness` is served late.** It is made at the next pass rather than
at the moment it was due, so a five second delay under a one minute `discreteness` lands up to a
minute after it was asked for. A delay longer than `discreteness` is made on time, because the
pass before it has already set it going.

**An `overdue` shorter than `discreteness` can be missed where nothing is wrong**, and combined
with a delay shorter than it will almost always be: the pass that would have made the call finds
it already past its bound and leaves it. State an `overdue` several times `discreteness`, or
`null`.

**A cancellation is reliable while the call is further out than `discreteness`**, and is a race
closer than that, where the call may already be on its way.

So `discreteness` and `overdue` are chosen together against what the application needs. A call
that must be made within seconds of its time, or cancellable within seconds of it, needs a
`discreteness` of seconds — at the cost of looking the calls over that much more often.

### What to expect

**A call may be made more than once**, so where a second one would cost something, the target
has to be the one that refuses it.

**A call may not be made at all**, in four ways:

- **the caller crashed** between committing its own change and handing the call over. This is
  not transactional with your state, and nothing can tell — where the semantics allow it, hand
  the call over first;
- **it expired**, having been given an `overdue` and nothing having been able to make it in
  time;
- **it was cancelled** — which is reliable while the call is further out than `discreteness`,
  and a race closer than that;
- **it could not be made.** One attempt is given, so a call that could not go out is reported
  and dropped rather than tried again — the same choice a pulse makes, for the same reason.

What is reported here is a call that could not be made at all. An exception the operation itself
raises belongs to the component that raised it and is reported there.

A pulse trades the other way: its receiver selects by state, so a skipped interval heals itself
and a second call is the expensive failure.

### The horizon

A horizon of years costs nothing, and a call put off that long is worth no more than the target
that will be there to take it: the target may be gone by the time it comes due, and its input
may no longer be one it accepts. Either way the attempt is spent.

## Configuration

```yaml
# context.toa.yaml
cadence:
  discreteness: 60    # seconds between passes over the calls waiting to be made
```

`discreteness` is how often the calls waiting to be made are looked over. It defaults to 60,
which is what an application that states nothing gets. It is the floor under how closely a
delayed call can be cancelled and how small an `overdue` is worth stating — see
[Discreteness](#discreteness) — and lowering it costs a pass that runs more often.
