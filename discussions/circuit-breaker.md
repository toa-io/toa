# The circuit breaker

## Design concept

Nothing bounds how far a call travels. A component commits a state change, the outbox publishes an
event, a receiver of that event calls back into the component that published it, and that call
commits again — the same event, the same receiver, forever. Nothing stops it, because nothing about
it fails: the loop is made of successful operations, so no exception is raised, no attempt is
counted and nothing is parked. What an operator sees is a broker filling up and two components at
full load, with every log line saying the work succeeded.

The hazard is not exotic. Every component inherits four events from the root prototype and between
them one always fires — `sync` is unconditioned, and `created` and `updated` are `origin === null`
and `origin !== null` — so a receiver on someone's `sync` that writes back to its source is a cycle
written in one line of manifest.

A call therefore carries where it has been, and a call that has been here already is refused rather
than made. The chain is the runtime's: it is stamped, carried and read by the framework, and no
algorithm writes one or reads one.

What makes this cheap to state is that the refusal is an ordinary exception. It is named, so the
classification in `exception-handling.md` calls it permanent, so a message that hits one is parked
on the first attempt rather than retried — which is the only correct answer, because retrying a
cycle is another cycle.

### Guarantees

1. A call that has passed through the same hop `TOA_TRAIL_REPEATS` times is refused, and the
   refusal names the hop and the whole chain.
2. A chain longer than `TOA_TRAIL_DEPTH` is refused whether or not it repeats, so the chain is
   bounded on the wire and a cycle that repeats no single hop is still caught.
3. The refusal happens before the operation runs: nothing is acquired, nothing is committed, nothing
   is published.
4. A cycle is refused whatever it travels on — a call, an event, a task, or a delayed call.
5. Sibling calls are not a chain. An operation that calls one endpoint fifty times has made fifty
   chains of one hop, not one chain of fifty.
6. What a service or a scheduler originates starts a fresh chain: a pulse, a dispatcher scan and an
   HTTP request each begin at nothing.

### What a component author does differently

Nothing, to keep working. What changes is what they can rely on, and one thing they must know:

- Work that recurs without end is a **pulse**, not a call that delays a call to itself. A pulse
  originates from a clock, so every firing starts a fresh chain; a component that re-arms a delayed
  call to itself is a cycle and is refused on its third round. Where a detached delayed call is
  genuinely meant, `context.delay` takes an option that says so.
- A chain is a diagnostic as much as a guard. When one is refused, what the log carries is the whole
  path, and what is wrong is almost always a subscription rather than an operation.

## What happens today

Nothing. There is no hop counter, no depth bound, no deadline and no loop detection anywhere on the
call path or the event path. What exists is one hop of provenance and no more.

`request.source` names who made a call — `{namespace, component, operation}`, `{namespace,
component, event}` or `{service}` — and is stamped in three places: `Call.invoke`
(`runtime/core/source/call.ts:25`), `Receiver.receive` (`runtime/core/source/receiver.ts:85`) and
the node bridge's `Context` (`connectors/bridges.node/src/context.js:52`). It is read by exactly one
consumer, introspection (`extensions/introspection/source/Factory.ts:77`), which draws it as an edge
of the service graph. One hop is enough to attribute a call and cannot see a cycle.

The event envelope carries less still. `Message` is `{ payload, telemetry }`
(`runtime/core/source/types/message.ts`), and `Event.emit` builds it from the state change alone
(`runtime/core/source/event.ts:40`) — so the chain is severed at the emit boundary, and the consumer
reconstructs the origin from its own binding rather than from the message.

Two properties of the runtime make the gap wider than it looks. The outbox publishes **off** the
operation's path: `publish()` returns at once and `#pump` sends later, possibly from another replica
(`runtime/core/source/outbox.ts`). And a delayed call is replayed from a stored row minutes or years
afterwards (`extensions/cadence/source/Dispatcher.ts:301`). Anything that is to survive either has
to be written down, not held in a process.

## Design

### 1. The trail

```ts
// runtime/core/source/types/request.ts
export interface Request<Input = any, Entity = any> {
  // …
  source?: Source
  /** The hops this call passed through, oldest first. Stamped by the framework. */
  trail?: string[]
}
```

A hop is a string, and its shape is `source` flattened — the same three cases:

| hop          | written                                | example                  |
| ------------ | -------------------------------------- | ------------------------ |
| an operation | `<namespace>.<component>.<operation>`   | `default.orders.place`   |
| an event     | `~<namespace>.<component>.<event>`      | `~default.orders.placed` |
| a service    | `<service>`                            | `exposition`             |

Neither dotted form is built on the hot path: the event form is already a receiver's `destination`
(`runtime/boot/src/receivers.js:16`), and the operation form is already the span name,
`${locator.id}.${endpoint}`, memoized per endpoint (`runtime/core/source/component.ts:68-82`).

**The event carries a sigil because the two dotted forms are otherwise the same shape.** `sync` is
both the most-inherited event name in the system and an ordinary operation name, and `events` and
`operations` are independent maps in the manifest schema with nothing forbidding one key in both. A
collision would trip the breaker early, and early is not the harmless direction: the code is
permanent, so a spurious refusal parks legitimate work for an operator instead of retrying it.
Introspection has already answered the same question about the same union by discriminating
(`extensions/introspection/source/keys.ts:46-56`).

`Message` gains the same field, because the emit boundary is where the chain would otherwise break:

```ts
// runtime/core/source/types/message.ts
export interface Message<T = any> {
  payload: T
  telemetry?: string
  trail?: string[]
}
```

A trail is a **path down the call tree, not a log of what happened**, which is what makes guarantee
5 hold. It falls out of the array being copied on entry rather than pushed to, and the tests pin it.

### 2. Where it is written and where it is read

The trail rides the rails `telemetry` already does: set into an async context when a call is
entered, read out of it when one is made. An async context is required rather than convenient — the
node bridge's `Context` is built once per operation at boot and mounted on the algorithm
(`connectors/bridges.node/src/algorithms/runner.js:20`), and `execute(input, state)` is handed no
request, so an outgoing `context.remote.x.y.z()` has no other way to know which invocation it
belongs to. Every alternative — a per-invocation context, a proxy, a wider runner contract — either
resolves to the same lookup or breaks `Algorithm.execute`, the one contract every component author
writes against.

**It is core's own store, not openspan's.** `console.span` replaces the store with a fresh
`SpanContext` carrying only the trace fields, so the trail would be erased at the first span; and it
does not enter a context at all when the trace is unsampled. A trail that disappears under sampling
is a breaker that stops breaking in production.

`runtime/core/source/trail.ts` owns the storage and the rule. It is held on `globalThis` under a
symbol, for the reason openspan holds its own there: a process may carry two copies of the module,
and a trail that is empty because the writer sat in the other copy is a breaker that never fires.

Four places thread it.

**`Component.invoke` — the one choke point.** It knows both halves of a hop and already wraps the
invocation in an async context. Every inbound path reaches it: the AMQP producer invokes the
component for both an RPC and a task, the loop binding calls it directly, and a receiver reaches its
own operation through a `Remote`, a `Call` and a binding.

Two things it must get right. **Only the server side counts** — `Remote` is a `Component` too, with
`kind = 'client'` and the *callee's* locator (`runtime/core/source/remote.ts:11`), so counting there
as well would make the threshold depend on how many clients a call happened to cross, which is a
different number for a local call, an HTTP one and a delayed one. And **it never writes the trail
back onto the request**: the loop binding passes the caller's object by reference
(`connectors/bindings.loop/src/consumer.js:20`), so assigning there would reach into the caller's
own object. The extended trail goes into the async context and nowhere else — `request.trail` is
written on the way out and read on the way in, never both.

An endpoint whose name begins with `.` contributes no hop. That is the existing spelling of "this is
the runtime's, not the application's" (`connectors/bindings.amqp/source/producer.js:64`), and it
keeps discovery out of everyone's chain.

**`Call.invoke` — on the way out.** Beside where `source` is stamped: `request.trail ??= trail()`.
Assigned, never pushed to, and `??=` so the caller's own attribution wins — the same rule `source`
follows. This is what keeps a shared request object safe:
`extensions/exposition/components/identity.credentials/source/list.ts:17-23` builds one
`const request = { input }` and hands it to three components under `Promise.all`. Appending in place
there would put three copies of one hop on one array and refuse a plain credentials read.

