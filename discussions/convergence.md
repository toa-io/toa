# Convergence

## Goal

Two or more deployments of one context, each with its own database, converging on the same entity
state. A region is a deployment, not a variant: one context declares every region there is, and
which one a deployment is, is chosen when it is deployed.

Toa's readme states eventual consistency as a goal and marks it "not yet". Nothing in the
repository knows what a region is — there is no replication, no clock over state and no broker
topology. What exists and is reused whole is single-cluster optimistic concurrency (`VERSION`) and
the transactional outbox.

A committed state change is published to the region's convergence transport, carried to the other
regions by RabbitMQ federation, and written into their databases as it stands where the record it
replaces is older.

## Out of scope

Convergence carries entity state and nothing else. Blob storage (`extensions/storages`), cadence
delays and the outbox rows themselves do not converge.

Convergence carries what happens after it is on. There is no bootstrap and no backfill: seeding a
new region is a database copy, made before it serves.

A record is replaced entire. There is no field-level merge, and no mechanism that merges two
concurrent writes into one record.

Toa does not configure, assert or monitor the federation. Upstreams and policies are written by
whoever runs the brokers.

Only RabbitMQ implements the transport.

## Declaration

Written at the root of the context, and in no manifest:

```yaml
# context.toa.yaml
convergence:
  - region: eu
    priority: 0 # a rank: 0 outranks 1
    binding:
      provider: amqp
      pointer: [amqp://rmq-eu-0, amqp://rmq-eu-1]
  - region: us
    priority: 1
    binding: { provider: amqp, pointer: amqp://rmq-us }
```

A context that declares convergence converges every component that stores anything. There is no
per-component opt-in and no opt-out, as the outbox has none; turning the outbox off for a
component is what turning convergence off would amount to anyway, and if that is ever wanted it is
one switch added to both at once.

`provider` names the binding. `pointer` is a [pointer](/libraries/pointer), so a URL carries no
credentials and shards syntax works — but it is flat, a URL or a list of them, and the schema
permits nothing else. The Pointer's nested keys select a URL per component or namespace, which is
meaningless here: a region has one set of brokers.

Which region a deployment is, is a variable, as the environment selector itself already falls back
to one:

```shell
$ TOA_CONVERGENCE_REGION=eu toa deploy production
```

The CLI knows nothing of it. `environment.get` falls through to `process.env` and `toa` loads
`.env` into the store before anything runs, so the extension's own `deployment` reads it, and an
operator can write it in `.env` rather than prefixing every command.

A deploy renders the whole table, because the rule needs every region's rank, and the pointer of
the region it is — the other regions' addresses are not that deployment's business and their
credentials would be secrets nothing reads:

```
TOA_CONVERGENCE_REGION      eu
TOA_CONVERGENCE_REGIONS     {"eu":0,"us":1}
TOA_CONVERGENCE_BINDING     @toa.io/bindings.amqp
TOA_CONVERGENCE_POINTER     ["amqp://rmq-eu-0","amqp://rmq-eu-1"]
                            + __USERNAME / __PASSWORD secret references
```

## The rule

A record carries the priority of the region that last wrote it. An incoming record wins where

```
remote.VERSION > local.VERSION
or (remote.VERSION == local.VERSION and remote.PRIORITY < local.PRIORITY)
```

`VERSION` is already a Lamport clock in disguise. `Entity.#write` increments off whatever was
loaded, so a record written verbatim at `VERSION: 7` makes the next local write `8`, and nothing
has to be added for the counter to advance across regions.

Priorities come from the declaration and are the same in every region, so the ordering is total
and every region computes the same winner regardless of what it hears first. Two records can never
share both a version and a priority — a region writing twice increments `VERSION`, and the
compare-and-swap in `Storage.set` prevents two writes at one version — so the order has no ties
and there is no residual case.

The record carries the priority rather than the region, because the storage compares it and a rank
is what compares. The extension is where regions are known: it maps the region a message names to
that region's rank, and hands the storage a number.

`priority` is read only here. It decides nothing else.

Convergence follows: the rule is a maximum over a total order, so a record that is not newer is
dropped and a late one and a duplicate are the same thing. This is why the broker is asked for no
ordering and none is needed.

## Topology

Two exchanges on every region's convergence brokers, the same two names everywhere:

- **`convergence.out`**, direct and durable. This deployment publishes here, routing key
  `<namespace>.<name>`. Nothing local binds to it, so a region is never delivered its own writes.
