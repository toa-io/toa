# Tasks

A task is a call nobody waits for. The caller hands it over and carries on; the operation runs
later, in whichever process is free to take it.

```javascript
await context.call('todos.tasks.archive', {
  query: { id },
  task: true
})
```

The call answers `null` as soon as the broker has the message. What the operation returns goes
nowhere, and neither does what it refuses — see [errors and exceptions](/documentation/exceptions.md).

## What a task is for

Work the caller's answer does not depend on: an export to build, a mailbox to sweep, a projection
to rebuild. A caller that needs the result asks for it, and a caller that needs to know it happened
reads the state the operation left.

## What it costs to get wrong

**It runs again if it fails.** An exception is retried, after a wait that grows with each attempt,
and a task that keeps failing is kept where an operator can find it. So an operation a task reaches
may run more than once for one message, and nothing deduplicates it for you — write it so that
handling the same message twice leaves the same state. See
[where nobody is waiting](/documentation/exceptions.md#where-nobody-is-waiting).

**A refusal is silent.** An error is an answer, and nobody is reading this one. If a refusal has to
be visible, the operation writes it: an event, a record, a state the caller can read.

**It has no deadline.** A task names no `timeout` and no `signal`; the call is refused if it does.
Nothing ends a task early, and a task queued against a component that is down waits for it to come
back.

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
