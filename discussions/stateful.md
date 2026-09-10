# Stateful operations and addressed calls

## Design concept

Some state lives in the memory of one process — a session, a connection, a stream someone is
producing — and a call about it has to reach that process. Every other call in Toa goes to whichever
replica of a component takes it first.

Every process has a **name**, generated when it starts or given by `TOA_INSTANCE`. An operation
declared **stateful** is offered by each process under that process's name, and an **addressed call**
— a call naming a process — is how it is reached. The two exist together: an addressed call goes to a
stateful operation, and a stateful operation takes addressed calls only. A process reads its own name
as `context.instance` and hands it out: in the reply of the call that created the state, or as part of
a URL. It binds its name before it answers anything, so a name it has handed out is reachable at once.

An addressed call ends in one of three ways:

1. **A reply.**
2. **Refused at once**, when no process holds the name: it never existed, it has stopped, or it is
   stopping. A stopping process withdraws its name first and then finishes the calls it already holds.
   A refused call never ran.
3. **Abandoned at its deadline**, when the process vanished without withdrawing its name — a crash, a
   lost broker connection — or took longer than the deadline. A call still waiting in the queue by
   then is dropped by the broker; a call already being worked on runs to its end, and its reply is
   discarded.

The third way needs a deadline, and the deadline is also what keeps a process stoppable: `comq`'s
`close()` waits for every handler in flight, and a handler waiting for a reply that never comes would
hold its process forever. So an addressed call always carries one — 5 seconds by default, set per
context, and changeable per call. A caller may shorten it or lengthen it; the call keeps one either
way, so a process waiting on it stops whatever its author wrote.

Every remote call accepts a deadline, as a `timeout`, a `signal`, or both. An ordinary call carries
one only when its caller sets it. Its target is a component, and a component comes back, so without a
deadline it waits for its reply as it does today.

### Guarantees

**An addressed call**

1. A name's calls reach at most one process at any moment. The broker grants a name to one connection
   and holds it for that connection's lifetime. A process that finds its name held waits for it to be
   released — which is also what a restarted process does while the broker has yet to notice its
   predecessor is gone. The broker treats the two the same way, and so does Toa.
2. A refused call never ran.
3. A process waiting on an addressed call stops within that call's deadline.
4. For a streamed reply, the deadline covers the wait for the stream to start; the stream's own
   liveness covers the rest.

**Any call with a deadline**

5. A call abandoned while it still waited in a queue is dropped by the broker and never runs.
6. A call abandoned after a consumer took it has an unknown outcome and may still run. So may a call
   that failed and waits on `comq`'s retry ladder, because dead-lettering strips a message's expiry.
   A caller that repeats an abandoned call relies on the identity every call carries, and on
   `once: true`, to have the work done once.

**Limits**

7. A name lives as long as its process's broker connection. During a brief connection loss or a broker
   restart, calls to that process are refused and calls queued for it are abandoned, while its memory
   survives. The refusal is permanent, so an event receiver whose call is refused this way parks the
   event at once.
8. A name given by `TOA_INSTANCE` passes to the next process started with it, which then answers
   calls meant for its predecessor, with none of its memory. A generated name belongs to one process
   for good.
9. A process waiting on an ordinary call without a deadline waits for its reply, and so does its
   shutdown.

### What a component author does differently

Declare the operation stateful, and hand out the name of the process that holds the state:

```yaml
# manifest.toa.yaml
operations:
  open:
    type: computation
  watch:
    type: computation
    stateful: true
```

```typescript
// open
return { instance: context.instance, id }

// elsewhere
const stream = await context.remote.media.streams.watch({ input: { id }, instance })
```

Then:

- A call to a stateful operation names `instance`; a call to an ordinary operation, a task and a
  delayed call name none. A mismatch is refused as a contract error before anything is sent.
- A call that needs longer or shorter than the default says so: `{ input, instance, timeout: 60_000 }`.
  A `signal` ends a call when it aborts, within whatever deadline applies; given alone, it leaves a
  queued call in its queue.
- Two exceptions are new. *Addressee* is permanent: nothing at that name took the call. *Abandoned* is
  transient: the caller stopped waiting, and the call may still run.
- The default is set in the context manifest:

  ```yaml
  # context.toa.yaml
  addressed:
    timeout: 5000
  ```

- A stateful operation is exposed through a route that carries the name:

  ```yaml
  /streams/:instance/:id:
    GET:
      map:instance: instance
      endpoint: watch
  ```

  A route to a stateful operation without `map:instance` is refused as any call without a name is.
  Over HTTP, *addressee* answers `404 Not Found` and *abandoned* answers `504 Gateway Timeout`.

