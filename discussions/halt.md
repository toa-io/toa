# Halt

## Design concept

A deployment is brought to a standstill and comes back by itself.

Every process stops doing anything of its own accord, waits for what it already had, closes every
connection it holds to the infrastructure, and stays up. When the interval it was given is over it
builds itself again. Nothing has to reach it for that to happen, which is what makes the window
usable for work on the infrastructure itself — a broker restarted, a database failed over, a
cluster moved.

**What is hard is not the stopping but the moment.** A deployment that is killed is left owing
itself work: a state change whose events have not been delivered, a call whose reply was lost, a
task nobody ran — all of it correct in the end, because the runtime is built to converge, but only
once it is back. A halt stops it at a point where nothing is owed: nothing is in flight, nothing is
queued, nothing is waiting to catch up. Everything that follows — the quiet, the check, the
unilateral stop — exists to find that moment and to prove it was found.

A halt is three things rather than one.

**Quiet.** The runtime turns off every source of work it owns: the gateway answers `503`, pulses
stop firing, delayed calls stop being dispatched, and each component's `pause` run command releases
what the runtime cannot see. Not one connection is closed and nothing stops consuming — nothing is
adding to the queues, so what is in them is finite and drains. A quiesced deployment is the same
deployment, still connected, with nothing new entering it.

**The check.** Every process already tells the explorer what called what, and a process that
observed nothing writes nothing. So the question *did anything happen anywhere* is one read of
`introspection.edges`: was any edge written in this region since the signal. If none was, nothing
was called, anywhere.

**Stop, or cancel.** Whichever process reads stillness writes a `stop` record, and every process
obeys it without consulting its own view. Where the map showed activity, or could not be read, the
halt is called off: nothing was closed, so each process starts working again with what it never let
go of.

Seeing stillness is an **assertion** — acted on alone and binding on everyone. Seeing activity is
an **opinion** — held quietly and given up if anyone asserts otherwise. That asymmetry is what lets
a fleet decide with nothing agreed between its members.

### Guarantees

1. **Nothing is running when a stop begins.** Every source is off, what was in flight has finished,
   and the map says nothing was called.
2. **Nothing in flight is interrupted.** A halt waits for the work a process had taken and never
   abandons it. It can afford to: the sources are off, so what is in flight is finite.
3. **A quiet is reversible.** It closes nothing, so a cancel restores a working deployment with no
   rebuild.
4. **A halt reaches one region.** The check reads the region's own writes, so a deployment that
   converges with another is not fooled by what happened over there.
5. **No two processes can disagree about whether to stop**, because none of them has to agree.
6. **A stop binds only a process quiesced for the halt it answers.** One from an earlier halt, one
   the outbox redelivered, and one arriving after a process has given up are all discarded.

What is not promised:

- **A quiet is an outage for its duration.** The gateway answers `503` from the moment the signal
  lands, so a halt that is then cancelled still cost one window of `503`.
- **A deployment that does not go quiet is not stopped.** A component that keeps its own time, a
  queue that never empties, work that outlasts the window — any of them and the halt is called off.
- **A halt holds only over the processes that were there when it began.** One that starts during
  the quiet comes up working and calls the halt off; one that starts during a stop runs through it,
  which is the only way to end a halt early.
- **A halt is for a deployment in a healthy state.** The evidence is silence, and a process that
  never received the signal is silent in exactly the same way as one that obeyed it. It is not a
  recovery tool.
- **Nothing is made up afterwards.** A pulse whose interval fell inside the window is not called
  late; a delayed call due inside it is dispatched when the deployment is back, subject to its own
  `overdue`.

### What a component author does differently

Nothing, to keep working. What changes is what a component started itself:

```javascript
// rc/poller.js

export function preflight(context) {
  context.state.poller = setInterval(() => poll(context), 1000)
}

export function pause(context) {
  clearInterval(context.state.poller)
}

export const resume = preflight
```

`pause` runs while the component is whole and still serving, which is the one moment it can release
what the runtime cannot see. What it released is taken again in one of two places: `preflight`,
where the process went down and the component that came back is a new one, or `resume`, where the
halt was called off and it is the same component with the same `context.state`. A component that
exports `pause` and no `resume` is refused at start, because the second case is one nothing else
covers.

## The changes, by area

1. **`Connector`.** `halt()` and `restore()` walk the tree beside `connect()`/`disconnect()`, with
   `pause()`/`unpause()` as the hooks a connector overrides. The walk is governed by where it has
   been; the flag by whether a connector has already stopped, so a subtree below one that has is
   still reached. A dependency taken on after the walk has gone by inherits the phase.
2. **`Gate`.** What a halt takes down and builds again. It owns its subtree rather than depending
   on it: a connector with a live dependant refuses to disconnect, and the one way past that
   refusal skips the graceful close with it. Everything above a gate outlives a halt — the
   readiness probe, whatever answers on a bound port; everything a gate holds is rebuilt.
3. **`Workload`.** `quiesce()`, `cancel()` and `stop(seconds)`. The window is measured from the
   signal rather than from the end of the teardown, so every process comes back at one instant
   however long its own teardown took. A rebuild is tried once and a failure ends the process, the
   way a boot failure does.
4. **Sources.** The gateway answers `503` with `retry-after` before parsing; `Pulse` and
   `Dispatcher` clear their timers and disarm what they had armed; the node bridge's `pause` and
   `resume` run commands reach a component.
