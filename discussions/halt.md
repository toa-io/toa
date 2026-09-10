# Halt

## Context

There is no way to bring a deployment to a standstill and have it come back by itself. Scaling to
zero loses the pods, a rollout replaces them and comes back live, a network policy leaves every
process retrying into a wall at full rate. What is wanted is the state between running and gone: the
same processes, still up, holding nothing open, for a stated interval — a migration that must not run
against a live writer, a broker being drained and replaced, an incident where the right answer is
*stop doing anything and let me look*.

Building it needs one absence filled first. An extension has no way to put a connector in a
*process*: `tenant()` is per component, `aspect()` per context, `service()` is a process of its own,
and `manage()` is called only for compositions. An extension with no component of its own cannot
participate in a process at all — and that is why telemetry's readiness probe currently belongs to
whatever composition happens to be nearest, which the gateway had to work around with a probe of its
own (`extensions/exposition/source/HTTP/Probe.ts:10-12`, `migrations/275.md`). The probe lands where
it belongs on the way.

## Design concept

A halt is the teardown `SIGTERM` already performs, stopped one step short of the exit, and undone
later by building the tree again from the same inputs it was built from at boot.

**A halted process holds nothing open outward and does nothing inward.** Every connection it makes —
MongoDB, Redis, RabbitMQ — is closed. Every port it listened on stays bound: the readiness probe
answers `200`, because the process is well, and the gateway answers `503` with `Retry-After`, because
it is not working. When the interval it was given expires the process builds itself again and carries
on.

**A signal is a record.** `introspection.signals` is an ordinary entity component; a `POST` creates a
signal, and the prototype's `created` event (`runtime/prototype/events/created.js`) is published by
the transactional outbox on the committed write. Every process subscribes to it with no group, which
is a queue of its own per process. Delivery is guaranteed rather than fire-and-forget, and the
algorithm that writes it is a plain transition that knows nothing about fan-out.

**The runtime says what a halt is; an extension says when.** Core offers `Host.gate(build)` — where a
halt's boundary is — and `Host.halt(seconds)` — do it. Which event means *do it*, and whether there
is one at all, core never learns.

**Resume is a rebuild, not a reconnection.** Nothing is reused: a sealed communication is not
re-opened, a latched `stopped` flag is not reset. `boot.composition(paths, argv)` and
`create(references)` are functions of their arguments, and a fresh connector gets a fresh
communication (`connectors/bindings.amqp/source/factory.js:102`). This is the assumption the existing
code was already written under — `extensions/exposition/source/Tenant.ts:39`,
`extensions/introspection/source/Tenant.ts:34`, `extensions/configuration/source/Client.ts:88` and
`Connector#discarded` are each correct only because nothing is ever reconnected.

**A halt needs no channel open while it lasts**, because resume is on a timer. Each process records
its own deadline and tears down everything, the subscription that delivered the signal included.

### Guarantees

1. A halted process holds no connection to anything: no MongoDB, no Redis, no AMQP, no outbound
   stream. What it listens on it keeps.
2. A halted process stays up and stays ready. Nothing outside it acts: it is not restarted, evicted
   or replaced, and it stays a member of its Service.
3. The teardown is the graceful one. In-flight requests drain, the outbox drains, the introspection
   buffer flushes — every `close()` that runs on `SIGTERM` runs here, in the same order.
4. A halt ends by itself, from each process's own clock, with nothing reaching the process.
5. A halt reaches every process that shares the brokers it was published on, whatever that process
   runs and whether or not it hosts a component at all.
6. A halt that will not end is fatal rather than silent: after a bounded number of failed rebuilds the
   probe drops and the process exits non-zero.
7. The signal carries a role of its own, distinct from the one that reads the map, and a deployment
   that has not turned the feature on has nothing to post to and nothing listening.

### What is not promised

- **A halt cannot be cancelled, shortened or extended once begun.** Nothing can reach a halted
  process; that is the point of it.
- **A process that starts during a halt comes up running.** Nothing tells it, because nothing is
  running to answer. A rollout restart therefore un-halts a deployment, and is the escape hatch from
  a halt posted in error.
