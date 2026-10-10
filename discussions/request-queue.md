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
   `UnservedException`, and the process that made the call sends it again: after a tenth of a
   second, then twice as long each time, eleven times, which is some three and a half minutes.
   So a call to an operation only the newer of two releases declares is answered by the newer,
   as it is _(today)_, once a process of it takes the call.
4. A call that has been sent again that often, or whose caller's process begins to stop, throws an
   `EndpointException`. A call to an operation a release removed ends, where it waited for good.
5. Calls of one component share a queue and its prefetch, so a process holds no more of them
   unanswered than it held of one operation's before, and one operation's calls in flight count
   against another's.
6. A component with no operation an ordinary call may reach — every one of them stateful, or bound
   elsewhere — declares no request queue.
7. What a call is given, what it answers, how a failure of it is tried again and what a reply
   stream is are unchanged _(today)_.
8. A task, an addressed call to a stateful operation, an event and a streamed call go where they
   went _(today)_.

**What is not promised**

9. A call made by a caller running an older runtime is not taken. It waits in the per-operation
   queue it was published to, and its caller waits with it.
10. Nothing removes a queue from before this change. `<ns>.<component>.<operation>` keeps whatever
    it holds until it is deleted.
11. Which process takes a call that is sent again. It is the broker's turn, so a call to an
    operation one of two releases has may be sent more than once before the release that has it
    takes it, and is answered late by as long.
12. That a call waits longer than (3) for a release that is not up yet. One that is still not
    served by then is refused, where it waited for as long as the release took.

### What a component author does differently

Nothing. A call is made the same way; what changes is the queue that carries it.

## The changes, by area

1. **comq.** A Request is sent with properties, as an Event is, and a producer is given the
   properties of the Request it answers.
2. **`runtime/core`.** `UnservedException`, code 408, transient: the process that took a call does
   not serve the operation it names, and another may.
3. **`connectors/bindings.amqp`.** `queues.js` gains `requests(locator)`. `Consumer` publishes to
   it with the operation in `toa.io/endpoint` rather than to a queue named after the operation,
   and sends a call again that was answered `Unserved`. `Producer` registers one request consumer
   for the component instead of one per operation, reads the operation off the message, and
   answers `Unserved` for what it does not serve.
4. **Documentation.** `documentation/calls.md`, which does not exist, is written as ordinary calls
   stand and then changed. `contracts.md` says a component's calls share a queue.
5. **Scenarios.** `features/bindings/requests.feature`, and the names in
   `features/bindings/scope.feature`. What two releases serving together promise is held by
   `features/runtime/contracts.feature` as it stands, which gains the call nobody comes to serve.
6. **Migration.** `migrations/327.md`: the release is taken through a halt, and the queues it
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

**A call this process does not serve is answered, and its caller sends it again.** A queue per
operation gave a rollout something for nothing: an operation only the new release declares had a
queue only the new release consumed, so a call to it reached the new release and waited for it.
`features/runtime/contracts.feature` holds that, and a release that adds an operation and calls
it is rolled in one step because of it. On one queue a process of the old release takes such a
call, and what happens to it then decides whether that still holds.

- _Answered and left at that_, every call that lands on the old release fails for as long as the
  rollout takes, and an operation has to be released before what calls it.
- _Given back to the queue_ by the process that took it, a call to an operation a release
  _removed_ has no process to land on and goes round for good, taken and given back, where it lay
  still in a queue nothing consumed. Bounding that by the age of the call compares the clock of
  the process that made it with the clock of the one that took it, and nothing says they agree.
- _Raised_, it is tried again on comq's ladder and then kept, where a request is never answered.
- _Forwarded to a queue of the version it was made for_, it needs a second queue per component
  and a way to tell that no process of a version is left, which the last one to go cannot say.

Sent again by whoever made it, the call is never in the broker without somebody waiting for it:
each time it is answered, and it is the caller, alive and counting on one clock, that decides to
ask again. It stops when the caller does. Which process takes it next is still the broker's turn,
so this is a call that is asked until it is served rather than one that is routed — which costs a
tenth of a second, then two, then four, where a queue of its own cost nothing, and ends in an
answer where a queue of its own held the call for good.

**An exception of its own, over `Endpoint` with something beside it.** `Endpoint` is permanent:
there is no such operation. What a process says here is narrower and passes — _this_ process does
not serve it — which is what `transient` is for, and what the binding reads to send the call
again. What its caller is told in the end is `Endpoint`, because by then that is what is known.

**A doubling pause, over a list of them.** The first is short enough that a rollout with both
releases up costs a call next to nothing, and the last long enough that eleven of them outlast a
release coming up. Nothing is configured.

**The pauses end when the process begins to stop.** A call an operation makes while it handles a
delivery holds the teardown open until it is answered, so a call waiting to be sent again is
answered `Endpoint` as soon as a producer of the process starts closing.

A task is still kept at once, as [queues](./queues.md) decided: nobody waits for it.

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
3. **A request for an operation the component does not serve is answered at once**, with what
   has its caller send it again. Breaks: whoever made it, who would otherwise wait for good.
4. **A call to an operation only the newer release declares reaches it, and waits for it.**
   Breaks: a release that adds an operation and calls it, which is rolled in one step.
5. **A call to an operation no process comes to serve is refused in the end.** Breaks: whoever
   calls what a release removed, and the process that cannot stop while it waits.
6. **Names begin with the scope.** Breaks: processes of one context sharing a virtual host.

## Compatibility

**On the wire, breaking.** A component stops consuming its per-operation queues, and a caller stops
publishing to them. Neither release reaches the other, so the two do not serve side by side:
see `migrations/327.md`. `toa.io/endpoint` on a request is new.

**In types, additive.** `Communication.request` takes properties, and `queues.js` exports one more
name. Neither is published.

**In types, additive.** `exceptions.codes.Unserved` and `UnservedException`.

**In behaviour, three changes.** Calls of one component share a prefetch. A call to an operation
one of two releases has may be answered late, by the pauses it was sent again after. And a call to
an operation no process serves throws an `EndpointException` after some three and a half minutes,
where it waited for good.