- **`convergence.in`**, direct and durable, federated from every other region's `convergence.out`
  by one policy over one upstream set. Federation feeds a downstream exchange from an upstream one
  of a different name, which is what keeps the two directions apart.
- **One durable queue per component**, `convergence.<namespace>.<name>`, bound to `convergence.in`
  under that component's key.

At 30 components and 3 regions that is 2 exchanges, 2 federation links and 30 queues per broker,
and one delivery per message. Nothing scales with the number of regions but the links, and nothing
scales with the number of components but the queues and their bindings.

Mirroring the event topology — one exchange per component — costs the same throughput but 60
federation links, each with its own internal queue on the upstream and its own failure. One
exchange per region costs the binding the region set, to bind a queue to each.

Federation propagates a downstream queue's binding keys to the upstream's internal queue, so a
region pulls only records for components it actually runs.

Every replica of a composition consumes the same queue, so a record is merged once however many
pods are running. The merge is idempotent regardless.

Every region runs the same components. Where one does not, no downstream binds that key and the
publishing region's own `convergence.out` cannot route the message; publishing `mandatory` makes
that visible, as `Communication` already logs a returned message.

## Destinations in the outbox

A row is published to more than one place, and each place settles on its own.

Today a row is published or it is not, and `Outbox.#publish` is all-or-nothing across everything
it sends. With a second destination that is a defect: a convergence publish that fails leaves the
row unmarked, the pump re-reads it every cycle, and the component's own events are republished
with it — a duplicate of every internal event every interval, per stranded row, for as long as a
cross-region broker is down. The coupling runs both ways.

So the outbox learns destinations, not convergence. One row, a set of destinations it is
outstanding for, each published and marked independently. Core never says "convergence"; it says
that a committed change has somewhere to go, of which the component's events are one.

```ts
/** somewhere a committed state change goes; a component's `Emission` is one */
export interface Destination extends Connector {
  /** what a row is outstanding for, as the row records it */
  readonly name: string

  emit(event: Event): Promise<void>
}
```

The row gains one field, and `published` keeps its meaning — settled everywhere:

```js
{
  _id, lane, published: false, pending,
  outstanding: ['events', 'convergence'],   // what has not been sent yet
  event: { origin, state, trailers, input }
}
```

Because `published` is unchanged, `pending()` and both indexes are untouched: the partial index
still holds only what is not fully sent, and the TTL still reaps by `publishedAt`. What changes is
`settle`, which takes the destination it is settling and, in one pipeline update, removes it and
marks the row published where nothing is left.

A row written by an earlier version has no `outstanding`. It reads as `['events']`, so there is no
migration and no stranded row.

**One cycle, not one per destination.** The read is what a cycle costs and it is the same read:
`pending()` answers with rows outstanding for anything, and each row says which destinations still
need it. Lane ownership, `gap`, the `onassigned` hook and the drain are per replica, not per
destination.

`#published` and `#publishing` become one set per destination, and `#publish` sends to each of a
row's outstanding destinations in parallel, one rejecting no longer touching the others. `#mark`
groups ids by which destinations completed for them and settles a group at a time, so the healthy
case — every destination landing in the same window — stays one batched write per cycle, covering
every row and every destination, as it is today. A second write happens only where the
destinations diverged, which is the failure this exists for.

**`INFLIGHT` becomes a cap per destination.** A publication has no timeout on purpose — comq waits
for a dead broker to come back rather than failing — and `#pump` awaits a page before the next
cycle may start. With one shared cap a hung convergence broker would stall recovery of the
region's own events, which is the coupling destinations exist to remove. Per destination, a dead
one fills its own cap, the cycle stops handing it rows and carries on with the rest, and its rows
stay outstanding until it returns.

A component gets an outbox where it has any destination at all, which is what
`runtime/boot/src/outbox.js` already says with one of them. Destinations are collected from the
manifest, so the flag that tells the storage whether the outbox collection exists is known before
the storage is made and the order in `runtime/boot/src/component.js` does not change:

```js
const events = boot.events(manifest)
const destinations = await boot.extensions.destinations(manifest)
const storage = await boot.storage(manifest, events !== undefined || destinations.length > 0)
// …
const outbox = boot.outbox(manifest, storage, emission, destinations)
```

`boot.extensions.destinations(manifest)` is the third member of a family that already has
`aspects(manifest)` and `tenants(manifest)`.

## The binding