- **A halt reaches one deployment.** Regions are separate deployments with brokers of their own
  (`discussions/convergence.md:5`), so a signal published in one is never seen in another; halting a
  region means posting to that region's address.
- **Work in flight is worth what it is worth on a rollout.** A halt drains where a shutdown drains and
  loses where it loses.

### What a component author does differently

Nothing, to keep working. Three things become visible that were always true:

- **`rc` runs again.** `preflight`, `settle`, `dispose` and an algorithm's `mount`/`unmount` are
  per-build, not per-process. A halt is the first thing that tests the pairing they already promise.
- **Module scope does not.** A halt reloads no userland module, so anything at module scope survives
  it — a memoised JWKS map, a compiled regex, a counter.
- **A call to a halted component fails** the way a call to one that is down fails.

## What happens today

**A subtree cannot be torn down under a live dependant.** `Connector.disconnect()`
(`runtime/core/source/connector.ts:159`) reads `connected` of every dependant and returns without
doing anything if one is still up. The one way past it, `interrupt: true`, also sets `pending` at line
153, which skips `close()` at line 173 — so the only bypass of the refcount is also the one that makes
the teardown ungraceful. That is deliberate: `interrupt` is for a connection that never finished,
where there is nothing to close.

**The process root is built three times, three ways.** `compose.js:29-34`, `serve.js:27-29`,
`mono.js:21-23` each assemble a bare `new Connector()` or use the composition directly, then call
`graceful()` and `connect()`. Nothing above the composition has a class, a name or a lifecycle.

**An extension cannot reach a process.** `Factory` (`runtime/core/source/types/extensions.ts:52`)
offers `tenant`, `aspect`, `destination`, `storage`, `emitter` and `receiver` (per component),
`service` (a process of its own) and `manage` (a composition). And a `toa serve` process instantiates
its extensions directly (`runtime/cli/src/handlers/lib/services.js:68`), bypassing
`runtime/boot/src/extensions/resolve.js`, so an extension it was not named is never constructed there
— a hook alone would not be enough without the loading.

**So the probe belongs to whatever composition happens to be nearest.**
`extensions/telemetry/source/extension.ts:52` does `composition.depends(ready)` and patches
`composition.connect` at line 57. In a service process that composition is the one nested inside the
service, so the explorer's probe reports ready when the introspection components connect, not when the
explorer does. `HTTP/Probe.ts:10-12` says exactly this and works around it. Either way, the probe sits
inside the tree a halt would tear down.

**Kubernetes takes no action on a pod that goes unready.**
`operations/src/deployment/chart/templates/{compositions,services,mono}.yaml` declare a `startupProbe`
and a `readinessProbe` and no `livenessProbe`; an unready pod leaves its Service's endpoints and
nothing else.

**A per-process subscription to a component's event is a thing the runtime already does.**
`runtime/boot/src/receivers.js:48` — `receive(label, group, callback)` takes the group as optional,
resolves the binding by looking the source component up in discovery, and hands the rest to
`boot.bindings.receive`. With no group each subscriber consumes from a queue of its own, which is what
makes `extensions/configuration/source/Client.ts:76` reach every process of a context. Every entity
component emits `created`, `updated`, `deleted` and `sync` from the prototype
(`runtime/prototype/events/`), so nothing has to be declared for a signal to be publishable.

**Reconnection would not work, and the repo already knows it.** `Communication.close()` seals, and a
sealed one throws for good (`communication.js:118`); `Producer`, `Consumer`, `Emitter`, `Receiver` and
`Broadcast` hold theirs from construction. `Factory.#communication()` evicts a sealed entry and makes
a fresh one (`factory.js:102`), so freshly constructed connectors get working ones.
`runtime/boot/src/discovery.js:16-32` already replaces a disconnected `Discovery` rather than reusing
it, for exactly this reason.

## Design

### 1. `Gate` — the halt boundary

A `Gate` in `@toa.io/core` owns a subtree by reference rather than by `depends()`, and builds it from
a function rather than holding an instance:

```ts
export class Gate extends Connector {
  constructor (private readonly build: () => Promise<Connector>)
  protected async open ()   // live = await build(); await live.connect()
  protected async close ()  // await live?.disconnect(); live = null
  public async down ()      // the halt: disconnect and forget
  public async up ()        // the rebuild
}
```

