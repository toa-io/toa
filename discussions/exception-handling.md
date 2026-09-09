# Distributed exception handling

## Design concept

Business logic never throws on purpose. What it refuses, it refuses by returning an error: a value,
an answer, the system working as it should, and the work is done with. An exception is not that. It
is never intentional — something is wrong, in the code or in what the code depends on — and whether
anyone wrote that failure down anywhere changes nothing about it.

So an exception is worth trying again, because what is wrong may be gone in a minute, and it must
never be quietly dropped, because nobody chose it. Where there is a caller waiting, it is theirs to
decide, and the runtime hands it over. Where there is no caller — an event, a task — the runtime
decides, and the only question is *will it ever succeed?* If it might, the message is kept and tried
again later, with the wait growing each time, out of the way of everything else. If it never will —
the runtime itself refused the message, and its refusal will not change — trying again is only a way
of failing again, and the message is set aside at once.

The runtime can tell the two apart because it names the failures it raises on purpose. What it
named, it meant, and it will mean the same on the next delivery. What it did not name is an ordinary
error from somewhere below, and that is the kind that passes.

Set aside means kept. A message that has run out of attempts, or that never had any, goes to a place
of its own and stays there, with the reason it failed. Nothing is deleted. That place is both the
alarm — its depth is what an operator watches — and the record, and replaying it is putting the
messages back.

A failure belongs to one message. Not to the process, and not to the other messages it is carrying.

### Guarantees

What the finished system promises. Those marked *(today)* already hold, and are listed so the whole
is readable at once.

**A call**

1. A failure of an operation reaches whoever called it, as an exception, and the caller decides what
   to do about it. *(today)*
2. An outcome the business logic chose is an `error` — a value the caller reads, not a failure.
   *(today)*

**A message**

3. A message that fails stops nothing: not the process, not its queue, not another receiver of the
   same component.
4. A failure that may pass later is retried, with a growing wait, off the consumer's path.
5. A failure that cannot pass is not retried.
6. Nothing is dropped. A message that is not processed is kept, with the reason it failed, and can
   be replayed.
7. 3–6 hold for a task as much as for an event. A task is a call carried on the event topology, so
   it is a message with nobody waiting, and it is treated as one.

**Publication and delivery**

8. A state change and the intent to publish commit together; publication is at-least-once and
   nothing is lost to a crash. *(today)*
9. Nothing is promised about order. *(today)*
10. Delivery is at-least-once, and a receiver's state change happens once however many times its
    message arrives.

**Operating**

11. A failure is visible: what is parked accumulates where its depth can be watched, and every retry
    and every parking is in the log.
12. A replica that is alive but no longer consuming is noticed. *(open — see the changes, area 6)*

### What a component author does differently

Nothing, to keep working. What changes is what they can rely on:

- Refusing by returning an `error` is the business logic working, and the message is done with.
  Throwing is not something they do on purpose, and it now means the message comes back later and is
  parked if it keeps failing.
- An operation a receiver invokes may run twice on one message. The runtime makes the state change
  happen once; effects outside the state — an email, a call to a third party — are still theirs to
  make safe.
- A parked message is an operational event they will be told about, not a silent loss.

## The changes, by area

1. **Failure classification.** The runtime decides whether an exception could pass on a later
   attempt from the enumeration of exceptions it raises deliberately: what it named is permanent,
   what it did not name is transient. Four named codes are the stated exceptions and count as
   transient; the list lives beside the enumeration, so a code added later cannot avoid the
   question.

2. **Consumption with nobody waiting.** An event and a task are one thing — work carried on the
   event topology with no caller to answer to — and they get one rule. The failure is caught by the
   runtime and answered as a verdict, *try again* or *park*, instead of escaping into the broker
   library. Nothing stops a channel, nothing re-delivers to consumers that succeeded, and nothing
   ends the process.

3. **Retry and parking, in the broker.** A message waiting for another attempt waits in the broker,
   not in the process, so it may be tried on a different replica and costs the process nothing. The
   queues that implement waiting, the terminal queue and the count of attempts belong to comq, which
   grows a verdict a consumer answers with; the runtime declares no queue and picks no delay. That
   change is a task of its own, and this one waits on the release that carries it.

