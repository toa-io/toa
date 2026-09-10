# Transactional inbox

## Design concept

A call may arrive more than once, and nothing about it says so. The broker redelivers what was not
acknowledged, and the library re-sends on its own account: `comq` re-sends a request whose reply was
lost, and republishes a message whose handler threw, up to five times. The first of those fires
precisely when the operation probably ran and the answer was lost on the way back.

What Toa offers against this today is advice — userland should be idempotent — and that is advice
about the hardest thing in the system to get right, given to the person least able to check it.

An operation that asks for it changes state once instead.

A call carries an **identity**, written by the side making it, travelling in the message. The side
receiving one never invents anything; an arrival with no identity is an arrival from outside the
system.

When an operation that opted in commits, the identity is written into the component's own database
**in the same transaction** as the entity and the outbox rows, with the identity as the primary key.
A second arrival finds the key taken, its transaction is refused, and the state is left exactly as
the first arrival left it. The record holds the reply the first arrival gave, and the duplicate is
answered from it — so a retransmission is invisible to whoever made the call, which is the whole
point of catching it.

An identity is **derived from what caused it**. A call an operation makes takes its identity from the
call being served; a message takes its identity from the outbox row it was published from. One
duplicate therefore produces one set of identities the whole way down, and every component along the
way refuses its own copy against its own key. An identity is minted only where a call has no cause
inside the system — the gateway, the CLI, a pulse.

Nothing is claimed in advance and nothing else is stored. A record exists for a call that changed
state and for no other, which is what makes the whole of it one atomic write: no lease to renew, no
claim to release, and no state a crash can leave behind. Ahead of it sits one read, so that an
identity already recorded is answered without the algorithm running at all. That saves the work; it
is not what makes the guarantee hold.

### Guarantees

What the finished feature promises. Those marked *(today)* already hold, and are listed so the whole
is readable at once.

**A call to an operation that declares `once`**

1. A call that changed state changes it once, however many times it arrives.
2. A duplicate is answered with the reply the first arrival gave. It is not refused, and whoever
   called cannot tell the two apart.
3. A call that changed nothing is not remembered. An operation that refused with a declared `error`,
   or that raised, is run again by a duplicate and answers the same way. Nothing changed either time.
4. A duplicate is recognised for as long as the record is kept, and no longer.

**A chain**

5. The outgoing calls a duplicate makes carry the identities the first run gave them, and are refused
   where they land — for as far along the chain as every hop declares `once`. A hop that does not is
   a break in it.
6. A message is delivered at least once, and a receiver's state change happens once however many
   times it arrives, where the operation it invokes is a transition that declares `once`.

**What is not promised**

7. The algorithm may run more than once for one call. A duplicate arriving while the first is still
   in flight runs to completion before its commit is refused, and every attempt of a transition
   declared `concurrency: retry` re-runs it — up to about ninety seconds of re-running within one
   call.
8. What an operation does outside the system — `context.fetch`, `context.stash`, a third party —
   happens once per run, not once per call. Those remain the author's to make safe.
9. Publication stays at-least-once, and nothing is promised about order. *(today)*

### What a component author does differently

Declare it, on the operation that needs it:

```yaml
# manifest.toa.yaml
operations:
  charge:
    type: transition
    scope: object
    concurrency: retry
    once: true
```

Then:

- A retried or redelivered call no longer double-charges, and the caller gets the same answer it
  would have got the first time.
- Refusing by returning an `error` is still the business logic working, and it is not remembered: the
  same call may be made again and refused again.
- Effects outside the component's own state are still theirs. `once` is about what is written, not
  about what is sent.
- An operation that calls out should make the same calls in the same order given the same input, so
  that a re-run's calls line up with the first run's and are refused downstream. This is the
  determinism idempotency assumes in any case.

## The changes, by area

1. **The identity.** `Request.id`, a uuid hex, stamped by the caller in `Call.invoke` — the one place
   every request in the system passes through, and where `source`, `telemetry` and `trail` are
   stamped already. Its value is derived from the request the calling process is itself serving,
   where there is one, and minted where there is not. The identity being served, and a counter
   telling one outgoing call from the next, ride the ambient store `trail.ts` already keeps for the
   circuit breaker, whose shape grows to hold them; the store's symbol changes with it, because it
   is deliberately global across module copies.

