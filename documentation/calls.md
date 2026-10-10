# Calls

An ordinary call asks a component for an answer and waits for it. It names an operation, and
whichever process of the component is free takes it.

```javascript
const reply = await context.remote.accounts.debit({ input, query })
```

What a call answers, and what an error and an exception are, is in
[errors and exceptions](/documentation/exceptions.md). A call nobody waits for is a
[task](/documentation/tasks.md), one that names the process it goes to is
[addressed](/documentation/stateful.md), and one that carries a stream is
[streamed](/documentation/streams.md).

## What you can count on

**It waits for the component.** A component that is down, redeploying or not yet started is given
the call when it comes back, and the caller waits until then. An ordinary call names no `timeout`
and no `signal`; it is refused if it does.

**It reaches a process that has the operation.** While a deployment replaces a component, a call
to an operation only one of its two releases has may be handed to a process of the other. That
process says it does not serve it, and the call is sent again, after a pause that doubles from a
tenth of a second, until a process that serves it takes it. So such a call can be answered late,
by seconds, and nothing else changes: an operation is added, and called, in one release.

**An operation no process has is refused, after about three and a half minutes.** Once a call has
been sent again eleven times, or the process that made it begins to stop, it throws an
`EndpointException`. This is what a call to an operation a release removed ends with, and a call
to one whose release never came up.

## What calls share

Every ordinary call to a component arrives on one queue, whichever of its operations it is for,
and the processes serving that component take them in turn. A process holds up to 300 calls
unanswered at once, across all of the component's operations. So an operation slow enough to fill
that holds back the component's other operations, in that process, until some of its calls are
answered.

Where that matters, the operation belongs in a component of its own — which is the same boundary
that decides what is deployed and scaled together.