4. **Idempotency.** A message carries the identity of the outbox row it came from, and a receiver's
   state change records that identity in the same transaction as the entity, so a message delivered
   twice is written once. This is the second stage.

5. **Process lifetime.** An unhandled rejection stops being the retry mechanism and becomes what it
   should be — a last resort that shuts down in order, draining and flushing rather than exiting
   mid-way. Two places that leak a rejection today are closed.

6. **Deployment — now a question, not a task.** A liveness probe was the answer to "a process that
   is alive but has stopped consuming is nobody's problem". Two things undercut it: the wedge it was
   for is the sealed channel, which comq stops doing, and the readiness endpoint it would point at
   reports lifecycle only — it answers 200 for a process that has not consumed anything in an hour.
   A probe that actually checks consumption is new machinery and a definition of "consuming" that
   does not fire on a component with no receivers; a probe that checks a dependency is the standard
   way to turn a broker blip into a fleet-wide restart. Decide it after the rest lands, with
   evidence, rather than now.

7. **Documentation.** A consumer-side page to set beside the outbox page: what a receiver may see,
   what it has to tolerate, where a parked message goes and how it is replayed.

## Context

Toa answers a failure differently depending on how the work arrived, and only one of the answers was
designed. A call carries its failure back to whoever made it. An event does not: the failure travels
back out of the runtime, the message is republished, and the process dies. Five deaths later the
broker deletes the message and one log line says so. A task fails more quietly still: the reply
carrying the exception is never read, the message is acknowledged, and the work is gone.

The producer half of the same story is finished and documented: a state change and the intent to
publish commit together, the pump recovers what was not published, and the guarantee is written down
— *nothing is dropped*. The consumer half contradicts it. `readme.md:17` still lists "Eventual
consistency guarantee (**not yet**)"; this is that item.

## What happens today

### A call — designed, and right

`Operation.invoke` (`runtime/core/source/operation.ts:90`) catches everything the algorithm throws
and answers `{ exception }`. `Call.invoke` (`runtime/core/source/call.ts:44`) rethrows it in the
caller, whose own operation catches it the same way. A failure walks up the call chain and stops at
whoever is waiting. The gateway maps it to a status (`extensions/exposition/source/exceptions.ts`).
Nothing crashes.

Two things are worth knowing and are **out of scope by decision**: there is no deadline anywhere in
the runtime, so a caller waits forever on a queue with no consumer; and `SystemException` carries
the callee's stack across the service boundary. The call path is not changed by this work.

### An event — the process pays for the message

The receiver calls its own operation *as a call* (`boot.remote(...)`,
`runtime/boot/src/receivers.js:10`), so the exception is rethrown by `Call.invoke` — and this time
nobody is waiting. It propagates out of `Receiver.#process` (`runtime/core/source/receiver.ts:100`),
out of the AMQP receiver (`connectors/bindings.amqp/source/receiver.js:75`), and into the broker
library's acknowledging consumer, which cancels every consumer on the channel, republishes the
message with an attempt counter, and rethrows into a promise nobody awaits —
`runtime/cli/src/program.js:61` → `process.exit(1)`.

What that costs, most expensive first:

- **The blast radius is the process, not the message.** Up to 300 in-flight events and 300 in-flight
  requests (prefetch) die unacknowledged and are redelivered, so one failure multiplies duplicate
  work. The replica stops answering calls. Under fanout every consumer group of that event fails at
  once, so a context goes down together.
- **The cancelled channel is shared.** One communication per component
  (`connectors/bindings.amqp/source/factory.js:73`) carries every receiver of that component *and*
  its task queue on one events channel. Cancelling stops all of them; the process survives that only
  because it is about to die.
- **The retry re-fans the event out.** The republication goes to the exchange the message arrived
  from, which for an event is the fanout exchange — so a retry for the group that failed is
  delivered again to every group, including those that succeeded.
- **The acknowledgement precedes the republication**, so a crash between them loses the message.
- **The last attempt deletes it.** A negative acknowledgement without requeue, and no dead-letter
  exchange is configured anywhere — not in the chart, not in the compose file. The message is gone;
  `AMQP message discarded` is the only trace, and it carries no payload and no correlation id.
