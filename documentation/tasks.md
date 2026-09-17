# Tasks

A task is a call nobody waits for. The caller hands it over and carries on; the operation runs
later, in whichever process is free to take it.

```javascript
await context.call('todos.tasks.archive', {
  query: { id },
  task: true
})
```

**A task that was accepted will run.** The call answers `null` once the task is safely queued, and
from then on it is the runtime's: it outlives the caller, it outlives a restart of anything it is
waiting for, and a failure has it tried again rather than dropped.

## What you can count on

**It is kept before the call answers.** The call does not answer until the task is stored, so a
caller that crashes the instant after has nothing left to do. A call that raised is a task that
may or may not have been taken, like any other message whose acknowledgement went missing — which
is the same thing that makes a task run more than once.

**It survives what it is queued against.** A component that is down, redeploying or not yet
started is given its tasks when it comes back. Nothing expires while it waits, and nothing
gives up on it.

**A failure does not lose it.** An exception has the task tried again, after a wait that grows with
each attempt. One that keeps failing is kept where an operator can find it and put it back, with
what it was and why it stopped, and you hear about it. See
[where nobody is waiting](/documentation/exceptions.md#where-nobody-is-waiting).

## What that asks of you

**It may run more than once.** What is guaranteed is that a task runs, not that it runs once: a
process that dies mid-task hands it back, and a retry starts the operation again. Nothing
deduplicates it for you — write it so that handling the same task twice leaves the same state.

```javascript
// runs twice, debits twice
entity.balance -= input.amount

// runs twice, ends the same
entity.balance = input.balance
```

And an effect that leaves the system — an email, a payment, a call to a third party — is repeated
in full on every attempt. Either make it safe to repeat, or write down that you did it in the same
state change that does it, and read that first.

**A refusal ends it, and nobody reads it.** An error is an answer, and this one is answered to
nobody: it stops the task, and it is not tried again. If a refusal has to be visible, the operation
writes it — an event, a record, a state the caller can read.

**It has no deadline.** A task names no `timeout` and no `signal`; the call is refused if it does.
Nothing ends a task early, so work that stops being worth doing has to be written so that it can
tell — the state it reads says so, or it does nothing.

## What takes no task

**A stateful operation.** It is served under the name of one process, and a task is taken by
whichever process is free — so a call that is both is refused where it is made. See
[stateful operations](/documentation/stateful.md).

## What tasks share

Every task a component is given arrives on one queue, whichever of its operations it is for, and
the processes serving that component take them in turn. So a backlog of one operation's tasks
delays another's, and an operation that takes minutes is felt by every task of its component.

Where that matters, the operation belongs in a component of its own — which is the same boundary
that decides what is deployed and scaled together.