## Decisions

**A queue per process, exclusive to its connection.** The broker locks an exclusive queue to the
connection that declared it and deletes it when that connection ends. That one property gives the
uniqueness of a name, its cleanup after a crash, and a refusal for a name nobody holds, with no
setting to choose. It costs guarantee 7: a name shares its connection's interruptions. A durable
queue with an expiry would ride them out, at the price of a period after a crash in which calls wait
for their deadline, and one more number to choose.

**Refusal by an unroutable publish.** A caller publishes an addressed call to a direct exchange under
the name, with `mandatory`, and declares no queue. The broker routes a publish or returns it, one or
the other, so a returned call is refused at once and exactly. Withdrawing a name is one command —
unbinding its queue — after which every publish is returned; the calls queued past the prefetch at
that moment go with the connection and meet their deadline.

**A refusal is permanent.** A generated name never comes back, and a retry against it would be a
retry against nothing.

**A deadline by default on addressed calls only.** The target of an addressed call may be gone for
good, and nothing else ends such a call. The target of an ordinary call is a component that returns,
and an ordinary call keeps waiting for as long as it takes unless its caller decides otherwise.

**5 seconds, per context.** Well within the 45 seconds a deployment gives a stopping process, so a
process waiting on an addressed call finishes its graceful stop and its unacknowledged messages are
redelivered as usual. Applications differ, so a context may set its own.

**Both `timeout` and `signal`.** A `timeout` is a number the runtime can hand to the broker as the
message's expiry, so the broker drops a call nobody took in time. A `signal` lets a caller end a call on an event of its own.

**`instance`, `timeout` and `signal` travel in the request.** They sit beside `task`, which already
says how a call is made. Every call site — the bridge, cadence, the gateway
— keeps its one argument, and `Call.invoke` builds the envelope it sends field by field, so none of
the three reaches the wire.

**The runtime leaves outgoing calls alone at shutdown.** An addressed call ends within its deadline,
inside the grace period, and a stopping process that lets its handlers finish keeps redelivery
transparent to whoever called it.

**The broker's own mechanisms only.** A plugin that reports deleted queues would tell a caller of a
crash without a timer, and is enabled on few brokers and on almost no managed ones.

## The changes, by area

### comq

1. **A request with a deadline.** `IO.request(queue, payload, options?)`, where `options` is an encoding
   as today or `{ encoding, timeout, signal }`. The deadline is taken once, outside the re-send loop;
   each publish carries `expiration`, the time left; a re-send with no time left rejects. On abort the
   pending entry and its reply handler are removed at once, so a retransmission skips it, and the
   promise rejects with `signal.reason`. A late reply meets an unknown correlation and is dropped, as
   one already is. For a reply stream the deadline covers the wait for its first message.
2. **Call and back.** `IO.back(exchange, key, producer)` declares the queue `<exchange>.<key>`, exclusive
   to the connection, binds it to the direct `exchange` under `key` on every shard, and consumes it
   through the request consumer. `IO.call(exchange, key, payload, options?)` publishes to the exchange
   with `mandatory` on the request channel, declaring the exchange and no queue, and takes the same
   options as `request`. A returned call rejects with `Unroutable`, exported beside `Retry` and `Park`.
3. **Withdrawal.** `seal()` unbinds every backed queue, waits for the broker to confirm, and then
   cancels consumers.
4. **A held key waits.** A declaration refused because another connection holds the queue fails that
   declaration alone and is retried as recovery retries one. A channel error stays on its channel:
   today every amqplib channel lacks an `error` listener, so a 404 or a 405 tears down the whole
   connection.
5. **Shards.** A call returned by one shard is published on the next through `route`, which declares
   the exchange there first, and rejects once every shard has returned it.
6. **Documentation.** The readme's Request, Call and back, Retries and Parked messages sections, and
   `features/rpc.parked.feature`.

### Toa

1. **The name and the default.** `runtime/core/source/instance.ts` exports `INSTANCE` — `TOA_INSTANCE`,
   validated, or a new id once per process — and `TIMEOUT`, read from `TOA_ADDRESSED_TIMEOUT` with 5000
   as the fallback. `Context.instance` in core and in the Node bridge, with its types.
2. **Manifests.** `stateful` in the component schema beside `once`. `addressed.timeout` in the context
   schema beside `outbox` and `inbox`, written as `TOA_ADDRESSED_TIMEOUT` by the deployment.