Ownership rather than dependency is what makes the teardown graceful without touching `Connector`.
Nothing calls `depends(live)`, so `#links` is empty and the reduce at `connector.ts:159` answers
`false` and the return at line 161 does not fire; `interrupt` is not passed, so `pending` at line 153
is `false` and `close()` at line 173 runs; `#connecting` is awaited at line 156, so a build still
landing is waited for rather than raced. The refcount guard keeps its meaning — a connector cannot be
pulled out from under something using it — because the only graph where detaching is correct is the
graph that has no edge, and this is that graph.

Two costs, both paid explicitly: `Connector.debug()` walks `#dependencies`, so `Gate.debug()`
overrides and folds `live?.debug()` in; and `Connector.connect()`'s own error path calls
`disconnect(true)` (line 123), which skips `Gate.close()` — harmless, because the failure comes out of
`live.connect()`, whose own catch has already interrupted the partial subtree.

**Everything above a gate survives a halt; everything a gate owns is torn down and rebuilt.** That one
sentence is the whole placement rule.

### 2. `Workload` — the process root

`runtime/boot/src/workload.js`. Every handler builds one instead of a bare `Connector`. It is the
survivor side: it holds the residents, the deadline, and every gate in the process.

```js
const workload = new Workload(async () => { /* what the handler builds today */ })

graceful(workload)
await workload.connect()
```

`compose.js` moves `boot.composition(paths, argv)` and `create(references)` into the closure;
`serve.js` moves `create(paths)` and its empty-services check; `mono.js` moves `discover(paths)` and
the composition, which brings a mono boot failure inside the boot span for the first time.
`compose.js`'s `argv.kill` calls `workload.disconnect()`, unchanged. Everything in those closures is
already a function of its arguments, and `environment.absorb()` is idempotent
(`libraries/generic/source/environment.js:68`), so the second call builds what the first did.

`manage()` keeps meaning *what an extension wraps a composition in*, and stays where it is called.

### 3. `resident()` — what an extension puts in a process

The new hook, beside the seven that exist (`runtime/core/source/types/extensions.ts`):

```ts
/** what this extension keeps in every process, whatever that process runs */
resident?(host: Host): Resident | null

/** a connector that lives as long as the process, and is told how the process is doing */
interface Resident extends Connector {
  /** everything the process was built with has connected */
  complete?(): Promise<void>
  /** it is halted, and for how long */
  halted?(seconds: number): void
  /** it is back */
  resumed?(): void
}
```

`Resident extends Connector` with a small protocol beside it, the way `Aspect` does. `complete()`
is the phase telemetry's `composition.connect` patch used to fake, and which its own comment called
*"not expressible as a dependency"*.

**A resident survives a halt.** Something that must go down with one says so by wrapping itself:
`host.gate(() => …)` returns a `Gate`, which is a `Connector`, so it is a valid resident — the gate
survives, what it owns does not.

**Every process loads the predefined extensions.** `PREDEFINED`
(`runtime/norm/src/.component/extensions.js:32` — telemetry, fetch, introspection) moves to
`definitions`, where deployment facts live, and is read from both places: norm applies it to every
component, `Workload` resolves it in every process. Beyond that, `resident()` is asked of every
factory the process has loaded, the way `manage.js:7` already iterates `instances`.

Two `Host` methods go with it:

```ts
/** a part of this tree a halt takes down and builds again */
gate(build: () => Promise<Connector>): Connector

/** stops this process for `seconds`, then builds it again */
halt(seconds: number): void
```

The handlers call `gate` around the composition and exposition calls it under its server; an
extension that calls neither keeps its connections through a halt, so a service nothing connects to
gates itself whole — configuration, realtime, cadence and the explorer each do. `halt` is called by
whoever hears a signal.

A host made without a workload answers both all the same: a composition booted on its own — by a
scenario, or by `toa call` — is not a process, so its gates are ones nothing ever takes down. That is
what keeps `service()` callable outside a process, which every suite that boots one relies on.

### 4. Where each kind of process puts its gate