`runtime/core/source/types/bindings.ts` gains two optional factory methods, and
`@toa.io/bindings.amqp` implements them. They forward messages and nothing else: no locator, no
region, no record — a label, a message, and the brokers to carry it over. An extension that ships
changes to an analytics system takes the same `outbound`, and there is nothing in it for such an
extension to ignore.

```ts
export interface Factory {
  // …

  /** publishes to `channel`, addressed by label */
  outbound?(channel: string, uris: string[]): Outbound

  /** what arrives on `channel` under `label` */
  inbound?(channel: string, uris: string[], label: string, sink: Inbound): Connector
}

export interface Outbound extends Connector {
  send(label: string, message: object): Promise<void>
}

export interface Inbound {
  accept(message: object): Promise<void>
}
```

`accept` takes no label: `inbound` fixed it, so the queue carries that one routing key and nothing
else. A consumer that ever wants several labels on one queue takes `labels: string[]`, and the
label comes back with the message; nothing needs that now.

`channel` is a neutral name the caller picks, from which the binding derives whatever its
transport needs, as `broadcast(name, group)` already derives `system.<name>`. `uris` is the broker
set: the caller resolves its own pointer and hands over connection strings, which is what
`Communication` consumes anyway, so a second broker set costs the binding no configuration and no
variable of its own.

In AMQP terms, `channel` names the exchange pair and `label` names the routing key, the binding
key, and the queue after it:

```
outbound('convergence', ['amqp://rmq-eu'])
  exchange.declare  convergence.out           direct, durable

send('store.orders', message)
  basic.publish     exchange=convergence.out  routing_key=store.orders
                    delivery_mode=2, mandatory

inbound('convergence', ['amqp://rmq-eu'], 'store.orders', sink)
  exchange.declare  convergence.in            direct, durable
  queue.declare     convergence.store.orders  durable
  queue.bind        queue=convergence.store.orders
                    exchange=convergence.in   routing_key=store.orders
  basic.consume     convergence.store.orders
```

**The body is the message and nothing else.** What `send` is handed is what is published, encoded
and no more; what `accept` is given is what arrived. The binding adds no envelope, no field and no
header of its own, and strips none.

This is the rule that makes the pair general, and the events path is the counterexample: an
`Emitter` publishes `{ payload, telemetry }` under a `toa.io/amqp` header and a `Receiver` sniffs
for that header, re-wrapping anything without it. That is fine where both ends are Toa and fatal
where one is not — a message shape is often somebody else's contract, and an extension shipping
changes into an external system must be able to send exactly what that system accepts.

Which leaves the message wholly to whoever sends it. Convergence's is its own shape, owned by the
extension at both ends and named by nothing in core:

```ts
/** @toa.io/extensions.convergence */
interface Message {
  /** the record as it stands — VERSION, timestamps and all */
  record: Record

  /** the region that wrote it; what the tie-break ranks */
  region: string

  /** W3C traceparent, so the merge continues the trace of the write that caused it */
  trace?: string
}
```

`trace` is there because convergence owns both ends and wants it, not because a binding put it
there. The label is the component, `<namespace>.<name>`.

The extension resolves no binding itself: it asks the host for the one its configuration names, as
it already asks for a broadcast channel or a consumer. `Host` gains two methods beside its five:

```ts
outbound(binding: string, channel: string, uris: string[]): Promise<Outbound>
inbound(
  binding: string,
  channel: string,
  uris: string[],
  label: string,
  sink: Inbound
): Promise<Connector>
```

A binding named in the configuration that implements neither is a configuration error, and
`runtime/boot/src/bindings/` says so naming the provider.

## The extension

Two contributions, both of the shape the extension interface already has:

```ts
export class Factory implements extensions.Factory {
  /** out */
  destination(locator, declaration, manifest) { … }

  /** the region on a record, and in */
  storage(storage, locator, manifest) { … }
}
```

**It reaches every component without any of them naming it.** An extension is loaded, deployed and
hooked because a component's `extensions` names it, and none will. So where the context declares
convergence, a step in `runtime/norm/src/context.js` — after the components are read and before
`dependencies(context)` — adds it to the `extensions` of every component that has an `entity`.
Everything downstream then works unchanged: boot loads it, the dependency map carries it, and
`deployment(instances, annotation)` is given exactly the components that converge. It runs after
`.component/extensions.js` has normalized what a manifest declared, which is fine because there is
nothing per-component to normalize — the extension has no `manifest()` at all.