2. **The envelope.** Today there is no envelope: `Call.invoke` writes `source`, `telemetry`, `trail`,
   `authentic` and a default `input` onto the caller's own object, and `Operation.invoke` rewrites
   `query` in place on the other side. A caller may hand one object to several calls, which `trail`
   works around with `??=` and an identity cannot: concurrent calls must not share one. So the line
   is drawn where the reuse already implies it — what a caller passes is **content**, what the
   runtime adds is the **envelope**, and the envelope is the runtime's own object built around the
   content. `Outgoing` is what a caller may pass; `Request` is `Outgoing` plus what the runtime put
   around it, and `id` is required on it because an operation only ever sees an envelope.

3. **The identity of a message.** `Message.id`, set where the event is published, derived from the
   outbox row and the event's label — derived rather than the row id itself, because one row fans out
   to several events and a component may consume two of them. The row is committed once, so the
   immediate path, the pump and any republication carry one identity. A receiver takes it out of the
   message by name, as it already takes `trail` out by name, and it is the request's identity: a
   component declares at most one receiver per event, so two of them cannot collide.

4. **The identity of a delayed call.** The cadence dispatcher sends the stored row's id, beside the
   chain the row already carries. That id is the delayed call's stable identity — it is what
   `delay` answers as the cancellation handle — and without it every re-dispatch of a due call is a
   new call.

5. **The record.** One document per call that changed state, in `{collection}_inbox` beside
   `{collection}_outbox`: the identity as `_id`, the reply, and a timestamp a TTL index reaps. Read
   before the operation runs; inserted inside the transaction the storage already opens. A duplicate
   key aborts that transaction and is raised as a code of its own, caught outside the operation's
   retry loop so that a duplicate is not retried into the same refusal. The code is **permanent** in
   the classification, because a duplicate is a duplicate on every later attempt, and a message
   refused for it is set aside rather than tried again.

   How long a record is kept is how long a duplicate is caught, and it is a context setting beside
   the outbox's own. An hour, not the outbox's day: the window a duplicate arrives in is the
   broker's redelivery, `comq`'s five requeues and a client's retries — minutes.

6. **Where it may be declared.** On a transition over `scope: object`. `objects` is refused — a set
   is where the reply stops being bounded, and a transition over five hundred records would write
   five hundred records' worth of answer on every call. The manifest schema refuses the rest the way
   it already refuses `concurrency` on an operation that is not a transition.

   An assignment and an effect write too, and neither is covered, because neither knows its reply
   when it writes: an assignment computes it from what the write returns, and an effect writes in
   `acquire`, before the algorithm has run at all. The reply is what a duplicate is answered with,
   so covering them means deciding what a duplicate of one is answered with instead. That is a
   design of its own and it is not made here.

7. **Degradation — there is none.** The record has to commit with the entity, so this needs a storage
   that has transactions: MongoDB on a replica set or a sharded cluster, the condition the outbox
   already carries. A component that declares `once` against a storage that cannot **refuses to
   boot**, and a deployment that is not transactional refuses at startup. The outbox may fall back to
   inline emission because that still delivers; an inbox that fell back silently would deliver the
   opposite of what was asked for.

8. **Documentation.** A page beside the outbox page: what `once` gives, what a duplicate gets back,
   the window retention sets, and the three things under *what is not promised* that a reader will
   otherwise assume away.

## Context

This is the fourth and last stage of
[distributed exception handling](/discussions/exception-handling.md), whose area 4 states it:
*a message carries the identity of the outbox row it came from, and a receiver's state change
records that identity in the same transaction as the entity, so a message delivered twice is written
once.* Stages 1 to 3 are done.

That document scopes the stage to messages and leaves the call path as it is. This one does not. A
call is duplicated by the same library, in the same way, and the record that catches a duplicated
message is the record that catches a duplicated call — building it for one and not the other would
mean opening all of it twice.

It also makes guarantee 10 conditional. The guarantee was written unconditional; the cost is a
transaction where a component that publishes nothing has none today, and a write of the reply on
every call, so it is asked for rather than assumed.

The producer half of this story has been finished for some time: a state change and the intent to
publish commit together, the pump recovers what was not published, and *nothing is dropped* is
written down. The consumer half now keeps a failing message and tries it again. What is left is that
trying it again is what produces the duplicate, and nothing yet catches one.

## What happens today