5. **The signal.** `introspection.signals` is an ordinary entity component: a `POST` creates a
   record, the prototype's `created` event is published by the outbox, and every process subscribes
   with no consumer group, which is a queue of its own per process. The record carries `seconds`,
   `quiescence` and `grace`; a stop carries the id of the halt it answers.

   **What a halt may ask for is the deployment's own say**, annotated as two pairs of bounds and
   read off `GET /introspection/signals/` — the configuration of the signals there are — by
   whoever writes one. Every process holds a
   signal to the same pair, read from the same annotation, so a halt asking for more than the
   deployment allows is carried out as the nearest thing it does. How long a deployment takes to
   drain and how long it can afford to be down are not the runtime's to know; what the runtime
   holds is where an application says nothing.
6. **The check.** A quiesced process puts its `Reporter` on a one-second flush period, waits the
   quiescence out plus a gap for a flush to be published and merged, and reads
   `introspection.edges` with `UPDATED > CREATED` in this region. Every call the decision rests on
   carries a deadline, and what does not answer counts as activity.
7. **Refusal.** `Component.invoke` throws `Disposed` where the tree it belongs to has been taken
   down, so a forgotten interval is loud rather than quietly served. While a process is halted the
   rejection is reported instead of ending the process; once it is working again it is fatal, since
   a stale context in a live process is a defect.
8. **The build.** With halts on, a component declaring `introspection: false` fails the build: the
   check is the map, so a component the map does not describe could be called while the deployment
   is declared still. `introspection.samples: false` is untouched — it suppresses the payload of a
   call, not the record that one was made.

## Decisions

**A halt waits for in-flight work rather than interrupting it.** An earlier revision had a closing
connection give up its outstanding replies, which made a teardown terminate under load. It was
withdrawn along with the comq change that enabled it: both ends of a call are comq, and a sender
whose reply is lost sends again, so the hole it closed was not one.

**Consumption keeps running through the quiet.** Gating deliveries above comq was considered and
rejected: a refusal walks the retry ladder — `[1000, 3000, 5000, 10000]` for a request — so a quiet
of any length would park the backlog into `comq.parked.*` within about nineteen seconds. Nothing
adds to the queues while the sources are off, so leaving consumption alone empties them instead,
which is the state to be in when what comes next is replacing the broker they live in.

**The evidence is the map, not a roster.** There is no roster of processes in this repository, and
discovery is announcement-driven and lossy on purpose. The map is what every process already
writes, and a flush that observed nothing writes nothing, so silence in it is evidence that costs
nothing to produce.

**The decision is unilateral, over a closed interval agreed by everyone.** Agreement was tried and
cannot be had: `UPDATED` is one field overwritten in place, so an edge flushed inside a window and
again after it *leaves* that window, and a later reader sees fewer rows than an earlier one. The
[peers](https://temich.net/notes/peers/) pattern, which cadence and the outbox are built on, hangs
agreement on an atomic read point, and this has none. So the design stops needing one.

**A process that means to give up waits one further grace, listening.** Someone is always last to
catch on. A process about to leave may be a beat behind one that has just called the stop, and if
it left on its own timing the deployment would end half down. The grace is the only thing
preventing that, and it is not a number to tune: it is the time the fleet gives whoever is slowest.

**A stop errs toward being called early.** The most optimistic observer wins, and a call whose edge
has not been flushed yet is invisible to it. What that costs is bounded by guarantee 2: the process
holding such work waits for it, finishes its teardown late, and rejoins on the absolute deadline.
A process's own count of what it is handling is deliberately left out of the check — declining to
assert never makes a halt safer, since another process asserts instead, and counting it would make
an explorer replica look busy whenever it was serving somebody else's check.

**A signal is a record and nothing is written back to it.** `CREATED` says when a halt was asked
for and `seconds` how long it was for, so whether one is on is read off the record. The write that
would retract it is the one thing a halted deployment cannot do.

**The role is `system:halt`.** Reading the service map and stopping the product are not one
authority, and the map's role is already held by whoever draws it.

## Context

The `halt` branch implemented the teardown half of this and was parked: under load a process could
not finish halting while it waited for a reply from a process that had already halted, and under
load such a process always exists. The quiet is what removes that — by the time anything closes,
there is nothing outstanding to close over.

A streaming reply is, to everything that tracks work, a reply that happened at the start of the
stream: the consumer callback returns once the stream is handed over. It neither holds a quiet open
nor appears in the check, and its tail is cut at the stop. comq states that a stream's tail is not
guaranteed; what is worth saying is that a halt is a moment an operator chooses.

## Verification

- A quiet deployment stops, and comes back on its own. Every socket each process holds to the
  broker, the database and the cache is counted with `ss -tnp`, in processes forked for the
  scenario — what a process counts as in flight and what it has been told are ambient, so two of
  them in one Node process would answer for each other.
- A deployment with a component that keeps its own time is not stopped, and every process works
  again holding what it held.
- A deployment whose map cannot be read is not stopped: the explorer is killed mid-quiet.
- A stop is discarded by a process that is quiesced for another halt, for none, or that has already
  given up.
- A process goes quiet and comes back with nothing rebuilt; a call through a tree that has been
  taken down is refused.
- The parked branch's own eight: a call, the database, the cache, atomicity's registration, an
  event and its receiver, a pulse, and a delayed call either side of a halt.

## Compatibility

`introspection.halt` is off by default, and a deployment that has not asked for halts gets no
`signals` component at all. The run commands are additive. The `Disposed` refusal is new behaviour
for a call made through a component that has been taken down, which until now was served.