**What it costs to turn on.** Every stored component gets a destination, so every stored component
gets an outbox and therefore a transaction per write — the cost that `documentation/outbox.md`
today calls "the static check that keeps the common case free of a transaction". Convergence is a
context-wide decision and that is its price.

**Out** is a `Destination` named `convergence`, whose `emit(event)` sends the whole new record
under the component's label, saying which region wrote it:

```
send(locator.id, { record: event.state, region, trace })
```

**In** is the storage decorator. A record from another region is written verbatim: its `VERSION`,
its timestamps, its provenance. That is not an operation and not a `State` commit, so it needs a
`Storage`, and the decorator is one. It holds the storage by construction, needs no lookup and no
registry, is made and torn down with the component, and — because a dependency closes after its
dependant — the storage under it is still whole while a delivery drains.

```
Converging implements Storage, Inbound, depends(storage)
  open()            host.inbound(binding, 'convergence', uris, locator.id, this) → connect
  accept(message)   this.merge(message.record, priority(message.region))
  close()           stop consuming; the storage under it closes after
  store/upsert/…    PRIORITY on write, off on read, everything else delegated
```

`accept` refuses a region the table does not carry — that is a misconfiguration, and dropping is
safer than guessing a rank.

### Where the precedence is kept

A record carries the priority of the region that last wrote it, as `PRIORITY`. It is not an entity
property, not a system property, and no component or prototype declares it. Applications that do
not converge never see it, and nothing needs a migration.

The decorator writes its own region's priority on `store`, `massStore`, `upsert` and `ensure`, and
removes it on `get`, `find` and `stream`. `merge` writes the priority it is given instead: that
record was written elsewhere. `store` gets a shallow copy rather than a mutation, because the
record it is handed is the entity's own state object — the same one the outbox row holds — and
writing into it would put `PRIORITY` on the wire and in front of a condition bridge.

A rank rather than a region name is what is stored, because a rank is comparable and a name is
not: an order over names needs the table in the filter, and that is what turns a scalar into a
tree. The cost is that a rank is derived from configuration — reorder the priorities and records
written before the change carry their old ones. It decides only ties between concurrent writes,
and only until each such record is next written, so a reordering settles rather than persists.

An unmanaged operation reads through `storage.raw` and will see the field. That is the one leak,
and the readme names it.

### The storage capability

The clock is already here: `Storage.set` commits a transition by compare-and-swap on
`VERSION: entity.VERSION - 1`. Merging is the same comparison loosened from equality to order,
with one scalar to break its ties — so the storage owns the whole rule, atomically, and the
extension reduces every region it knows of to that scalar.

```ts
/**
 * Writes `record` as it stands — its VERSION, its timestamps and whatever else it carries —
 * where what it would replace precedes it: a lower `VERSION`, or the same `VERSION` written
 * at a lower priority. `false` where it does not: nothing is written, and that is not an
 * error. `priority` is the rank of whoever wrote the record, lower being higher.
 */
merge?(record: Record, priority: number): Promise<boolean>

/** Whether this storage merges. Its absence refuses a component of a converging context. */
readonly merges?: boolean
```

Core learns that records are ordered and that a scalar breaks ties. It learns of no region, no
table and no query. MongoDB:

```js
const result = await this.#collection.replaceOne(
  {
    _id: document._id,
    $or: [
      { VERSION: { $lt: record.VERSION } },
      { VERSION: record.VERSION, PRIORITY: { $gt: priority } }
    ]
  },
  { ...document, PRIORITY: priority },
  { upsert: true }
)

return result.matchedCount === 1 || result.upsertedCount === 1
```

**A number, not a boolean.** A boolean is exactly two regions. With three it cannot rank: split
`eu`, `us` and `ap` into two classes and a tie between the two that share a class resolves for
neither, so each keeps its own record until something writes that entity again. And a boolean
meaning "outranks this deployment" compares an incoming record against the wrong region whenever
the stored one was itself merged from a third — `ap` hearing `us` then `eu` would end on `eu`, and
hearing `eu` then `us` would end on `us`.

`upsert` covers the record this region has never seen. Where the filter does not match and the
document is there, MongoDB attempts the insert and answers `E11000` on `_id`, which is the
rejection — caught and returned as `false`, the idiom `retriable()` already uses. Verify that a
top-level `$or` in an upsert filter does not itself raise; if it does, fall back to `replaceOne`
without `upsert` followed by `insertOne` on `matchedCount === 0`.

