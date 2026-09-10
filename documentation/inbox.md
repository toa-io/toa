# Transactional inbox

The same call arriving twice changes state once, and the second arrival is answered with what the
first one answered.

## Asking for it

```yaml
# manifest.toa.yaml
operations:
  charge:
    type: transition
    scope: object
    concurrency: retry
    once: true
```

Per operation, on a transition over `scope: object` or an assignment. An operation that writes
nothing has nothing to record; a transition over `objects` answers a whole set, and the answer is
what a duplicate is given back.

An effect takes it neither way, and does not need to: its write is get-or-create, so a second
arrival of one writes nothing already.

```yaml
# context.toa.yaml
inbox:
  retention: 3600 # seconds a call is remembered
```

Retention is the window a duplicate is caught in. Budget it for how late one can arrive — a
redelivery, the attempts the broker makes of a message, whatever a client retries on — rather than
for how long the change matters. Every call of an operation that declares `once` is a document in
`{collection}_inbox` for this long.

## What it gives

**A call that changed state changes it once**, however many times it arrives.

**A duplicate is answered, not refused**, with the reply the first arrival gave. Whoever called
cannot tell the two apart, which is the point: what produces most duplicates is a request whose
reply was lost on the way back, and its caller is still waiting for an answer.

**A chain of them holds** as far as every hop declares it. A call an operation makes takes its
identity from the call it is serving, so a duplicate that re-runs an algorithm makes the same
calls again and each is refused where it lands. A hop that does not declare `once` is a break in
that.

## What it does not give

**A call that changed nothing is not remembered.** An operation that refused with a declared
`error`, or that raised, leaves no record; the same call made again runs again and answers the
same way. Nothing changed either time.

**The algorithm may run more than once for one call.** A duplicate arriving while the first is
still in flight runs to completion before its write is refused, and a transition declared
`concurrency: retry` re-runs its algorithm on every attempt — which is up to about ninety seconds
of them.

So **what an operation does outside its own state is still yours to make safe**: an email,
a charge to a third party, anything through `context.fetch` or `context.stash` happens once per
run, not once per call. `once` is about what is written.

**An operation that calls out should make the same calls in the same order given the same input.**
That is what lines a re-run's calls up with the first run's, and it is what idempotence assumes in
any case. One that branches on something that moved between the two runs lines them up
differently, and the duplicate is missed rather than answered wrongly.

## What it needs

A storage with transactions, because the record commits with the entity: MongoDB on a replica set
or a sharded cluster. A component that declares `once` against anything else does not boot, and
says which component and which storage. There is no weaker version of this to fall back to — a
call recorded outside the transaction guarantees nothing.

Every caller must be on a runtime that stamps an identity. A call from an older one carries none,
and an operation that declares `once` refuses it rather than run unguarded.

## Operating

```js
db.tea_pots_inbox.countDocuments() // calls remembered right now
db.tea_pots_inbox.findOne({ _id: '<the request id>' }) // what that call answered
```

A record expires by TTL on `at`. There is nothing to clean up and nothing to replay.

## Over HTTP

A client that retries a request the gateway never answered is making a second call, and the
runtime cannot see that it is the same one — the client alone knows. It says so with a key:

```http
POST /orders/ HTTP/1.1
idempotency-key: 3f1c8a2e-...
```

The gateway turns the key into the call's identity, so a retry carrying the same key is the same
call and is answered with what the first one answered. The key is the client's to generate, and
to repeat only for a retry of the same request — the convention is
[`draft-ietf-httpapi-idempotency-key-header`](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/).

Four things make the identity, and each of them means a key stays yours:

- **who is calling**, so a key you picked is not a key someone else picked;
- **the key**;
- **the method and the path**, so one key sent to two routes is two calls — and a key reused
  across two records is not one call about both of them.

Not the body. Sending one key with two different bodies answers you with what the first one
answered, which is what asking for idempotency means.

A route that nothing authenticates has no caller to scope a key by, so two clients of one that
pick the same key collide. Scope a state-changing route with `auth:` or expect that.

A key sent to a method that does not declare `once` is accepted and does nothing. Whether a method
does is in [what it answers about itself](/extensions/exposition/documentation/introspection.md),
as `once`, and the discovery page marks it.