A call from a **service** starts the chain rather than continuing one. The gateway, realtime and the
CLI call from no invocation, so where `Call` holds a `{ service }` source and nothing is inherited,
it seeds the trail with that name.

**`Receiver.receive` — an event continues the chain.** `trail` is taken out of the message by name,
beside `payload` and `telemetry`, and the receiver appends its own `#destination` as the event hop,
assigned **after** `add(request, extensions)` for the reason already written there — so a message
field cannot spoof it.

Leaving it to `add` would be quietly wrong. `add` is `merge(…, { ignore: true })`
(`libraries/generic/source/merge.js:61`), and with `ignore` set the array branch does nothing at all
— so where an adaptive bridge's `request()` has already put something there the message's trail is
silently dropped, and where it has not, the deserialized array is shared by reference.

Whatever comes off the wire is taken *as* a trail and nothing else: non-strings dropped, length
clipped one past the cap, which is enough to be refused. Without that guard a malformed field
becomes a `TypeError` on the hot path where a named exception was contracted for. The same guard
covers `request.trail`, since the request contract is `additionalProperties: true`, validates neither
this nor `source` (`runtime/core/source/contract/request.ts:59`), and is skipped entirely when
`authentic` is set.

A peer inside the context can still send `trail: []` and reset the breaker. Like `source`, this is a
guard against accidental wiring, not a security boundary, and the documentation says so.

**`Outbox.row` — across the commit/publish gap.** The one place the async context is not enough.
`row()` runs inside the operation's invocation, so it reads the trail there and writes it onto the
`Row`, which is persisted with the entity and survives a pump that runs in another replica an hour
later:

```ts
// runtime/core/source/types/outbox.ts
export interface Row {
  // …
  /** the hops that led to the change, so a receiver of it continues the chain */
  trail?: string[]
  event: Event
}
```

No migration and no storage change: the MongoDB outbox writes the row verbatim
(`connectors/storages.mongodb/src/outbox.js:181`), so an old row reads `undefined` and starts a
chain. Keeping the trail off `event` also keeps it clear of `connectors/storages.mongodb/src/storage.js:348`,
which rewrites `row.event`, and out of what a component's own event bridge is handed
(`runtime/core/source/event.ts:38`).

`Destination.emit` then takes the row rather than only `row.event`. **This is a signature two designs
want at once** — the idempotency stage of `exception-handling.md` needs the destination to see the
row id for `Message.id` — so it should change once. The implementers are `Emission` and convergence's
`Destination`; the latter ignores the trail, since a converged record is written rather than
transitioned and publishes nothing.

### 3. The rule

Two numbers, read the way the outbox reads its own (`runtime/core/source/outbox.ts:456-465`):

| variable             | default | what it does                                                  |
| -------------------- | ------- | ------------------------------------------------------------- |
| `TOA_TRAIL_REPEATS`  | `3`     | how many times one hop may appear before the call is refused   |
| `TOA_TRAIL_DEPTH`    | `32`    | how long a chain may grow at all                               |

Repetition is the signal and names the cycle; depth is the backstop for a chain that grows without
repeating a hop, and it is what bounds the array on the wire. No manifest surface in the first pass,
which is the call `exception-handling.md` makes about `retries` and `backoff` for the same reason:
the interesting variance is not yet known to be per-receiver.

Both are read on first use rather than at module load, so a scenario that sets the variable after
the module graph is imported can lower them.

`TOA_TRAIL_REPEATS=0` stamps the trail and refuses nothing. It is the off switch, and it exists
because this refuses calls an application may make today: a handshake written as
`a.op → b.op → a.op → b.op → a.op` is three occurrences of one hop. A breaker with no way to open it
is itself the outage.

### 4. The exception

```ts
// runtime/core/source/exceptions.ts
  Communication: 400,
  Transmission: 401,

  /** a chain that came back to where it had been, or went further than a chain goes */
  Loop: 500
```

A family of its own rather than a `402`. The whole `Communication` family is transient under the
classification — nothing was listening yet, so try again — and a loop is its exact opposite. One
permanent code inside a transient family means every later reader has to know the exception before
they can read the table, and this codebase already writes range checks over code families
(`extensions/exposition/source/exceptions.ts:33-35`).

