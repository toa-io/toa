# Halt: why this branch is parked

This branch implements [halt](./halt.md) and works, in the sense that every scenario in it
passes. It is parked all the same, because the scenarios do not exercise the thing that breaks
it, and what breaks it cannot be fixed from inside Toa.

Read this before picking the work up again.

## What is wrong

**A process cannot finish halting while it is waiting for a reply from a process that has
already halted.** Under load there is always such a process, so a halt never completes across
the whole deployment — which is the one thing it exists to do. A database that is being
maintained, a broker that is being replaced, an incident that wants everything to stop: none of
them are served by a fleet where the last process is still connected and still waiting.

## The reproduction

Three processes — `introspection.signals`, `halting.callee`, and `halting.caller`, whose one
operation calls the callee three times a second apart. The call is made, and a halt is
signalled while it is in flight:

```
07:51:08.847  Halting                                       all three
07:51:08.856  Halted                                        signals
07:51:08.905  Halted                                        callee
07:51:38.950  Resumed  ×2
07:51:39.956  Halted late, the teardown outran the window   caller, thirty-one seconds
07:51:40.099  Resumed                                       caller
```

The caller's third call goes to a queue nobody is consuming and waits there for the whole
window. The caller holds every connection it has for those thirty seconds and only lets go once
the callee is back to answer it.

The components are `features/steps/.workspace/components/collection/halting.{caller,callee}`,
kept for whoever picks this up. The runner was a script and is not kept; it forked three
children, each a `Workload` with `introspection.halt` on, and wrote one signal record.

## Where it blocks, exactly

`comq`'s `IO.close` (`source/io.js`):

```js
close = memo(async () => {
  await this.seal()                    // consumers cancelled
  await this.#destroyStreams(this.#replyPipes)
  await track(this)                    // every in-flight consumer callback
  ...
})
```

`track` is `Promise.all` over the callbacks that are still running. The caller's callback is
blocked on its own outgoing request, so `close` cannot return until that request is answered,
and it is answered only when the callee comes back.

Nothing in Toa can shorten this. A call has no timeout and no cancellation, in comq or in Toa,
and both are that way on purpose: the design is eventually consistent, and a call waits for as
long as it takes.

## What is not wrong

Worth knowing, because it narrows what has to be solved:

**A blocked process takes no new work.** `seal()` runs first and cancels the consumers, so a
second call made three seconds into the halt was not served — it waited for the resume. The
process holds sockets; it does not do anything on them.

**The window is absolute.** It is measured from the signal rather than from the end of the
teardown, so a process whose teardown outran the window rebuilds at once with nothing left to
wait, and says so. The skew above is a second, not another whole window. This is what stops one
blocked process from dragging its own halt into everyone else's uptime.

## What was considered and rejected

**Accepting it.** Stating in the guarantees that a process blocked on a halted peer keeps its
sockets. It gives no guarantee at all: under load the case is not exceptional but certain, so a
halt would never be complete, and an operator could not use the window for what the window is
for.

**Bounding the teardown**, and **bounding the call**. Both need a timer, and a call that can be
abandoned. comq and Toa have neither, deliberately. A halt is the wrong feature to decide that
in — and the same answer has been given before, from the other direction: the transactional
inbox refused a claim taken ahead of the work, because *"no lease to renew, no claim to release,
and no state a crash can leave behind"* is what makes it one atomic write
([transactional-inbox.md](./transactional-inbox.md)). A timer in the correctness path was not
wanted there and is not wanted here.

**Halting in topological order**, sources first. It does not help. The caller's outgoing call is
not a source the caller can seal, and the callee is already sealed by the time the call arrives.

## The idea worth trying next

By the time `track()` blocks, the channel is **already sealed**. If close did not wait — if the
channel closed with the delivery unacked — RabbitMQ requeues it by its own rules and the call is
delivered again after the resume. That is at-least-once and not cancellation: no timer, nothing
abandoned that the broker does not already know how to redeliver, and `once: true` is the
existing answer for the duplicate.

It would need two things, and both are decisions rather than patches:

1. **`comq`: a close that does not drain.** `io.close({ drain: false })`, or a separate call.
   How it sits with comq's own retries and dead-letter queues is the open question, and it is
   comq's to answer.
2. **Toa: a torn-down tree that refuses.** The algorithm's promise keeps running — a promise
   cannot be cancelled — and it will go on calling. In the single-process run its third call was
   issued 840 ms after the process had said `Halted`, through connectors that were already
   disposed of, and was served. A tree that has been taken down has to answer such a call with a
   refusal rather than quietly work.

## What is covered, and what is not

Eight scenarios in `features/halt.feature` cover what keeps its own time — a call, the database,
the cache, atomicity's registration, the outbox and its receiver, a pulse, and a delayed call
before and after a halt. Two more in `extensions/introspection/features/halt.feature` cover the
signal itself closing every connection and the process coming back.

Six things live and are **not** covered: introspection's collector flush and its re-announce,
exposition's route announcements and the gateway's discovery, configuration's refresh, the
throttle's sync, and realtime's streams. `TOA_TESTING_*` (`libraries/generic/source/testing.js`)
was added to make the first two shortenable and is applied to introspection's announce and
exposition's expose and ping intervals; nothing uses it yet. A scenario for the collector was
attempted and does not pass — it is not in the branch.

None of that is the reason the branch is parked, and none of it is worth finishing until the
problem above has an answer.

## What was taken out of this branch

Everything here that stands on its own was split onto a branch of its own and does not depend on
halt: `Connector.disposed` and the extension factories that were handing disconnected connectors
to rebuilt trees; `Resident` and the readiness probe becoming the process's rather than the
nearest composition's; `Workload` as a named process root; the MongoDB refcount guard; the
discovery lookup that warned for the life of the process; the outbox failure that logged `{}`.

What stays here is halt itself: `Gate`, `Host.gate`, `Host.halt`, `introspection.signals`, the
listener, the annotation, and the scenarios.