**Where a duplicate comes from.** `comq` retransmits a request whose reply was lost: `request` is
wrapped in `failsafe`, `#retransmit` rejects every pending reply when the request or reply channel
recovers or a shard leaves the pool, and `failsafe` re-invokes with the same arguments — so the same
payload goes out again, to a producer that has very likely already run the operation. It also
requeues a message whose handler threw, republishing the same content up to five times. Beneath both,
AMQP redelivers what was not acknowledged.

**What survives a duplicate.** The payload, verbatim, in both of `comq`'s mechanisms. So an identity
carried inside the request or the message is the same on every copy, which is what makes any of this
possible without touching the transport.

**What there is to dedup on.** Nothing. A request carries `input`, `query`, `entity`, `task`,
`telemetry`, `source` and `trail`, and none of them identifies the call. A message carries a payload,
a traceparent and a chain. The outbox row has an identity — a uuid v7, committed once with the state
change — and it never reaches the message.

**What a duplicate costs.** A transition runs again in full: the algorithm, its outgoing calls, the
commit, and a second event published from a second outbox row. Nothing anywhere notices.

## Stages

1. **The identity, alone.** The request property and the envelope it belongs to, the derivation and
   the store it reads, the message identity, the receiver, the dispatcher. Nothing consumes any of
   it; everything after it depends on it and on nothing else.
2. **The record, on transitions.** The declaration, the collection and its index, the insert in the
   transaction, the read before the operation, the exception and its classification, the refusals to
   boot, and retention.
3. **The client's own retry.** The gateway honouring an idempotency key, which is the one duplicate
   the runtime cannot otherwise see, because the client makes it.
4. **Assignments and effects**, if they are wanted: what a duplicate of one is answered with, given
   that neither knows its reply when it writes.

## Verification

Cucumber against the compose stack, in the shape `features/events/outbox.feature` already uses —
including its most useful lever: seeding a record directly **is** the state of a call already
answered, so the crash cases are tested without crashing anything.

- the same call twice, one identity — the entity changes once, and both callers get the same reply;
- the same call twice, two identities — it changes twice, because the guarantee is about identity and
  not about input;
- a record seeded, then the call made — the seeded reply comes back, the entity is untouched, and the
  algorithm did not run, proved by the event it would have emitted not arriving;
- a slow call, and the same identity again before it finishes — the second is refused at the commit
  and answered from the record, and the version advanced by one;
- a transition retried through several lost compare-and-swaps — one record, one commit, and one read
  rather than one per attempt;
- an operation that refuses with an error, and one that raises — no record either way, and the next
  call with the same identity runs;
- A calling B, both declaring `once`, A called twice with one identity — B's entity changed once;
- one message delivered twice — the receiver writes once;
- a delayed call dispatched twice — the target's entity changed once;
- an operation without the declaration — no collection exists and nothing is recorded;
- the declaration against a standalone `mongod`, and against a storage with no transactions at all —
  the composition refuses to boot, and says which component and which storage.

Each states a requirement someone depends on, not the mechanism.

## Compatibility

**On the wire, nothing breaks.** The identity is an added property; a request schema admits unknown
properties and a callee skips validation for an authentic request, so an old callee ignores it and a
new one accepts a request without it. The one ordering constraint is a rolling deploy: a new
component with `once` on, called by an old caller, receives no identity and refuses by design. Turn
it on once every caller runs a runtime that stamps one.

**In types, it breaks, deliberately.** `Request` is published, and `id` is required on it, so
anything that constructs one stops compiling and becomes an `Outgoing`. A `Request` stays assignable
where an `Outgoing` is wanted, so passing one on is unaffected. Type-only, and the typecheck finds
every site.

**In behaviour, one small change.** The caller's object is no longer written to — no `authentic`, no
`telemetry`, no `source`, no `trail`, no defaulted `input`, and no schema coercion landing on it.
Only code that relied on undocumented mutation can tell.

## References

The pieces are standard, and naming them is how the documentation should explain them:

- *Idempotent receiver* (Hohpe & Woolf) — the pattern, and the other half of the transactional outbox
  Toa already has.
- [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
  — Standards Track in the IETF HTTPAPI working group, and what the gateway would honour in stage 4.
  Its *idempotency fingerprint* is the same guard from the other side: a key sent with a different
  request is refused rather than answered from the first one.