- **The counter needs a header that is often absent.** amqplib leaves `properties.headers` undefined
  when the publisher set none (`amqplib/lib/defs.js:3428`). Events carry one; tasks, broadcasts and
  requests do not — so on those paths the failure handler throws a `TypeError` that hides the
  original exception and the message is left neither acknowledged nor rejected.
- **`process.exit(1)` skips the graceful path**: no drain, no telemetry flush, so the spans that
  explain the failure die with it. And because the process dies on each attempt, the `discarded`
  line is reachable only on the sixth delivery, after five restarts.
- **Retrying is indiscriminate and immediate.** A message that can never fit the receiver's contract
  costs five process deaths, exactly like a database that was briefly unreachable. There is no delay
  between attempts.

### A task — lost in silence

A task is a call carried on the event topology, and that is what it is today: `Consumer.task`
enqueues the request to `<queue>..tasks` on the events channel — durable queue, persistent message,
publisher confirms, manual acknowledgement — and the consuming side invokes the same endpoint with
the same request contract a call would. The one thing that differs is that nobody reads the reply.

`Producer` consumes `<queue>..tasks` and invokes the **component** directly, not through a call
(`connectors/bindings.amqp/source/producer.js:100`), so `{ exception }` comes back as a value nobody
reads and the message is acknowledged. A failed task is lost, with one `Failed to execute operation`
line. The caller was told nothing either — `Transmission` answers `null` as soon as the broker
accepts the enqueue.

Cadence's delayed calls go this way, and inherit it: what the operation does with a delayed call
happens in the target's process and never comes back. Its own ordering was already right — the
call goes out before the row is settled — but a *failed* dispatch settled the row too, so a broker
that briefly refused the enqueue dropped a call somebody had asked for. **Fixed**: a row is settled
by its outcome now, and what failed on the way out is called again on the next scan, until the
`overdue` its caller gave it. It was the first caller of the classification below.

### Duplicates

Nothing anywhere. No message carries an identity (`Message` is `{ payload, telemetry }`), there is no
record of what has been processed, and the receiver documentation does not mention redelivery.
`documentation/outbox.md:96` is the whole consumer-side story: "Receivers see this from AMQP
redelivery regardless, and every event carries `VERSION`." What exists is entity-level optimistic
concurrency (`VERSION`, `concurrency: retry`), which is about concurrent writers, not redelivery.

### Two more places the same rule is broken

- `extensions/stash/source/Aspect.ts:52` — `store` does not return or await its span, so a Redis
  failure is a floating rejection and kills the process. A second crash path, unrelated to messages.
- `runtime/cli/src/handlers/lib/graceful.js:9` — `disconnect()` is not caught, so a failure while
  shutting down is itself an unhandled rejection and `exit(0)` is never reached.
- The extension hook that could wrap a receiver (`runtime/boot/src/extensions/receiver.js`) is
  implemented by no extension; nothing sits between the binding and the rethrow.

## Design

### 1. The runtime classifies; the broker library carries

The exception stops escaping. `connectors/bindings.amqp/source/receiver.js` catches it, asks core
whether it could ever pass, and answers the broker library with a verdict — *try this again* or
*park it* — rather than letting a rejection run into it. Where the message then waits, and how the
attempts are counted, is the library's business and Toa declares nothing.

The split is the point: the runtime knows what a failure *means* and nothing else can, because a
code like `202` or `304` is core's vocabulary; the library knows what a broker can *do* with a
message and owns the topology for it, which is what keeps a queue argument out of Toa. It also puts
the waiting where the user wants it — in the broker, so a message that failed on one replica may be
tried on another, and so nothing is held in a process's memory.

`Producer`'s task processor does the same, and the only difference is where it looks. A receiver
invokes through a call, so the exception is thrown at it; a task processor invokes the component, so
the exception comes back in the reply, the way `Call` reads one. Both then answer the same verdict.
The RPC processor beside it is untouched: there the exception *is* the reply, and a caller is
waiting for it.

**This waits on a comq release** — the verdict and the topology behind it are a task of comq's own.
§5 is independent of it and can land first.

### 2. Classification

*Landed, ahead of the rest: cadence needed it to tell a broker that was briefly away from a request
a target will never accept.*