A duplicate key on any other index means an incoming record cannot be stored at all: two regions
independently took the same unique value. Redelivery will not help, so it is logged as an error
and the message is acknowledged. Unique indexes other than `_id` are not safe under multi-region
writes, and the readme says so.

## What is refused

Convergence departs from how the runtime treats a missing dependency elsewhere. The outbox
degrades and says so — no Redis and the pump recovers nothing; no replica set and it publishes
inline. That is right for events, where a lost publication means a receiver misses something. It
is wrong for convergence, where a lost publication means two regions diverge permanently, with
nothing that detects it and nothing that repairs it.

**At deploy, an exception.** `deployment(instances, annotation)` throws where
`TOA_CONVERGENCE_REGION` is unset, and where it names a region the declaration does not carry. A
context that declares convergence cannot be deployed as a region it cannot name.

**At boot, an exception.** Whether the outbox is durable is a `hello` against the live database,
so it is not knowable at deploy. The storage decorator opens after the storage beneath it, reads
`storage.outbox`, and refuses where there is none, worded as the existing migrations refusal. A
storage without `merges` is refused in the same place.

**In the readme, a requirement.** Atomicity is the same hazard one step out: without it the pump
never recovers a failed publish and that row's change is lost for good. But `slots()` answering
null cannot be told from "not assigned yet", and an extension's `deployment` sees only its own
annotation, so there is no honest check at either end.

## Implementation

Each step stands on its own and is reviewed on its own. Only the last is convergence.

### 1. `toa-io/comq`, released first

comq asserts every exchange as `fanout` and binds with an empty key, and `publish` passes the
default routing key. Add an exchange type, a routing key on publish and a binding key on
subscribe, in `source/channel.js`, `source/io.js` and `types/`. Routed exchanges are a normal
thing for comq to have. Everything below depends on the version that carries it.

### 2. Destinations in the outbox

1. `runtime/core/source/types/outbox.ts` — `Destination`; `outstanding` on `Row`;
   `settle(ids, destination)`.
2. `runtime/core/source/outbox/outbox.ts` — destinations in place of the one emission; a set of
   published and publishing ids per destination and an `INFLIGHT` cap per destination; `#publish`
   fanning out over a row's outstanding destinations; `#mark` grouping ids by what completed.
3. `runtime/core/source/emission.ts` — `name = 'events'`.
4. `connectors/storages.mongodb/src/outbox.js` — `settle(ids, destination)` as one pipeline
   update; `outstanding` written on insert and read as `['events']` where absent. `pending()` and
   `index()` unchanged.
5. `runtime/core/source/types/extensions.ts` — `destination`.
6. `runtime/boot/src/component.js`, `outbox.js`, `extensions/destinations.js` — collect
   destinations from the manifest, count them toward the outbox flag, hand them to the outbox.
7. `documentation/outbox.md` — the row, what a destination is, that each settles on its own, and
   that one failing no longer republishes the others.

### 3. The transport and the merge

1. `runtime/core/source/types/bindings.ts` — `outbound`, `inbound`, `Outbound`, `Inbound`.
2. `runtime/core/source/types/extensions.ts` — the locator and manifest on `storage`;
   `Host.outbound`, `Host.inbound`.
3. `runtime/core/source/types/storages.ts` — `merge` and `merges` on `Storage`.
4. `runtime/boot/src/storage.js`, `extensions/storage.js` — forward the locator and the manifest.
5. `runtime/boot/src/bindings/outbound.js`, `inbound.js`, `index.js`, `host.js` — resolve the
   named binding, and say so where it implements neither.
6. `connectors/bindings.amqp/source/outbound.js` — publishes to `<channel>.out` with the label as
   the routing key, persistent and mandatory.
7. `connectors/bindings.amqp/source/inbound.js` — asserts queue `<channel>.<label>`, durable,
   binds it to `<channel>.in` under the label, consumes, calls `accept`. Over a `Communication` of
   its own, pooled under a convergence owner, so it shares no connection with the context's.
8. `connectors/bindings.amqp/source/queues.js`, `factory.js`, `index.js` — the three names,
   derived from the channel and the label and from nothing else. `uris.ts` is untouched: the
   broker set arrives as an argument.
9. `connectors/storages.mongodb/src/storage.js` — `merge()` and `get merges()`.

### 4. `@toa.io/extensions.convergence`

1. `extensions/convergence/package.json`, `source/index.ts` — `@toa.io/extensions.convergence`,
   `main: transpiled/index.js`, `files: [transpiled, readme.md]`.