| process | survives | inside a gate |
| --- | --- | --- |
| every process | telemetry's `Ready`, introspection's listener's gate | — |
| composition (`toa compose`) | — | the whole composition |
| gateway (`exposition.service()`) | `HTTP/Server` and its `Probe` | `Gateway`, `Remotes`, the nested identity composition, the atom |
| explorer, configuration UI | — | the composition, the explorer and its UI |
| realtime, cadence services | — | the whole service |

The rule: **what a client connects to may survive its gate and answer `503`; what nothing connects
to goes down whole.** The gateway is the one that keeps a port, because a refused connection is not
an answer and the answer has to be the application's.

### 5. The gateway

`extensions/exposition/source/service.ts` returns the `Server` with `server.depends(host.gate(…))`,
the gate building `Gateway`, `Remotes`, the nested composition and the atom and attaching the
processor. `Server.listener` answers `503` with `Retry-After: <seconds until resume>` while nothing is
attached — today `attach()` is unconditional and `this.process` is assumed present.

`HTTP/Probe.ts` is untouched: it is owned by `Server`, and `Server` survives.
`TOA_TELEMETRY_READY: false` for the gateway workload stays as it is.

### 6. The probe

`Ready` stays in telemetry and stops being `manage()`'s business: `Factory.resident()` returns it,
`Factory.manage()` and the `composition.connect` patch are deleted, and `Workload` calls
`ready.complete()` when the build is up, `ready.halted(seconds)` and `ready.resumed()` around a halt.
The probe becomes one per process rather than one per nearest composition, and `Ready.skipped`
latching on `EADDRINUSE` (`Ready.ts:60`) stops mattering.

While halted the probe answers **200**, with `x-toa-halted: <seconds remaining>`. It reports that the
process is well, which it is; that the process is not working is said where it is readable — the
header, one `warn` at the start and one `info` at the end, the gateway's `503`, and the signal record.
The one thing this asks of a future liveness probe is that it does not test the connections a halt
closes.

### 7. The listener, and the lead

`extensions/introspection/source/Halt.ts`, returned from introspection's `resident()`:

```ts
public resident (host: Host): Resident | null {
  if (this.options?.halt !== true) return null

  return host.gate(async () => new Halt(host))
}
```

Gated, so it goes down with the halt and comes back with the rebuild, which is what makes zero
connections true. `Halt.open()` is `extensions/configuration/source/Client.ts:76` in miniature:

```ts
const consumer = await this.host.receive(EVENT, subscription)   // no group: a queue of its own

this.depends(consumer)
await consumer.connect()
```

and the subscription does `this.host.halt(signal.seconds)`.

**`halt()` returns immediately and defers the teardown by a lead of two seconds.** The listener runs
inside the consumer callback, and the teardown would seal the very communication that callback is
being awaited by. The same lead lets the gateway write its reply before it stops accepting.

The deadline is **local**: what crosses the wire is a duration, and every process computes its own
deadline from its own clock at receipt. No clock agreement is needed and skew cannot end a halt early.
The cost is that the halt ends over an interval of milliseconds rather than at an instant.

Each process delays its rebuild by `random() * min(window / 10, 5s)`, so a fleet does not arrive at
MongoDB and RabbitMQ in one tick. The 5-second cap is against the gateway: `SETTLE_TIMEOUT` is 30
seconds (`extensions/exposition/source/Gateway.ts:386`) and `KNOCK_DELAYS` is `[0, 500, 1000, 1500]`,
so a spread inside 5 seconds is absorbed by discovery, and a wider one has the gateway up with an
empty route table serving 404s.

A rebuild that throws is retried three times with backoff, and what came up before the failure goes
down again so the next attempt is a build rather than a repair. After the budget the workload
disconnects — which takes the probe with it — and the process exits non-zero, as a boot failure does
(`runtime/cli/src/program.js:33-39`). A process up with a green probe rebuilding for ever is the
failure mode this feature exists to avoid. The budget matters more than it looks: comq's
`Connection#running` stays `true` across a close (`node_modules/comq/source/connection.js:328`), so
after one successful open every connect exception is treated as transient, and a rebuild against a
broker that is gone for good would retry for ever.