3. **Discovery.** `stateful` joins what an operation exposes to its callers, and `instance` joins the
   request schema.
4. **The call.** `instance`, `timeout` and `signal` join `Request`. `Call.invoke` refuses a mismatch
   with `RequestContract`; takes `timeout`, or `TIMEOUT` for an addressed call without one, and refuses
   a non-positive one there; combines it with `signal`; passes both down the transmission to the
   binding; and throws *abandoned*, with the abort's reason as its cause, when the deadline wins.
5. **Exceptions.** `Addressee: 403`, permanent, and `Abandoned: 404`, transient.
6. **Loop binding.** Serves an addressed call when its `instance` is this process's name and hands any
   other to the next binding.
7. **AMQP binding.** A stateful endpoint is served by `back` on the exchange
   `<namespace>.<name>.<endpoint>..instances` under the process's name, with no shared queue and no
   tasks queue, bound before any shared endpoint starts consuming. An addressed call goes out through
   `call`; `Unroutable` becomes *addressee*.
8. **Exposition.** `map:instance` names the route parameter that carries the name. It takes the
   parameter out of the input and the criteria, and the endpoint sets `request.instance` from it beside
   `request.id`. Introspection lists it under `route`. *Addressee* maps to `404`, *abandoned* to a new
   `504`.
9. **Cadence.** A delayed call is refused with `instance` or `signal` in its request.
10. **Documentation.** A page on stateful operations and addressed calls, the component and context
    manifests, exceptions, the Node bridge, `map`; the *Stateless* principle in the design notes, and
    the absence of deadlines stated in [exception handling](/discussions/exception-handling.md).

## Context

A Toa call waits for as long as it takes: [exception handling](/discussions/exception-handling.md)
places deadlines out of scope, and `comq` states that a request can be neither timed out nor
withdrawn. That holds up because a call's target is a component, which returns. A stateful operation
makes the target a process, which may vanish for good, and that is what brings a deadline in — on
addressed calls by default, and on any call that asks for one.

The parked [halt](https://github.com/toa-io/toa/tree/halt/discussions/halt.state.md) is blocked by a
process waiting on a reply from one that has already halted. It gains a way to bound a call; its
blocker stays, since ordinary calls keep waiting by default.

## Stages

1. **`comq`**: deadlines on requests, call and back, withdrawal, channel errors, shards. Released on its
   own.
2. **The call**: the name, the flag, the request, the deadline, the exceptions, the loop and AMQP
   bindings, cadence.
3. **Exposition**: `map:instance` and the two statuses.

## Verification

**`comq`**, against its two brokers and once against RabbitMQ 3.10:

- a call is answered by the holder of its key;
- a call to a key nobody holds is refused at once;
- a sealed holder refuses new calls and answers those it holds;
- a second holder of a key waits, and takes the key when the first closes;
- a caller whose holder's connection is killed rejects at its timeout;
- over a sharded connection, a key bound on one broker is reached, and one bound on none is refused;
- a request nobody took before its timeout is never delivered to a consumer started afterwards;
- a request re-sent after a broker restart carries the time it has left.

**Toa**, with a fixture component whose ordinary `open` returns `context.instance` and whose stateful
`increment` keeps a counter in memory, the second process started on its own with `TOA_INSTANCE`:

- a call reaches the named process and leaves its sibling untouched, in-process and across processes;
- a call to a name nobody holds is refused;
- a call to a process that has stopped is refused;
- a call to a process that was killed is abandoned at the default deadline, and at a `timeout` given;
- a process waiting on a call to a killed process stops;
- a second process started with a held name serves once the first has gone;
- an ordinary call with a `timeout` to a component that is down is abandoned, and the component, once
  up, never receives it;
- through the gateway, a route with `map:instance` reaches the named process, a name nobody holds
  answers `404`, and a stateful operation behind a route without `map:instance` answers `400`.

## Compatibility

**On the wire, additive.** `stateful` in what discovery exposes and `instance` in a request are new
properties. The order of a rolling deploy matters once: an operation declared stateful stops consuming
its shared queue, so every caller must run a runtime that knows the flag before it is declared.

**In types, additive.** `Request` gains three optional properties, and `Context` gains `instance`.

**In behaviour, opt-in.** An ordinary call keeps waiting unless it asks for a deadline, and an operation
is stateful only where it says so. `comq`'s `request` keeps accepting an encoding as its third
argument.