2. `extensions/convergence/source/Factory.ts` — `destination` and `storage`, and nothing else.
3. `extensions/convergence/source/Destination.ts` — `emit(event)` →
   `send(locator.id, { record, region, trace })`.
4. `extensions/convergence/source/Storage.ts` — `Converging`: `PRIORITY` on write, off on read;
   the inbound; the merge; the refusals at boot.
5. `extensions/convergence/source/Regions.ts` — the table, the pointer it resolves, and the rank
   of a region a message names.
6. `extensions/convergence/readme.md` — what to declare, how it is deployed, what it guarantees,
   what it does not, that atomicity is required, and the federation to configure.
7. `definitions/source/extensions.convergence/` — `index.ts`, `deployment.ts` (the variables and
   the pointer), `const.ts`. No `manifest.ts`: no component declares it.
8. `definitions/source/definition.ts` — the name in `DEFINED`, and the package exports.
9. `definitions/schemas/extensions.convergence/{declaration,annotation}.yaml`.
10. `runtime/norm/src/shortcuts.js` — `convergence`, which is what makes it well known.
11. `runtime/norm/src/context.js` — the step that gives it to every stored component.
12. `docker-compose.yaml` and the port table in `CONTRIBUTING.md` — the two convergence brokers,
    federated to each other, in the `31xxx` block.

## Testing

### The outbox

A row outstanding for two destinations publishes to both in parallel. One rejecting leaves that
destination outstanding and settles the other. A row settles fully only when the last one lands. A
cycle where both landed marks them in one write. A destination whose publications never resolve
fills its own cap and does not stop the cycle.

`settle` per destination, and a row without `outstanding` read as `['events']`.

### The merge

`merge` accepts a lower version, accepts an equal one written at a higher priority, rejects an
equal one written at a lower priority and one written at the same, inserts where nothing is
stored, and answers `false` rather than throwing on a rejection.

### The extension

The rank of each region of a three-region table. The unknown-region refusal. That the storage
decorator lets no `PRIORITY` reach a record core is given.

### The binding

The exchange, queue and binding names, derived from the channel and the label. That the published
body is exactly the message it was handed.

### Gherkin

`features/events/outbox.feature` gains a scenario where one destination fails and the other's
events are not republished, seeded the way that suite already seeds a row.

A deployment scenario: under `TOA_CONVERGENCE_REGION=eu`, `toa export deployment production`
renders the four variables and the secret references for `eu` and for no other region, in the
shape `features/deployment/amqp.feature` already uses. With the variable unset, and with it naming
a region the declaration does not carry, the export fails and says which.

A refusal scenario: a converging context over the standalone MongoDB the suite already starts
(`31021`) does not boot, and says the outbox is not durable. Tagged `@containers`.

A convergence scenario: two regions are two compositions of the same component over two databases
of the compose replica set — the pointer names the database, so `31020` serves both, and both can
run transactions, which the standalone cannot. They need two convergence brokers with federation
between them, because a single broker would give both regions the same `convergence.out` and the
same `convergence.in` and each would be delivered its own writes, which the topology exists to
prevent; a scenario over one broker would test something no deployment does. Compose grows the
pair, with the federation plugin enabled and the upstreams and the policy in a definitions file,
the way `npm run setup:mongo` already prepares the replica set.

`us` writes and `eu` merges. The component declares no events, which is the point: convergence
does not depend on one existing, and the outbox exists because convergence asked for it. Then a
stale record changes nothing; the same record twice changes nothing; and both regions write at one
version and both end on the one the table outranks, whichever each hears first.

### General verification

`npm run features` in full — `features/events/outbox.feature` and `emission.feature` are what the
outbox change must not disturb — then `npm run typecheck` and `npm run lint`.

By hand: two compose stacks with federation between the convergence brokers, a write in one and a
read in the other; then stop a convergence broker, write, bring it back, and confirm the outbox
pump and the federation link deliver what was held, and that nothing internal was republished
meanwhile.

## Definition of done

A context declares its regions at its root and is deployed once per region, selected by
`TOA_CONVERGENCE_REGION`. Every component that stores anything publishes each committed record to
its region's convergence brokers through the outbox, over a transport that is a binding and knows
only a label and a message. Each region writes what the others send into its own database where
the record it replaces is older, ordered by `VERSION` and then by region priority, so every region
holds the same record whatever order it hears things in and however often. A convergence broker
that is down delays convergence and nothing else, and republishes none of the region's own events.
