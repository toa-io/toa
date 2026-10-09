# Calls of a retried transition

## Design concept

An operation that declares `once` is applied once for a call however many times the call arrives,
and a chain of them holds because a call an operation makes takes its identity from the call it is
serving. A transition declared `concurrency: retry` breaks that from inside: its algorithm runs
again where its write is lost, the call the second attempt makes is another call to whatever it
reaches, and what declared `once` is applied twice. So a retried transition does not call an
operation that declares `once`: the call is refused where it is made.

### Guarantees

**What is refused**

1. A call to an operation that declares `once`, made by a transition declared `concurrency: retry`,
   is refused. The refusal is on the caller's side and before anything is sent, and it is an
   `Unrepeatable` exception, which is permanent.
2. It is refused on every attempt, the first included, so an operation that makes such a call fails
   the first time it runs and not only where a write happens to be lost.
3. It is refused however the call is made: `context.remote`, `context.local`, and as a task.

**What is untouched**

4. A retried transition calls an operation that does not declare `once` as it does today: once per
   attempt. Nothing was promised of that call, and making it safe to repeat is the author's.
   _(today)_
5. A transition declared `concurrency: none` calls what it likes, and a chain of `once` holds
   through it. _(today)_

**What is not promised**

6. Only the call the retried transition makes itself is refused. An operation it calls that calls
   one declaring `once` in turn is not seen from here; that hop does not declare `once`, and is a
   break in the chain as any such hop is.

### What a component author does differently

A retried transition that calls an operation declaring `once` becomes one of:

```yaml
operations:
  relay:
    type: transition
    scope: entry
    concurrency: none # whoever called meets the conflict
```

or changes its entry alone, with the call made by a receiver of the event the change publishes; or
is called, together with the other operation, by an effect.

Where what is called is safe to repeat by what it is — it is keyed by something the caller passes,
and a second arrival finds the first — it does not need `once`, and without it the call is made as
before.

## The changes, by area

1. **Core.** A code, `Unrepeatable`, permanent. `Operation` says whether it is retried, which a
   `Transition` declared `concurrency: retry` is; `Component.invoke` puts that in scope with the
   invocation; `Call` knows whether what it calls declares `once`, and refuses under a retried
   invocation.
2. **Boot.** A call is built knowing whether its operation declares `once`.
3. **Fixtures.** `mongo.caller.relay` is `concurrency: none`.
4. **Documentation.** `documentation/design.md` on what `concurrency` says, `documentation/inbox.md`
   on what a chain of `once` needs.

## Decisions

1. **Refused, rather than made to work.** The identity of a call is derived from the call being
   served and its ordinal among the calls made to that endpoint, and the ordinal is counted across
   attempts. Counting from zero on each attempt gives the second attempt the first one's identity —
   and an attempt is made because the entry moved, so it may ask for something else and be
   answered with what the first asked for. Deriving the identity from the input as well tells the
   two apart, and then both are applied. One answers wrongly and the other writes twice.
2. **Only what declares `once`.** A call to an operation that declares nothing is repeated by a
   redelivery and by a client as much as by an attempt, and its author already answers for that.
   What is refused is the case where the runtime promised and cannot keep it.
3. **Where the call is made, not where the component boots.** What an operation calls is not
   declared: a remote is resolved when an algorithm reaches for it. Guarantee 2 is what makes a
   refusal at the call as good as one at boot for anything that is run once before it is shipped.
4. **A code of its own.** It is neither a readonly chain nor a contract that did not fit, and
   whoever meets it has to be told which declaration to change.

## What happens today

Every attempt makes every call, and the call of a second attempt carries an identity of its own.
What it reaches is applied again, whether or not it declares `once`.

## Verification

1. A retried transition that calls an operation declaring `once` is refused with `Unrepeatable`,
   and neither writes.
2. A retried transition that calls an operation declaring nothing answers, and both write.
3. A chain of `once` holds across a hop made by a transition that does not retry.

## Compatibility

Breaking in behaviour: a transition declared `concurrency: retry` that calls an operation declaring
`once` raises on that call.

Nothing changes on the wire. `Unrepeatable` is a new code, `604`.