Core already declares every exception it raises deliberately, in the `codes` table of
`runtime/core/source/exceptions.ts`. That enumeration is the answer: **a failure core named is one
core meant, and it will mean the same thing on the next delivery; a failure it did not name is
`SystemException` wrapping something arbitrary, which is exactly what may be gone in a minute.**

So the default is transient, and being on the list is what makes an exception permanent:

```ts
export function permanent(exception: Exception): boolean {
  return exception.code in names && !TRANSIENT.has(exception.code)
}
```

The answer lives beside the enumeration, so a code added later cannot avoid the question.

**The review.** Every declared code, where it is raised, and whether the rule holds:

| code                      | raised                                                     | verdict        |
| ------------------------- | ---------------------------------------------------------- | -------------- |
| `0` System                | anything the algorithm or a connector threw                 | transient      |
| `200` Contract            | base of the family                                          | permanent      |
| `201` RequestSyntax       | declared, never raised                                      | permanent      |
| `202` RequestContract     | the request does not fit the schema; a query is required    | permanent      |
| `203` RequestConflict     | declared, never raised                                      | permanent      |
| `211` ResponseContract    | the reply does not fit; raised on `local` only              | permanent      |
| `212` EntityContract      | the new state does not fit the entity schema                | permanent      |
| `213` EntityGuard         | a guard refused the transition                              | permanent¹     |
| `221` QuerySyntax         | the query names what is not defined                         | permanent      |
| `300` State               | base of the family                                          | permanent      |
| `302` StateNotFound       | the entity is absent or deleted                             | **transient²** |
| `303` StatePrecondition   | the version named does not match                            | permanent³     |
| `304` StateConcurrency    | the compare-and-swap lost and `concurrency` is not `retry`  | **transient**  |
| `305` StateInitialization | declared, never raised                                      | permanent      |
| `306` Duplicate           | a unique index other than `_id` refused the write           | permanent      |
| `400` Communication       | base of the family, never raised                            | **transient**  |
| `401` Transmission        | every binding rejected — nothing is listening yet           | **transient**  |
| `402` Endpoint            | the component provides no operation by that name           | permanent      |

The rule holds for the whole contract family and most of the state family; four codes are the stated
exceptions, and `TRANSIENT` is that list, short enough to defend line by line. `Endpoint` is the
newest code and the clearest illustration of why the answer sits beside the enumeration: it and
`Transmission` are the same sentence about reaching an operation — nothing carried the call, and
there is nothing to carry it to — and they fall on opposite sides.

- ¹ **EntityGuard** — a guard reads the entity, and the entity can change, so a later attempt could
  pass. Called permanent because the guard refused *this* transition against state that already
  exists; if that proves wrong in practice it moves, and this review is where the choice is
  recorded.
- ² **StateNotFound** — the one place a retry rescues an ordering race. Nothing promises order, so an
  event about an entity can outrun the event that creates it. Costs the whole run of attempts before
  an operator sees a genuinely missing entity parked, which is the cheaper mistake.
- ³ **StatePrecondition** — an entity's version only grows, so a precondition on an older one will
  not start matching.

The gateway already makes a similar cut — `extensions/exposition/source/exceptions.ts` answers `4xx`
for the codes it knows and `500` for the rest. The two should be read together, though they are not
the same question: `409` invites a client to try again with fresh state, which is what
`StateConcurrency` being transient says here too.

A receiver may narrow the policy in its manifest later (`retries`, `backoff`); not in the first pass.

### 3. What the runtime answers

Two verdicts, and nothing else to choose. A transient exception is answered *retry*; a permanent one,
and a transient one the library says has run out of attempts, is answered *park*. Toa neither counts
attempts nor picks a delay — one policy in one place, and no second opinion about how long to wait.

What Toa does add is the reason, so a parked message can be read without guessing: the exception's
code and message, the consumer that failed, and the time. Those travel as message headers.

### 4. Duplicates: the inbox

The mirror of the outbox, and what makes retrying safe.

- The outbox row id (uuid v7, already there) travels on the message: `Message.id`.
- A receiver's operation commits an inbox record with that id in the same transaction as the entity
  — the storage already opens one for the outbox row (`connectors/storages.mongodb`).
- A message whose id is already recorded is acknowledged without invoking anything.

Bounded by a TTL, like the outbox's published rows. Where a storage has no transaction, or a message
has no id (a foreign event), the receiver runs as it does now and the documentation says so.

