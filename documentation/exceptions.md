# Errors and exceptions

## TL;DR

```javascript
async function transition(input, entity, context) {
  if (entity.balance < input.amount) return ERR_INSUFFICIENT_FUNDS // an answer

  entity.balance -= input.amount

  return entity
}

const ERR_INSUFFICIENT_FUNDS = new (class extends Error {
  code = 'INSUFFICIENT_FUNDS'
})()
```

```yaml
# component.toa.yaml
operations:
  debit:
    errors: [INSUFFICIENT_FUNDS]
```

Return an error for an outcome you expect. Never throw for one.

## An error is an answer

An operation that refuses says so by returning an `Error` with a `code`, and by declaring that
code in `errors`. Refusing is the operation working, so an error is a value like any other reply:
it is not logged as a failure, nothing is retried because of it, and nothing is alarmed by it.

A code you have not declared is not an answer your operation makes, and the runtime refuses the
reply rather than passing an unknown code to whoever called. On a local run it says so; declare
the code, or return something else.

Errors are ordinary objects. Anything else enumerable on the error reaches the caller with it:

```javascript
const ERR_LOCKED = Object.assign(new Error('Account is locked'), {
  code: 'LOCKED',
  until: '2026-01-01'
})
```

## An exception is not

Anything thrown is a failure nobody chose — a bug, or something the operation depends on being
away. You do not throw one on purpose, and there is nothing to declare.

The runtime treats the two differently in every place that follows, so the distinction is worth
keeping even where throwing would be shorter. An exception you throw to mean "no" is a failure
the system will try to recover from.

## What a caller gets

A call answers with the operation's output, or with the error it returned:

```javascript
const reply = await context.remote.accounts.debit({ input, query })

if (reply instanceof Error) {
  if (reply.code === 'INSUFFICIENT_FUNDS') return ERR_DECLINED
  else return reply // pass it on
}
```

An exception is not a value: it is thrown where the call was made. Catching it is rarely what you
want — an operation that lets it through answers with a failure of its own, which is usually
right.

## Over HTTP

| what the operation did                             | status                       |
| -------------------------------------------------- | ---------------------------- |
| returned an error                                  | `422`, the error as the body |
| was given a request that does not fit its contract | `400`                        |
| worked on an entity that is not there              | `404`                        |
| was given a version that has passed                | `412`                        |
| lost a race, or refused a duplicate                | `409`                        |
| was called on a process that holds no such name    | `404`                        |
| went unanswered before its caller stopped waiting  | `504`                        |
| anything else                                      | `500`                        |

`500` is the answer to a failure nobody described, which includes an operation whose _reply_ does
not fit what it declares. That is the component's mistake rather than the caller's, so it is not
reported as one.

## Where nobody is waiting

An event a component receives, and a task, are handled with nobody waiting for an answer. What
the operation returns goes nowhere, so the two outcomes mean something different there:

- **An error is an outcome.** The message is done with. If a refusal needs to be visible — a
  compensating event, a record written — the operation writes it, because nothing else will.
- **An exception is not.** The message is tried again, after a wait that grows with each attempt.
  If it keeps failing it is kept, somewhere an operator can find it and put it back, and you will
  hear about it. A failure that cannot pass on a later attempt — a request that does not fit the
  contract, or a [call gone round in a circle](/documentation/cycles.md) — is kept at once
  instead, because trying it again is only a way of failing again.

So an operation a receiver invokes **may run more than once for one message**, and nothing
deduplicates it for you. Write it so that handling the same message twice leaves the same state:

```javascript
// runs twice, debits twice
entity.balance -= input.amount

// runs twice, ends the same
entity.balance = input.balance
```

Where that is not possible, the message carries what tells you it is a repeat. An event carries
the `VERSION` of the record it is about, which only ever grows, so a receiver can keep the last
one it applied and skip anything it has seen:

```javascript
async function transition(input, entity) {
  if (entity.applied >= input.VERSION) return entity // already handled

  entity.applied = input.VERSION
  entity.total += input.amount

  return entity
}
```

And an effect that leaves the system — an email, a payment, a call to a third party — is repeated
in full on every attempt. Either make it safe to repeat, or write down that you did it in the same
state change that does it, and read that first.

## What not to do

**Do not throw to refuse.** A thrown refusal is retried for minutes and then parked as though
something were broken.

**Do not catch what you cannot answer.** An operation that swallows a failure from below returns
a wrong answer instead of a failure, and nothing retries a wrong answer.

**Do not assume once.** Anything an event or a task reaches runs again if it fails, and the run
before it may have got halfway.
