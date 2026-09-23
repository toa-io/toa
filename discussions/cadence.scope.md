# A pulse every replica makes

## Design concept

A pulse is work put on the clock. Today it is always work of the component as a whole: the replicas
of a component agree through `atomicity` on which of them owns an interval, and exactly one of them
calls. That is what work over shared state needs — a sweep of a collection, a reconciliation, a
report — and it is the only thing a pulse can express.

Work that lives inside a process has the opposite requirement. A cache, a buffer, a pool, a file a
process wrote in its own container: each replica holds its own, each has to look after its own, and
a replica that never owns an interval never looks after anything. Nothing coordinates such work,
because nothing else can do it.

A pulse says which of the two it is, as `scope`.

### Guarantees

**The declaration**

1. A pulse declares `scope: replica` or `scope: group`, and `group` is what one that declares
   neither is.
2. `scope: group` is what a pulse does today: the replicas agree on which of them owns an interval,
   and one of them calls. *(today)*
3. `scope: replica` makes the call in every replica of the component: each one calls every interval
   of the cycle it is up for.
4. A component whose pulses are all `replica` asks nothing of `atomicity`, so its pulses are made
   where none is configured — which is where a `group` pulse makes no call at all.

**The cycle**

5. `intervals` splits the cycle over _time_ under either scope. Under `replica` every replica walks
   the whole of the split and is told which interval each call is for, so an operation spreads its
   own work across the cycle exactly as it does under `group`.
6. A call is made in the replica that made it, and its operation runs in that replica's process.

**What is unchanged**

7. An interval that no process was up for is not made up afterwards, under either scope. *(today)*
8. A call is never made while the one before it, in the same replica, is still running. *(today)*
9. An operation that raises loses its interval, and nothing is retried. *(today)*

**Not promised**

10. Nothing bounds how many calls a `replica` pulse makes at a boundary: it is the replica count,
    whatever that is at the time, and during a rollout it is briefly both counts at once.
11. Nothing coordinates them. Two replicas make their calls in the same moment, and an operation
    that reaches for anything shared makes that a stampede — which is what `group` is for.

### What a component author does differently

An operation looking after what its own process holds declares the scope it needs:

```yaml
# manifest.toa.yaml
cadence:
  trim:
    cycle: 60
    scope: replica # every replica, for what lives in a process
```

```javascript
// operations/trim.js — called in every replica, once a minute
export function unmanaged (input, context) {
  cache.evict()
}
```

## The changes, by area

1. **Declaration.** `scope` joins `cycle` and `intervals` in the cadence declaration schema, as
   `group` or `replica`, and is expanded to `group` where a manifest states none — including the
   shorthand, `sweep: 3600`.
2. **The extension.** A `replica` pulse is built with no `atom`, and a component whose pulses are
   all `replica` never asks the host for one. A pulse with no atom fires every interval; a pulse
   with one behaves as it does today.
3. **Documentation.** The cadence readme gains the scope and loses the claim that everything here
   rests on `atomicity`; the component declaration reference gains the option; the metrics
   documentation says that the rate of a `replica` pulse is per replica.

## Decisions

**`scope: replica | group`, rather than `each: true`.** A boolean names the answer, not the
question. `scope` names what the two answers differ in — how much of the fleet the pulse is for —
and leaves room for a third answer that is neither.

**`intervals` is not refused under `replica`.** A split cycle still means what it means: the work
is spread over time. That a split also spread it over the fleet was incidental, and an operation
that trims a twenty-fourth of its own cache every hour is asking for exactly what `intervals`
offers. The reading it invites — that `intervals` is a replica count — is one the readme already
corrects.

**No atom, rather than an atom nobody asks.** The absence of an owner to ask is the feature. A flag
carried beside an atom would be two sources of truth for one fact, and they can disagree; a pulse
built with no atom cannot ask one by mistake, and the component that declares only `replica` pulses
visibly depends on nothing.

**The call is served where it was made, because it already is.** A call to a component composed in
this process is answered by the loop binding before any other is asked, so an operation of a
`replica` pulse runs in the replica that fired it without anything being addressed. What this
inherits rather than declares is stated where it matters: were the loop out of the way, the same
declaration would mean "call N times, land anywhere".

## What happens today

Every pulse asks `atomicity` which intervals this replica owns, and calls for those. With
`intervals: 1` one replica of the fleet makes every call and the rest make none; with `intervals`
above the replica count the calls are dealt out among them. Where no Redis is configured no replica
owns anything and no call is made at all, which a warning says once per interval.

An application that needs per-process housekeeping today keeps its own timer in a run command,
which is work the process does of its own accord: it is not drained on close, not stopped by a
quiesce, and holds the process open.

## Stages

1. The declaration: schema, types, expansion, and what refuses a value that is neither.
2. The extension: an optional atom in `Pulse`, and a `Factory` that asks for one only where a pulse
   needs it.
3. The scenarios and the documentation.

## Verification

1. **A pulse declared `replica` is made where nothing coordinates.** One component declares both
   kinds; with atomicity unconfigured, the `replica` pulse's calls arrive and the `group` pulse's
   do not.
2. **Every replica makes it.** Two replicas of one component, in two processes, each record the
   calls they made; both recorded some within one cycle.
3. **A pulse declared `group`, or declaring nothing, is what it was.** The existing cadence
   scenarios pass unchanged.

## Compatibility

Additive, in every direction. A manifest that states no `scope` is expanded to `group` and behaves
exactly as it does today; nothing is stored, nothing crosses the wire, and a deployment of mixed
versions has nothing to disagree about.
