# Ordinary calls wait

## Design concept

An ordinary call — one that names no process — waits for its reply for as long as the reply takes.
It takes no `timeout` and no `signal`, and a call that names either is refused before anything is
sent. A deadline stays where something needs it: the addressed call, whose process may be gone for
good.

### Guarantees

1. A call to an ordinary operation that names a `timeout` or a `signal` is refused with
   `RequestContract`, and nothing is sent. So is a task *(today)*.
2. An ordinary call is answered, or fails with what its operation answered. Nothing on the caller's
   side ends it.
3. An addressed call takes both, and waits the context's default without a `timeout` *(today)*.
4. The types `toa types` writes take `Options` for a call to a stateful operation only, and offer
   `task` on an ordinary one only — a task to a stateful operation is refused *(today)*.

**What is not promised**

5. A signal that aborts while the component being called is still being looked up ends that wait,
   whatever the operation turns out to be: whether it is stateful is only known once it is found.

### What a component author does differently

Nothing, unless an operation passed a `timeout` or a `signal` to an ordinary call. That call is now
refused, and the argument is removed:

```typescript
await context.remote.math.calculations.sum({ input })
```

## The changes, by area

1. **The call.** `Call` refuses a `timeout` or a `signal` given to a call to an ordinary operation,
   and hands the transmission terms only for an addressed call.
2. **The AMQP binding.** An ordinary call is sent with `comq`'s `request`, which is given nothing
   beside the request; only `call` is given a `timeout` and a `signal`.
3. **Types.** `toa types` writes `options?: Options` on the signature of a stateful operation
   only, and `task?: boolean` on the signature of an ordinary one only.
4. **Documentation.** [Stateful operations](/documentation/stateful.md) says that only an addressed
   call waits for a set time.

## Decisions

**Refused, not ignored.** A `timeout` that is dropped in silence leaves its caller believing it is
bounded. Refusing it is what the call already does to a task that names one.

**Refused in `Call`, not by the types alone.** The types are what an author reads, and the refusal
is what holds for a caller that does not use them — JavaScript, or a request built at runtime.

**`signal` goes with `timeout`.** A signal ends the wait and leaves the call in its queue, where it
may still run. That is the same trade as a timeout, without even the expiry that drops what nobody
took.

## Context

[Stateful operations](/discussions/stateful.md) gave every call a `timeout` and a `signal`, and an
ordinary call one only where its caller set it. comq had removed the request timeout before that
design, on the grounds that it is built for eventually consistent systems, where a reply comes sooner
or later, and brought it back alongside the call under a key. Nothing in the runtime or its extensions
sets a deadline on an ordinary call, and parking — which keeps a request nobody could answer, along
with who asked — only means something to a caller that is still waiting.

## What happens today

An ordinary call given a `timeout` is published with that much expiry, and is *abandoned* when it
passes or when its `signal` aborts. A call already taken runs to its end, and its reply is discarded.

## Verification

- a call to an ordinary operation that names a `timeout` is refused, and never runs;
- the unit suite of `Call` refuses a `signal` on an ordinary call, and hands an ordinary call no
  terms;
- `toa types` writes no `options` on the signature of an ordinary operation, and no `task` on the
  signature of a stateful one.

## Compatibility

**In behaviour, breaking for a caller that set a deadline on an ordinary call.** Such a call is
refused where it used to be abandoned at its deadline.

**In types, narrowing.** The generated signature of an ordinary operation loses its second argument,
and that of a stateful operation loses `task`, which a call to it was refused for anyway.

**On the wire, none.** Nothing a call carries changes. The binding stops passing options to comq's
`request`, which the comq release removing them requires, and which works with the one in use now.
