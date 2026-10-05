# An error is a code and a cause

## Design concept

An operation refuses with `new Error('CODE', { cause })`. The message is the code, the cause is
whatever the caller needs besides, and nothing else on the error travels.

### Guarantees

**What is returned**

1. An `Error` an operation returns is a refusal, and its message is the code. _(the `Error` —
   today)_
2. `cause` reaches the caller as it was given, where JSON can hold it.
3. Nothing else on the error reaches anybody: no property of its own, no `code` field, no stack.
4. An `Error` returned with an empty message is a reply that does not fit the contract — an
   exception, in every environment.
5. A code is a string, and one the operation declares in `errors`. An undeclared one is refused
   on a local run. _(today)_

**What is received**

6. A call resolves to an `Error` with `code`, `cause` where there was one, and `message` equal
   to the code. It is thrown nowhere. _(resolving — today)_
7. Returned as it was received, it arrives at the next caller the same.
8. In generated types it is `CodedError<'A' | 'B'>` of the declared codes: `Error & { code }`.
9. Over HTTP it is `422` with `{ code, cause }` as the body.

**What is not promised**

10. A `cause` JSON cannot hold: an `Error`, a `Map`, a date as a date.
11. A message other than the code. Text for a person is not part of an error.

### What a component author does differently

```javascript
async function transition(input, entity) {
  if (entity.balance < input.amount)
    return new Error('INSUFFICIENT_FUNDS', { cause: { balance: entity.balance } })
}
```

```javascript
const reply = await context.remote.accounts.debit({ input, query })

if (reply instanceof Error && reply.code === 'INSUFFICIENT_FUNDS') reply.cause.balance
```

## The changes, by area

1. **Core, where a reply is made.** An `Error` an algorithm returned becomes
   `{ code: error.message, cause: error.cause }` before a binding sees it, so every binding
   carries one shape. An empty message is `ResponseContractException`.
2. **Core, where a reply is received.** The error a call resolves to is made from the code, with
   `code` and `cause` its own enumerable properties, so whatever copies or serialises it — the
   gateway's body, a kept answer, a workflow report — yields `{ code, cause }`.
3. **The contract.** A reply's error is `{ code, cause }` and nothing besides. `errors` in a
   manifest lists strings.
4. **Types.** `RemoteError` is `CodedError`. The generator writes that name.
5. **Continuity.** An answer kept is given back with its message and its cause.
6. **The gateway.** Octets, JSON-RPC and MCP answer a refusal with its code where they answered
   with its message.
7. **Shipped components.** Each error is `new Error('CODE')`.
8. **Documentation.** `documentation/exceptions.md`, and the migration note.

## Decisions

**The message is the code, rather than a `code` field beside a message.** `new Error('CODE')`
is the constructor everybody knows, and it leaves one string on an error to be the thing a caller
branches on. A class with a `code` field was the only form that worked, because only an own
enumerable property survived the wire — a rule nobody would guess.

**One form, not two.** An own `code` is not read where the message is empty. Accepting both keeps
two ways to say one thing in the runtime for good, and the form left behind fails loudly rather
than quietly: an exception on the first refusal, not an empty code in production.

**`cause`, rather than any enumerable property.** What travelled was whatever happened to be
enumerable, so a class field was sent and a constructor argument was not. `cause` is the one
place the language gives an error for what came with it.

**No message for a person.** The text shipped errors carried reached HTTP bodies, where it was a
second contract nobody declared. A client branches on the code.

**`CodedError`, not `RemoteError`.** A local call resolves to the same error, so it is not what
is remote about it that the name should say.

**Normalised in core, not in the bridge.** The loop binding hands a reply over by reference, so
a shape made any later than the operation would differ between an in-process call and one over
the broker.

## Context

[`exception-handling`](./exception-handling.md) separates an error from an exception. This
change is about what an error is made of.

## What happens today

The Node bridge passes the returned `Error` on as it is. A binding serialises it as JSON, which
keeps own enumerable properties alone, and the caller assigns those onto a new `Error`. So
`new Error('CODE', { cause })` arrives with nothing on it, a `message` arrives only where it was
declared as a class field, and the reply contract — checked locally — requires a `code` property.

## Stages

1. This discussion, the documentation and the migration note.
2. Scenarios: a returned error is received with its code, message and cause; passed on, it
   arrives the same; an empty message is an exception; the gateway answers `{ code, cause }`.
3. Core: the reply made, the reply received, the contract.
4. `CodedError` in types and the generator.
5. Continuity, the gateway's readers of `message`.
6. Shipped components and fixtures.

## Verification

- A returned error is received with its code, its message and its cause —
  `features/operations/reply.feature`
- An error passed on arrives as it was — `features/operations/reply.feature`
- An error with no message is an exception — `features/operations/reply.feature`
- The gateway answers a refusal with its code and its cause —
  `extensions/exposition/features/response.feature`
- A kept refusal is given back with its cause — `features/continuity/replay.feature`
- A call resolves to a `CodedError` of the declared codes — `features/cli/types.feature`

## Compatibility

**On the wire.** A caller on this release reads `code` and `cause` from an error an earlier
release made and ignores the rest. An earlier caller assigns `{ code, cause }` onto its error.
The two interoperate while a deployment rolls.

**In types.** `RemoteError` is gone; `CodedError` is its name.

**In behaviour.** Breaking for every component that returns an error: see
[`migrations/325`](../migrations/325.md).
