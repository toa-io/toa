# A request queue per component

## Design concept

Every ordinary call to a component arrives on one queue of its own. It is not named after an
operation, so what a deployment holds on the broker for its calls stops growing with how many
operations its components declare.

### Guarantees

1. An ordinary call to any operation of a component arrives on `<namespace>.<component>..requests`.
   Which operation it is for travels with the message.
2. Any process serving the component takes any of its calls, and which operation a call is for
   does not change who may take it _(today)_.
3. A call for an operation the process that took it does not serve is answered at once with an
   `EndpointException`, saying which operation it named.
4. Calls of one component share a queue and its prefetch, so a process holds no more of them
   unanswered than it held of one operation's before, and one operation's calls in flight count
   against another's.
5. A component with no operation an ordinary call may reach — every one of them stateful, or bound
   elsewhere — declares no request queue.
6. What a call is given, what it answers, how a failure of it is tried again and what a reply
   stream is are unchanged _(today)_.
7. A task, an addressed call to a stateful operation, an event and a streamed call go where they
   went _(today)_.

**What is not promised**

8. A call made by a caller running an older runtime is not taken. It waits in the per-operation
   queue it was published to, and its caller waits with it.
9. Nothing removes a queue from before this change. `<ns>.<component>.<operation>` keeps whatever
   it holds until it is deleted.
10. A call for an operation only the newer of two releases declares may be taken by a process of
    the older one, and answered as (3) says.

### What a component author does differently

Nothing. A call is made the same way; what changes is the queue that carries it.

## The changes, by area

1. **comq.** A Request is sent with properties, as an Event is, and a producer is given the
   properties of the Request it answers.
2. **`connectors/bindings.amqp`.** `queues.js` gains `requests(locator)`. `Consumer` publishes to
   it with the operation in `toa.io/endpoint` rather than to a queue named after the operation.
   `Producer` registers one request consumer for the component instead of one per operation, reads
   the operation off the message, and answers what it does not serve.
3. **Documentation.** `documentation/calls.md`, which does not exist, is written as ordinary calls
   stand and then changed. `contracts.md`, `stateful.md` and `streams.md` say what a call that
   names an operation a process does not serve is answered.
4. **Scenarios.** `features/bindings/requests.feature`, and the names in
   `features/bindings/scope.feature`.
5. **Migration.** `migrations/327.md`: the release is taken through a halt, and the queues it
   leaves are deleted.

## Decisions

**A request queue per component, over one per operation.** The reasoning that moved tasks moves
calls: a queue named after an operation repeats what the message can carry, and the broker holds
one for every operation of every component for as long as the deployment exists, used or not. See
[queues](./queues.md) for why the component is the floor: it is the set of processes that are
interchangeable for the message.

**The operation travels in a header, on the default exchange, over a routed exchange with a
binding per operation.** A binding per operation keeps an object per operation on the broker, which
is what this removes. It would have the broker return a call nobody serves, where here a process
answers it — but a returned call is one no process is bound for at all, and what has to be answered
is the narrower case of a process that is running and does not know the operation. `toa.io/endpoint`
is the header a task already carries.

**`..requests`, over the bare `<namespace>.<component>`.** Beside `..tasks` and `..instances`, and
under the same rule: a name with `..` in it is never a name from before, so nothing a previous
release declared is redeclared, and what is left over is told apart by its name alone.

**A call nobody here serves is answered, over tried again.** A task for an operation that is not
served is kept at once, because trying it again reaches the same processes. A call has somebody
waiting, and a kept request is never answered — so it is answered, with the exception a call to an
operation that does not exist has always been. The cost is (10): for as long as two releases serve,
a call for an operation only the newer one has can be refused by the older. Trying it again for
that long would cover a rollout and hold every call to a misnamed operation for as long.

**One prefetch for the component, as it is.** comq's prefetch is per consumer, so a queue per
operation was a window per operation, and a component of thirty operations could hold thirty times
as many calls unanswered in one process as a component of one. A window for the component is the
number that was intended; nothing is added to configure it.

**One release, taken through a halt, over a release that serves both.** As for tasks, and for the
same reason: serving both holds the saving behind a second release. What differs is the cost of
getting the order wrong — a task that waits is late, and a call that waits has a caller waiting —
so where tasks stated an ordering constraint, this states that the release is not rolled into.

**Nothing in the runtime deletes what is left.** A component could delete the per-operation queues
of the operations it serves as it opens. It would be deleting what a caller of the release before
is still publishing to, on the strength of having started, and it would be a path to remember to
remove. The queues are named in a way a single command selects.

## Context

A production broker holds 15 603 queues, of which 14 825 are queues of one operation each — some
280 for one application, most of which have never carried a call. The memory is the count of them
rather than what they hold: about 70 KB a queue, as measured in [queues](./queues.md), which moved
tasks and discovery and left calls.

## What happens today

`Producer.open` declares, for every operation of every component it serves, a queue named after
the operation, and consumes it. `Consumer` publishes a call to the queue named after the operation
it calls, declaring it first. A call to an operation that was removed, or that this release of the
component does not have yet, waits in a queue nothing consumes.

## Verification

1. **Calls to two operations each reach the one they name.** Breaks: every caller of any component
   with more than one operation — the queue no longer says which.
2. **A component consumes one request queue, and none named after an operation.** Breaks: the
   broker, which is what this is for.
3. **A request for an operation the component does not serve is answered at once.** Breaks:
   whoever made it, who would otherwise wait for a reply that never comes.
4. **Names begin with the scope.** Breaks: processes of one context sharing a virtual host.

## Compatibility

**On the wire, breaking.** A component stops consuming its per-operation queues, and a caller stops
publishing to them. Neither release reaches the other, so the two do not serve side by side:
see `migrations/327.md`. `toa.io/endpoint` on a request is new.

**In types, additive.** `Communication.request` takes properties, and `queues.js` exports one more
name. Neither is published.

**In behaviour, two changes.** Calls of one component share a prefetch. And a call for an operation
a process does not serve is answered with an `EndpointException`, where it waited.