### 5. The process

- `runtime/cli/src/program.js` keeps its `unhandledRejection` guard — a last resort now, not the
  retry mechanism — and leaves with its telemetry rather than without it. It flushes and exits 1;
  it does not disconnect. A rejection nobody handled says the state is one nobody described, and
  running a teardown through that is how a process stops exiting at all — where a flush is bounded
  by the exporter's own request timeout and never rejects. What the messages need is durability,
  which they have, not a drain.
- `graceful.js` catches a failing `disconnect()` so shutdown reaches its exit.
- `extensions/stash/source/Aspect.ts` returns its span.

### Watching it

Toa has no metrics pipeline and this does not add one. The signals are the depth of the parking
queues, which the broker reports, and the log. Failure text and levels to be agreed before writing:

| level   | message                     | attributes                             |
| ------- | --------------------------- | -------------------------------------- |
| `warn`  | `Message retried`           | `queue`, `code`                        |
| `error` | `Message parked`            | `queue`, `attempts`, `code`, `message` |
| `info`  | `Receiver refused an event` | `queue`, `code` — today this is silent |
| `debug` | `Message already processed` | `queue`, `id`                          |

## Files

- `runtime/core/source/exceptions.ts` — `permanent()`.
- `runtime/core/source/types/message.ts` — `id`.
- `runtime/core/source/receiver.ts` — hands the verdict on rather than rethrowing bare.
- `connectors/bindings.amqp/source/{receiver,producer}.js` — catch, classify, answer the verdict,
  and attach the reason.
- `connectors/bindings.amqp/package.json` — the library release that carries the verdict.
- `runtime/core/source/outbox/outbox.ts`, `connectors/storages.mongodb` — the row id on the message;
  the inbox record and its transaction.
- `runtime/cli/src/program.js`, `runtime/cli/src/handlers/lib/graceful.js`,
  `extensions/stash/source/Aspect.ts` — the other places the same rule is broken.
- `documentation/` — a consumer-side counterpart to `outbox.md`, and the receiver page.

## Stages

1. **The process, and what needs no broker.** §5, §2, and the delayed calls that were dropped on a
   failed dispatch. Independent of everything else, so it goes first rather than waiting. *Done.*
2. **comq.** The verdict a consumer answers with, and the topology behind it. Its own task, in its
   own repository, on its own schedule.
3. **Stop the crash.** §1–§3 — guarantees 3–7. Needs stage 2 released.
4. **Idempotency.** §4 — guarantee 10, its own change.

The call path is left as it is.

## Verification

Cucumber against the compose stack, in the shape `features/events/outbox.feature` already uses; the
RabbitMQ management API is already a step helper (`features/steps/queues.js`):

- a receiver whose operation throws — the composition stays up, the event comes back after the delay,
  and a receiver that has stopped throwing processes it;
- a receiver refused by its contract — parked on the first attempt;
- attempts spent — the message is in the parking queue with its headers, and its own queue is empty;
- a failing task — the same, rather than lost;
- an event failing for one consumer group is not redelivered to another;
- and with the second stage, one message id delivered twice — the receiver writes once.

Each states a requirement someone depends on, not the mechanism.

## References

The pieces are all standard, and naming them is how the documentation should explain them:

- *Dead Letter Channel* and *Invalid Message Channel* (Hohpe & Woolf) — the two destinations, and why
  they are two: undeliverable is not the same as unprocessable.
- *Transactional outbox* and *idempotent consumer* (Richardson) — the pair Toa is half of.
- Exponential backoff with jitter — the growing wait between attempts.
- RabbitMQ dead-letter exchanges with per-queue TTL, the usual way to make a message wait; quorum
  queues' `delivery-limit` as the broker-native alternative, which counts deliveries but offers no
  backoff and changes how existing queues are declared.
- Azure Service Bus `MaxDeliveryCount` and its DLQ, SQS redrive policy and the redrive API, Spring
  Kafka's `DefaultErrorHandler` with `DeadLetterPublishingRecoverer` — the same shape everywhere:
  count, park, never crash, offer replay.
- *Crash-only software* (Candea & Fox) — why the current behaviour looks principled and is not:
  crashing is for a process whose state is unknown, and a rejected message says nothing about it.