It carries the trail, so a parked message can be read without guessing:

```
LoopException: 'default.orders.place' is hop 3 of this chain
  trail: exposition > default.orders.place > ~default.orders.placed >
         default.billing.charge > ~default.billing.charged > default.orders.place
```

Being named is what makes it permanent (`permanent(e) = e.code in names && !TRANSIENT.has(e.code)`),
so it is not added to `TRANSIENT`. Parked on the first attempt is right: another attempt is another
cycle.

**It is answered, not thrown.** `Component.invoke` returns `{ exception }`, exactly as
`Operation.invoke` does (`runtime/core/source/operation.ts:93`). Thrown, it would run into comq's
reply consumer on the AMQP path — the crash `exception-handling.md` is closing — and on the call
path its survival would rest on `Exception` not being an `Error`, which is true today but makes the
code's permanence depend on a subtlety instead of on the code. Answered, `Call.invoke` throws it
into the caller and `Receiver` hands it on for parking, both unchanged.

At the gateway it needs no mapping. The default arm of `rethrow` logs and rethrows, which becomes
`500`, and that is honest: a cycle is a fault in the topology, not something the client did. `508
Loop Detected` is a WebDAV code for a cycle in the resource graph the client asked about, it tells a
client nothing it can act on, and a distinctive status on a public gateway advertises that a request
shape makes the backend eat itself.

### 5. Cadence

A delayed call continues the chain, so a cycle routed through a delay is still a cycle. The change is
small: the metronome's `request` property is a free-form object and the dispatcher already spreads it
back onto the call — `{ input: null, ...row.request, task: true }`
(`extensions/cadence/source/Dispatcher.ts:301`) — so a trail written into it at `Aspect.delay`
persists and arrives with no schema change and no migration. The aspect runs inside the operation's
invocation, so it reads the trail from the async context, and it builds `{ ...request, trail }`
rather than writing into the object the algorithm handed it.

The argument on the other side is worth recording. A cycle through cadence is rate-limited by
`discreteness` — 60 seconds by default — so it is a slow leak rather than the runaway the breaker
exists for, while a component that re-arms a call to itself is refused on its third round. It is
counted anyway, because "slower" is not "bounded", and because the right shape for endless recurrence
already exists: a pulse, which starts a fresh chain every firing. What is genuinely one-shot-detached
says so on the call.

Cadence also resolves its remote with no `source` at all (`extensions/cadence/source/Local.ts:32`),
so delayed calls arrive as `{ service: 'unknown' }` to introspection. Same line, same pass.

### 6. What it costs

An `AsyncLocalStorage` used to tax a process globally: under the `async_hooks` implementation, merely
constructing one deoptimized promises everywhere, including code that never touched it. Node 24
defaults to `AsyncContextFrame` instead — the flag is `--no-async-context-frame` — and `package.json`
already requires `>= 24`. Measured on a six-hop chain, the global tax is 316 → 1403 ns on the old
path and 316 → 313 ns on the new one.

**So the `engines` floor is now load-bearing: it must not go below 24 while this exists, and the
runtime must not be run under `--no-async-context-frame`.** That is the whole of what follows from
this section.

What remains is local to the code entering the store, about 250 ns per hop, against a hop that is an
AMQP round trip and beside the 588 ns `console.span` that `Component.invoke` already spends on every
invocation. The rule is at most `TOA_TRAIL_DEPTH` string comparisons over an array already in cache,
and the hop string is not built. On the wire a hop is ~30 bytes, so a capped chain is under 1 KB
against a row that already holds two entity images. No budget, no sampling, no opt-out.

## Files

- `runtime/core/source/trail.ts` — new; the store, the rule, the hop.
- `runtime/core/source/exceptions.ts` — `Loop: 500`.
- `runtime/core/source/types/{request,message,outbox}.ts` — the field, and `Destination.emit`.
- `runtime/core/source/component.ts` — append and answer, server side only.
- `runtime/core/source/{call,receiver,outbox,emission,event}.ts` — write it and read it.
- `extensions/cadence/source/{Aspect,Local}.ts` — across a delay.
- `extensions/convergence/source/Destination.ts` — the `emit` signature only.
- `documentation/component/receiver.md` — what a chain is and what refuses a call.

## Stages