**The subscription is not awaited.** In the explorer process the listener and the composition that
hosts `introspection.signals` come up together, so the discovery lookup the subscription makes
(`receivers.js:66`) is issued before that composition has exposed itself, and `Discovery` waits as
long as it takes (`runtime/boot/src/discovery.js:16`). `Halt.open()` therefore starts it and returns,
the way `Reporter.acquire()` does for the same reason. A halt is not worth holding a boot for.

### 8. The signal

An ordinary entity component shipped by introspection, beside `nodes` and `edges`:

```yaml
namespace: introspection
name: signals

entity:
  properties:
    type:
      type: string
      enum: [halt]
    seconds:
      type: integer
      minimum: 30
      maximum: 3600
  required: [type, seconds]

operations:
  # `query: false` is what makes this a new signal rather than a change to one, and the
  # properties are the entity's own say on themselves, so the bounds are stated once
  create:
    query: false
    forward: transit
    input:
      type: object
      properties:
        type: { type: string, default: . }
        seconds: { type: string, default: . }
      required: [type, seconds]
  transit:
    concurrency: retry
    input:
      type: object
      properties:
        type: { type: string, default: . }
        seconds: { type: string, default: . }

# the map must not describe itself
introspection: false

exposition:
  isolated: true
  /:
    auth:role: system:halt
    io:output: true
    GET: enumerate
    POST: create
    /:id:
      GET: observe
```

The component ships no algorithm: `create` forwards to `transit`, which is the prototype's, and
`query: false` is what makes a `POST` on the collection a new signal rather than a change to
whichever one a query happened to match. `{ type: string, default: . }` is the placeholder that
resolves to the entity's own schema for that property, so the bounds are stated once and the
operation cannot drift from them. `pots` in the exposition suite is the same shape.

The role is `system:halt`, distinct from `system:introspection`: reading the service map and stopping
the application are not one privilege, and the map's role is already handed to whoever draws the UI.

**The record needs no retraction.** `CREATED + seconds * 1000` is either in the future or it is not,
so "is a halt on?" is answerable from the record alone — which is what makes storing one safe even
though the write is possible at the start of a halt and impossible at the end. It also leaves the door
open to a booting process reading the latest signal before completing, closing the *starts during a
halt* gap at the price of the rollout escape hatch; that is stage 5.

### 9. Bounds, and the off switch

The schema bounds what can be created; the receiver clamps again, because the receiver is what has to
come back and a record can outlive the release that wrote it.

| bound | value | why |
| --- | --- | --- |
| minimum | 30 s | a gateway drains for 10 s and comq shuts down over ~5 s; below this a halt is mostly teardown |
| maximum | 1 h | a halt is invisible from outside, so a runaway one is an outage with a green dashboard |
| default | 60 s | the shortest halt worth having |
| lead | 2 s | the reply is written and the message acked before anything closes |
| jitter | `min(window / 10, 5 s)` | spreads the reconnect without outrunning gateway discovery |
| rebuild | 3 attempts, 2 s → 8 s, then exit | a broker still coming back is the expected failure |

The switch is an `introspection.halt` annotation, read by the extension out of `TOA_INTROSPECTION` the
way `options.ui` already is (`definitions/source/extensions.introspection/annotation.ts`), and it is
**off by default**. A fleet-wide stop button reachable over HTTP is a denial-of-service primitive with
one role between it and the internet. A deployment that has not asked for it deploys no `signals`
component and returns `null` from `resident()`, so there is nothing to post to and nothing listening.

### 10. What a rebuild must not corrupt

**Already correct, and depended upon.** `runtime/boot/src/bindings/factory.js:1` — the binding factory
is cached per process and must stay cached, because the AMQP `Factory` is what makes a rebuild work.
`connectors/bindings.amqp/source/factory.js:102` never hands out a sealed communication.
`runtime/boot/src/discovery.js:16-32` replaces a disconnected instance.
`connectors/atomicity/src/connection.js:81-90` nulls and rebuilds symmetrically.
`connectors/storages.mongodb/src/client.js:182-189` is refcounted and re-creates — with one hazard:
`close()` reads `INSTANCES[this.key]` unguarded, and an `open()` that throws between the `??=` at line
121 and `count++` at line 127 leaves the count one high, after which the `MongoClient` is never closed
and guarantee 1 is silently false. Guarded in the same pass.

