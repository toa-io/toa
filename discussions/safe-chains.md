# Safe operations read

## Design concept

An operation is safe where it cannot change the State: an observation, a computation. Today that
is said of the operation alone, and a computation that calls a transition changes the State all
the same. So it is said of everything it reaches: a call made by a safe operation may only read,
as a call made under [a request that may only read](./readonly.md) may.

### Guarantees

**What is refused**

1. A call to a `transition`, an `assignment`, an `effect` or an `unmanaged` operation, made by an
   `observation` or a `computation`, is refused. The refusal is on the caller's side and before
   anything is sent, and it is a `Safety` exception. _(today, under a readonly request)_
2. It is refused whatever the request the safe operation is serving says: one that arrived by a
   `POST`, as a task or by an event is held to it as one that arrived by a `GET` is.
3. `context.delay` is refused on the same terms: arming a delay is a write. _(today, under a
   readonly request)_
4. A call to an `observation` or a `computation` is made as it would be otherwise.

**What carries it**

5. A call a safe operation makes is readonly, and so is every call below it. _(today, for a request
   that states it)_

**What follows**

6. A chain that has passed through a safe operation reaches nothing that changes the State, however
   far down. Safe is a property of the call tree under an operation, and no longer of the operation
   alone.

**What is not promised**

7. An aspect is outside it, as it is outside a readonly request: a request made through `fetch`, a
   lock taken through `context.atom`. _(today)_
8. An effect that only reads is not safe. It is the type for what reaches outside, and what it
   reaches is not the runtime's to read. _(today)_

### What a component author does differently

An observation or a computation that calls an operation that may change the State is an effect:

```yaml
operations:
  checkout:
    type: effect # was a computation, and it calls `orders.place`
    scope: none
```

## The changes, by area

1. **Core.** `Operation` says whether it is safe, from its type. `Component.invoke` puts a safe
   operation's invocation in scope as one that may only read, as it does where the request says so.
2. **Fixtures.** `safety.proxy` gains an effect that writes through another component, which is
   what its computation was showing.
3. **Documentation.** `documentation/readonly.md` on where a chain begins, and the safety section of
   `documentation/design.md`.

## Decisions

1. **The readonly chain, not a rule of its own.** What a safe operation may reach is what a request
   that only reads may reach, down the whole call tree, and that is already stated, carried and
   enforced. A safe operation is one more place a chain begins.
2. **No opt-out.** A route says `io:readonly: false` because a verb is HTTP's word and may be the
   wrong one for what the route does. An operation's type is the author's own word for what it is,
   and the way to say otherwise is to declare the other type.

## What happens today

A safe operation calls what it likes, unless the request it is serving is readonly.

## Verification

1. A computation that calls a transition is refused with `Safety`, under a request that says
   nothing of reading, and nothing is written.
2. A computation that calls an observation answers.
3. An effect that calls a transition answers, and the transition writes.

## Compatibility

Breaking in behaviour: an observation or a computation that calls an operation that may change the
State, or arms a delay, raises on that call. It is declared an effect instead.

Nothing changes on the wire or in types.
