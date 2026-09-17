# Queues per component

## Design concept

Every task a component is given arrives on one queue of its own, and every process answers the
gateway's discovery on one queue of its own. Neither is named after an operation or after a
component, so what a deployment leaves on the broker stops growing with how many operations its
components declare and how many components it has ever had.

### Guarantees

**Tasks**

1. A task for any operation of a component arrives on `<namespace>.<component>..tasks`. Which
   operation it is for travels with the message.
2. Any process serving the component takes any of its tasks, and which operation a task is for
   does not change who may take it *(today)*.
3. A task for an operation the component does not serve is set aside on its first delivery, saying
   which operation it named.
4. A task for a stateful operation is refused where it is made, before anything is sent. A stateful
   operation is served under a process's own name and has no queue of its own.
5. Tasks of one component share a queue and its prefetch, so a backlog of one operation's tasks
   delays another's.
6. What a task does, how often it is tried, where it is kept when it runs out of attempts, and what
   the kept message carries are unchanged *(today)*.

**Discovery**

7. A process answers a ping once, and every component it hosts announces itself.
8. The queue it answers on goes when the process does, so a component a deployment no longer has
   leaves nothing on the broker.
9. A component still connecting when a ping arrives announces itself when it opens *(today)*.

**What is not promised**

10. A task published by a caller running an older runtime is not taken. It waits in the
    per-operation queue it was published to, named after that operation, until somebody moves it.
11. Nothing removes a queue from before this change. `<ns>.<component>.<operation>..tasks` and
    `system.exposition.ping..<ns>.<component>` keep whatever they hold, and are read and deleted
    once.

### What a component author does differently

Nothing. A task is made the same way, with `task: true` on a call; what changes is the queue that
carries it.

## The changes, by area

1. **`runtime/core`.** A call refuses a task for a stateful operation, beside the contradictions it
   already refuses.
2. **`connectors/bindings.amqp`.** `queues.js` gains `tasks(locator)`. `Consumer` publishes to it
   with the operation in a header rather than to a queue named after the operation. `Producer`
   registers one task consumer for the component instead of one per operation, and reads the
   operation off the message. `verdict.js` gains the refusal for an operation that is not served.
3. **`extensions/exposition`.** One `Announcements` connector per process holds the discovery
   broadcast, answers the ping, and announces every tenant registered with it. `Factory` hands the
   same one to every tenant it makes; `Tenant` registers with it and announces through it.
4. **Documentation.** `documentation/tasks.md`, which does not exist, is written as tasks stand and
   then changed. Discovery adds nothing to read: what a process holds on the broker is not
   something a component author declares, calls or has to answer for.
5. **Scenarios.** `features/operations/tasks.feature` and the exposition discovery suite.

## Decisions

**A task queue per component, over one per operation.** A task already says which operation it is
for — it is a `Request` made for one — so the queue name repeats what the message carries, and the
broker holds one queue per operation of every component for as long as the deployment exists. 585
of them were measured on one broker, none of which had ever carried a message.

**Per component, over per process.** A task queue's name is its routing: publishing to it is
choosing who may take the message. One queue per process would mean the caller naming a process,
which is addressed delivery rather than a queue of work, and would give up what a shared queue is
for. One queue for everything would hand a task for one component to a process that cannot run it.
The floor is the set of processes that are interchangeable for the message, and that set is the
component. A composition would route as well — every process of one serves all of its components —
and the caller cannot name it: a `Locator` is a namespace and a name, and how a callee is packed
into pods is a deployment fact no caller sees.

**The operation travels in a header, over the request.** A `Request` is what an operation is given
and what its contract validates; which queue carried it is not part of it. `toa.io/amqp` is already
a header the binding writes and reads, so `toa.io/endpoint` sits beside it, and comq carries a
message's headers through every retry and into the parked queue.

**One release, with the ordering constraint stated, over a release that consumes both.** A
component stops consuming its per-operation task queues the moment it takes this runtime. A task
published by a caller that has not rolled yet waits in the queue it was published to, which is
durable and named after the operation — a delay in a named place rather than a loss. Consuming
both for a release would hold the saving behind a second release and leave a path somebody has to
remember to remove, and every release after it would be one where the count had not moved.

**One ping subscription per process, over one per component.** A subscription with no group
consumes from a queue comq remembers by the exchange alone, so a second one in a process would
share it and the broker would hand each ping to one of the two. A subscription per component
answers that with a communication per component, which is a channel per component where there is
one today. A subscription the process holds, fanning out in memory to the tenants registered with
it, is one queue and one channel however many components a process hosts.

**A task for a stateful operation is refused where it is made.** Today it is published to a queue
nothing consumes and waits there for good, because a stateful operation is served under a process's
own name. `Call.#refuse` already turns down a call that contradicts what it calls — a readonly
chain reaching an operation that writes, an `instance` named for a stateless operation — and this
is one of those. The producer's refusal stays as what answers a task for an operation that a newer
caller knows and this process does not.

**The announcement stays per component.** What a tenant announces is its own branch, and the
gateway merges branches by component. A fanout exchange costs no queue, so there is nothing to
collapse.