**Broken silently by a rebuild.** `runtime/boot/src/extensions/instances.js:4` holds extension
factories for the life of the process, so anything a factory memoises outlives the tree it was made
for:

- `extensions/introspection/source/Factory.ts:130` — `this.reporter ??= new Reporter(…)`. A
  disconnected `Reporter` is handed to every rebuilt tenant; its `remotes` still name dead `Remote`s,
  so `ready()` answers `true`, `flush()` dispatches into nothing, and every failure lands in
  `console.debug`. Introspection is dead for the life of the process and says nothing.
- `extensions/cadence/source/Factory.ts:67` — `this.locals[locator.id] ??= new Local(…)`, and
  `Local.ts:26` caches `this.remote ??= this.locate()`. After a halt no pulse and no delayed call
  works, silently, for ever.
- `extensions/convergence/source/Factory.ts:86` — `this.outbound ??= host.outbound(…)`; after a halt
  it sits on a sealed communication and every converged row fails to publish.

The fix is one shape, already in the repository:
`extensions/configuration/source/Factory.ts:28` reads
`if (this.client === null || this.client.disposed) this.client = new Client(this.host)`. Every factory
above adopts it, and `disposed` becomes a small `Connector` protocol rather than a field each of them
invents. Telemetry's `this.ready` (`extension.ts:36`) is the one memoised connector that is correct to
keep: a resident is meant to outlive the builds.

**Leaks rather than breaks.** `Connector.link()` pushes and nothing removes, so every survivor
depended on again by a rebuilt tree grows `#links` by one per component per halt. Stale entries have
`connected === false`, so the reduce at `connector.ts:159` is unaffected, but the array is walked on
every disconnect and never shrinks. It bites the process-wide singletons first
(`connectors/atomicity/src/factory.js:18`, `connection.js:108`), and is bounded by halts × components
— negligible for a deployment, real for a suite that halts in a loop. `unlink()` beside `link()`,
called from `dispose()`.

## Files

- `runtime/core/source/gate.ts` — new; exported from `index.ts`. `connector.ts` gains `disposed`,
  and `types/extensions.ts` gains `Factory.resident`, `Resident`, `Host.gate` and `Host.halt`.
- `runtime/boot/src/workload.js` — new; the root, the residents, the deadline, the rebuild.
- `runtime/boot/src/host.js` — the two `Host` methods, bound to the workload where there is one.
- `runtime/cli/src/handlers/{compose,serve,mono}.js` and `lib/services.js` — build a `Workload`
  around what the command runs, and gate the composition inside it.
- `definitions/source/predefined.ts` — `PREDEFINED` moves here;
  `runtime/norm/src/.component/extensions.js` reads it.
- `extensions/telemetry/source/{extension.ts,Ready.ts}` — `manage()` deleted, `resident()` added,
  and the probe learns to say it is halted.
- `extensions/exposition/source/service.ts`, `source/HTTP/Server.ts` — the gate under the server,
  and the `503` reply.
- `extensions/{introspection,configuration,realtime,cadence}/source/Factory.ts` — each service
  says what a halt takes of it.
- `extensions/introspection/components/introspection.signals/manifest.toa.yaml` — the component.
- `extensions/introspection/source/{Halt.ts,Factory.ts}` — the listener, `resident()`, and the
  replace-when-disposed rule for the `Reporter`.
- `definitions/source/extensions.introspection/{const.ts,annotation.ts}` and
  `definitions/schemas/extensions.introspection/annotation.cos.yaml` — the event label, the
  bounds, and the `introspection.halt` annotation.
- `extensions/{cadence,convergence}/source/Factory.ts` — replace a disposed singleton.
- `extensions/configuration/source/Client.ts` — its own `disposed` gives way to the inherited one.
- `connectors/storages.mongodb/src/client.js` — the refcount guard.
- `userland/stage/src/workload.js` and `features/steps/.workspace/components/workload.js` — a
  suite boots a process where what it is asserting belongs to one.