The order is forced by one thing: **a refusal on the event path is fatal until
`exception-handling.md` lands.** An exception reaching a receiver escapes into comq and ends at
`process.exit(1)`, so a breaker firing there converts an infinite loop into a crash loop — a worse
morning than the loop, which at least keeps serving. Its stage 3 is what makes a refusal park a
message instead.

That does not hold the first stage back, because until an event carries a chain, none crosses one: a
receiver's call starts at nothing and is one hop long, so the rule cannot fire there. Stage 1 refuses
on the call path only, where the caller is waiting and `Operation.invoke` already turns an exception
into a reply. It ships with `TOA_TRAIL_REPEATS` at `3` and needs nothing else.

1. **Calls.** `trail.ts`, the `Request` field, `Component.invoke`, `Call.invoke`, the exception.
   Independent of everything else, and safe on its own for the reason above.
2. **Events.** `Message.trail`, `Receiver.receive`, `Row.trail`, and the `Destination.emit`
   signature. **Decided: this waits** — for stages 1–3 of `exception-handling.md`, and so for the
   comq release those wait on. Two things are wanted from them, and neither can be had early: that a
   refused event is parked with its reason rather than ending the process, and that
   `Destination.emit` changes once rather than twice.

   The cost of waiting is stated rather than hidden: **until this lands, a cycle that goes through an
   event is not caught, and that is the cycle this document opens with.** Shipping the plumbing
   early with `TOA_TRAIL_REPEATS=0` — every request, message and row carrying its chain, and a
   warning where the rule would have fired — was weighed and turned down: it is interim code to
   write, test and then remove, for a diagnostic rather than a fix.
3. **Cadence.** `Aspect.delay`, the detached option, and the missing `source`. Follows the events
   stage, in a PR of its own: a delayed call is only a loophole once a chain crosses an event, and
   what it decides — that re-arming a call to yourself is a cycle — is worth reviewing on its own.

## Verification

Unit tests, `node:test` through `tsx`, beside the modules they cover:

- `trail.test.js` — the two rules and their exact boundaries; that an operation `placed` and an event
  `placed` on one component render differently; that appending returns a new array and leaves its
  argument untouched; that a malformed trail off the wire is taken as empty rather than thrown on.
- `component.test.js` — a hop is appended once on the server side and not by `Remote`; a `.`-endpoint
  appends nothing; the inbound request object is not mutated; a request at the limit is refused
  before the operation runs.
- `call.test.js` — an outgoing call carries the chain, a caller's own wins, and two calls made from
  one ambient chain get two arrays rather than one shared.
- `receiver.test.js` — the event hop is appended, and a message field cannot spoof the chain.
- `state.test.js` / `event.test.js` — the chain reaches the row and the message on all four
  row-building paths: `commit`, `ensure`, `massCommit` and `apply`.

Then Cucumber against the compose stack, in the shape `features/events/emission.feature` uses, with
two fixtures that each receive the other's `sync` and commit on receipt — the hazard in twelve lines
of YAML, and a shape that exists nowhere in the repository today:

- two components that receive each other's events settle at the count the limits predict, and the
  composition is still up and answering calls afterwards;
- the refusal names the cycle — the exception carries the repeated hop and the chain;
- a chain that repeats no hop is refused at the depth cap, with repetition set high, which proves the
  two rules are independent;
- three concurrent calls sharing one request object are not a cycle — the shape at
  `identity.credentials/source/list.ts:17-23` reduced to a fixture, and the scenario that fails if
  the trail is ever pushed to rather than assigned;
- a component that receives its own event is stopped;
- a legitimate chain shorter than the limits is not refused;
- a delayed call carries the chain, and a delay does not launder a cycle.

## References

- *Time to live* and hop counts in IP and DNS — the same mechanism, and the reason it is a count
  rather than a graph: no participant has to know the topology.
- SIP `Max-Forwards`, SMTP `Received:` and HTTP's `Via` — a chain each hop appends itself to, which
  is what makes a loop legible after the fact rather than only detectable.
- `508 Loop Detected`, RFC 5842 §7.2 — and why it is the wrong code here.
- *Circuit breaker* (Nygard, *Release It!*) — the name, though not the shape: that one trips on a
  failure rate against a dependency, this one on the path a single call has taken.