## What removes a queue

Nothing accumulates on its own any more. What a deployment holds is one queue per thing it
declares — an operation, a component's tasks, a receiver's binding, a channel's label — and what a
connection holds for as long as it lives, which the broker removes with the connection. A restart,
a rollout, another replica and another process leave nothing behind.

So a queue that is left over is one whose declaration was removed, and removing it is the same act:

| what was removed | what to remove with it |
| --- | --- |
| an operation | `<ns>.<component>.<operation>` |
| a component | its operation queues, `<ns>.<component>..tasks`, and the event queues its receivers were bound by |
| a receiver | `<srcNs>.<srcComponent>.<event>..<ns>.<component>` |
| a deployment, or a tenant of a multi-tenant one | its vhost |

A retired `delay` leaves a `comq.retry.<value>` behind, which comq records as a housekeeping item
rather than a hazard.

**No `expires` policy, anywhere.** The policy deletes a queue that has been unused — no consumer,
no `get`, no redeclare — together with what is in it, and there is nowhere here that is safe:

- `comq.parked` and `comq.retry.*` never have a consumer, so unused is their permanent state and
  the timer would fire on a healthy queue and take the messages waiting in it. `comq.parked` gets a
  `max-length` and an alert on its depth instead.
- An operation or task queue that is momentarily unused is one whose component is halted, scaled to
  zero or redeploying, and it is holding the calls that [halt](../documentation/halt.md) promises
  will be served when the component comes back.

What a timer would have swept up was the topology that grew by itself, and that is what this
removes rather than schedules a cleanup for.

## Context

Both brokers of a production deployment blocked every publisher on a memory alarm. The memory was
the count of objects rather than what they held: 220 MB of allocator fragmentation across some
19 000 Erlang processes, and 146 MB of management statistics over 6301 queues. An empty broker
floors at 136 MB, and 2731 queues cost 192 MB above it — about 70 KB a queue.

The same deployment declares 2731 queues from a clean start, so 3570 of the 6301 had outlived
whatever declared them. Of the 2731, `comq.parked.*` was 1318 and `*..tasks` 585, and one tenant
application on its own was 673 queues of which 483 had never held a message.

comq 0.23.0 answered its half: one `comq.parked` rather than one per consumed queue, and one reply
queue per connection rather than one per request target. This is toa's half.

Related: [halt](./halt.md) on what a parked backlog costs, [discovery](./discovery.md) on why the
component map replaced a broadcast registry and why an `x-expires` belongs in a policy rather than
in a declaration, and [stateful](./stateful.md) on an operation that is served under a process's
own name.

## What happens today

`Producer.open` declares, for every operation of every component it serves, a queue named after the
operation and a second named after it with `..tasks`, and consumes both. The task queue is consumed
whether or not anything ever enqueues to it, and stays on the broker for as long as the deployment
does.

`Factory.tenant` gives every tenant a broadcast grouped by the component's identifier, so each
declares a durable `system.exposition.ping..<ns>.<component>`. The queue outlives the component: a
component a deployment no longer has keeps its queue, and every gateway ping fans out into it
forever. On the production broker those held some 5600 messages nothing would ever read.

## Stages

1. Tasks: the queue, the header, and the one consumer per component.
2. Discovery: the announcements a process holds, and the tenants registered with it.

## Verification

Each scenario states something somebody depends on.

1. **A task reaches the operation it names.** A caller makes a task call; the operation runs.
   Breaks: every caller of every task.
2. **Two operations' tasks reach their own.** Tasks for two operations of one component are made,
   and each runs the operation it named. Breaks: any component with more than one operation taking
   tasks — the queue no longer says which.
3. **A task for an operation the component does not serve is kept at once.** Breaks: an operator,
   who would otherwise see a message retried for minutes and then kept with no reason on it.
4. **A task for a stateful operation is refused where it is made.** Breaks: whoever makes one, who
   is told now instead of watching nothing happen.
5. **A component declares one task queue.** Breaks: the broker, which is what this is for.
6. **A tenant leaves no queue behind.** A composition stops, and the discovery queues it held are
   gone. Breaks: the broker, again.
7. **Every component in a process answers one ping.** A gateway pings, and a composition of two
   components exposes both. Breaks: a route to any component beyond the first in its pod.

## Compatibility

**On the wire, one ordering constraint.** A component stops consuming its per-operation task
queues. A caller running an older runtime publishes to those queues, and what it publishes is not
taken until somebody moves it. Everything else is additive: `toa.io/endpoint` is a new header, and
a runtime that does not read it is not given one.

Discovery has no ordering constraint. The ping is a fanout, so a tenant of either version is
reached, and the two consume different queues.

**In types, additive.** `Communication.enqueue` takes properties, and `queues.js` exports one more
name. Neither is published.

**In behaviour, two changes.** Tasks of one component share a prefetch, so where one operation's
tasks were served alongside another's before, they are now served in turn with them. And a task for
a stateful operation is refused rather than published to a queue nothing consumes.