- `documentation/{halt.md,extensions.md}` and `readme.md`.

## What is not done

- **`unlink()` beside `link()`.** The leak in §10 stands: a resident depended on again by a
  rebuilt tree grows `#links` by one per component per halt. Bounded by halts × components, so
  it is nothing for a deployment and something for a suite that halts in a loop.
- **Stage 4, scoped halts**, and **stage 5, halted at boot**. Neither is started.

## Stages

1. **`Gate` and `Workload`.** The two classes, `Host.gate` and `Host.halt`, the three handlers,
   `graceful` taking a workload. *Done.*
2. **`resident()`, and the probe with it.** The hook, the `Resident` protocol, `PREDEFINED` moved
   and loaded per process; telemetry's `manage()` becomes `resident()`. The probe is one per
   process rather than one per nearest composition, and the `composition.connect` patch is gone.
   *Done.*
3. **Halt.** The `signals` component and its role, `Halt` and introspection's `resident()`, the
   gateway's gate and its `503`, the `introspection.halt` annotation, the bounds, and the
   singleton fixes in §10. *Done.*
4. **Scoped halts.** An `only: [component ids, service names]` property on the signal that every
   process evaluates locally. Costs uniformity — a partial halt leaves live callers calling dead
   callees — which is itself worth being able to observe.
5. **Halted at boot.** A booting process reads the latest signal before completing, closing the
   *starts during a halt* gap at the price of the rollout escape hatch.

## Verification

**Unit, `node:test`.** `runtime/core/test/gate.test.js` pins what the design rests on — that a
gate closes what it holds gracefully **with a live dependant above it**, which is the one thing
`Connector` otherwise refuses — and that what comes back is a different object.
`runtime/boot/src/workload.test.js` pins the process: a gate goes down and what is above it does
not, `halt()` returns before anything closes, two overlapping halts make one cycle, and a halt
before the process is up does nothing. `extensions/telemetry/source/Ready.test.ts` covers the
probe answering `200` with `x-toa-halted` for as long as the halt lasts.

**Cucumber**, `extensions/introspection/features/halt.feature`: a signal is written, and every
socket the process holds to the broker, the database and the cache is gone; and, under `@timing`,
they are back. It boots a `Workload` rather than a composition, because a halt is about a process.

`features/extensions/telemetry.feature` now runs its components as a process for the same reason:
readiness belongs to one, so a bare composition no longer has a probe.

**By hand, against the compose stack.** A composition of `mongo.outbox`, halted for three seconds:
a call answered before, `{ amqp: 1, mongo: 2, redis: 1 }` while running, `{ 0, 0, 0 }` while
halted, back to `{ 1, 2, 1 }` after, and a call answered again — which is what says the
communications are fresh rather than sealed.

## Compatibility

**On the wire, nothing changes.** No existing message, route or record changes shape.

**For an application, nothing changes.** A deployment that never posts a signal behaves as it does
now; a gate is a node that connects once and never closes. With `introspection.halt` off there is not
even a subscription.

**In the extension contract, one hook and two `Host` methods, all additive.** `Factory.resident` is
new; `Factory.manage` keeps its signature and its meaning. Telemetry's implementation of `manage` goes
away, a deletion inside one extension. `documentation/extensions.md` gains the paragraph that says
what a resident is and that it survives a halt unless it gates itself.

**In `@toa.io/boot`, one addition.** `boot.Workload` is exported and the three CLI handlers use it.
`boot.host()` still answers without one, so a composition booted directly — by a scenario, by
`toa call` — keeps working, with gates nothing takes down.

**One behaviour moves, and it is the probe.** Readiness belonged to whichever composition happened
to be nearest and now belongs to the process, so a composition booted on its own has none. That is
the point of the change rather than a cost of it — an explorer used to report ready when the
components nested inside it connected — but a suite that composed and then read the probe has to
run a process instead. `userland/stage/src/workload.js` is that, and one scenario in
`features/extensions/telemetry.feature` uses it.

**In behaviour otherwise, one thing to know.** A composition can now be torn down and rebuilt
inside one process. Anything that assumed a component's connectors are made once per process is now
wrong, and §10 is the list of everywhere that assumption was made.
