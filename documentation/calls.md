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

**An operation the component does not have is refused.** A call naming one is answered with an
`EndpointException`, by a component that is running. This is what a call gets while a deployment
is adding the operation and a process of the release before takes it — see
[contracts](/documentation/contracts.md#while-two-versions-serve).

## What calls share

Every ordinary call to a component arrives on one queue, whichever of its operations it is for,
and the processes serving that component take them in turn. A process holds up to 300 calls
unanswered at once, across all of the component's operations. So an operation slow enough to fill
that holds back the component's other operations, in that process, until some of its calls are
answered.

Where that matters, the operation belongs in a component of its own — which is the same boundary
that decides what is deployed and scaled together.
