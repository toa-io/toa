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

Convergence carries what happens after it is on. There is no bootstrap: seeding a new region is a
database copy, made before it serves.

It joins deployments of one context that began from one database rather than two that grew apart.
Not that joining two would break: identities are random, so their records are largely disjoint and
merging them is a union, and a rank is consulted only where two regions wrote one record at one
version, which is about as rare as two writes in one millisecond. What is absent is the guarantee.
The backfill attributes every record that predates convergence to rank `0`, and where two
deployments each hold one under the same id, nothing establishes whose history is whose.

A record is replaced entire. There is no field-level merge, and no mechanism that merges two
concurrent writes into one record.

Toa does not configure, assert or monitor the federation. Upstreams and policies are written by
whoever runs the brokers.

Only RabbitMQ implements the transport.

## Declaration

**The environment is which region a deployment is** — the same thing that already decides which
database and which broker it uses, because each region has its own of both and the `@`
discriminator is the only way to vary them. So a context declares one of these per region, at its
root and in no manifest, and they share nothing:

```yaml
# context.toa.yaml
mongodb@eu: mongodb://mongo.eu.example.com/store
mongodb@us: mongodb://mongo.us.example.com/store

convergence@eu:
  priority: 0 # a rank: 0 outranks 1
  binding:
    provider: amqp
    pointer: [amqp://rmq-eu-0, amqp://rmq-eu-1]

convergence@us:
  priority: 1
  binding: { provider: amqp, pointer: amqp://rmq-us }
```

```shell
$ toa deploy eu
```

Nothing is shared between them because nothing needs to be: a deployment stamps its own rank and
publishes to its own brokers, and a record says for itself which region wrote it, so no table
reaches the runtime and none is read after the deploy. An environment that declares no
`convergence` is not a region and converges nothing, so the same context still deploys to
`staging` as one place.

A second selector would have said the region twice — once as the environment, once as its own —
with nothing checking that the two agreed. Crossed, they would give a deployment that writes to
one region's database while stamping another's rank and publishing to its brokers: it would start,
look healthy, and resolve every tie the wrong way.

What is lost is that no deployment can check the ranks are distinct, because none sees another's
declaration. The runtime catches it instead: a record can only carry the rank of the region that
wrote it — a region is not bound to what it publishes and republishes nothing it merges — so one
arriving with this region's own rank means two share it, and that is reported as an error.

A context that declares convergence converges every component that stores anything. There is no
per-component opt-in and no opt-out, as the outbox has none; turning the outbox off for a
component is what turning convergence off would amount to anyway, and if that is ever wanted it is
one switch added to both at once.

`provider` names the binding. `pointer` is a [pointer](/libraries/pointer), so a URL carries no
credentials and shards syntax works — but it is flat, a URL or a list of them, and the schema
permits nothing else. The Pointer's nested keys select a URL per component or namespace, which is
meaningless here: a region has one set of brokers.

What the deploy renders, and all of it:

```
TOA_REGION                  0
TOA_CONVERGENCE_BINDING     @toa.io/bindings.amqp
TOA_CONVERGENCE_BROKERS     amqp://rmq-eu-0 amqp://rmq-eu-1
                            + _USERNAME / _PASSWORD secret references
```

`TOA_REGION` is the runtime's, and the only one of the three an application that does not converge
would ever have.

## The rule

A record carries the rank of the region that last wrote it, as the system property `REGION`. An
incoming record wins where

```
remote.VERSION > local.VERSION
or (remote.VERSION == local.VERSION and remote.REGION < local.REGION)
```

`VERSION` is already a Lamport clock in disguise. `Entity.#write` increments off whatever was
loaded, so a record written verbatim at `VERSION: 7` makes the next local write `8`, and nothing
has to be added for the counter to advance across regions.

Ranks come from the declaration and are the same in every region, so the ordering is total and
every region computes the same winner regardless of what it hears first. Two records can never
share both a version and a rank — a region writing twice increments `VERSION`, and the
compare-and-swap in `Storage.set` prevents two writes at one version — so the order has no ties
and there is no residual case.

**The rank is on the record because the tie is not about this deployment.** At an equal version
the question is whether the sender outranks *whoever wrote the record being replaced*, and after
any merge that is not this region. A deployment that only knew its own rank would compare the
wrong pair: with `eu`, `us` and `ap`, both `eu` and `us` outrank `ap`, so `ap` could not tell
their two concurrent writes apart and would keep whichever arrived second. The two questions
coincide only where there are two regions.

Both values are on the two records, so the comparison needs nothing else: no table at the point of
the write, and no argument to `converge`.

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
  /** the record as it stands — VERSION, timestamps, REGION and all */
  record: Record

  /** W3C traceparent, so the merge continues the trace of the write that caused it */
  trace?: string
}
```

The record says which region wrote it, so the message does not say it again.

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

  /** in */
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
under the component's label. The record already says which region wrote it, so the message says
nothing the record does not:

```
send(locator.id, { record: event.state, trace })
```

**In** is a storage decorator, and it decorates almost nothing. A record from another region is
written verbatim — its `VERSION`, its timestamps, its region — which is not an operation and not a
`State` commit, so it needs a `Storage`, and the decorator is one. It holds the storage by
construction, needs no lookup and no registry, is made and torn down with the component, and —
because a dependency closes after its dependant — the storage under it is still whole while a
delivery drains. Every method it delegates untouched.

```
Converging implements Storage, Inbound, depends(storage)
  open()            host.inbound(binding, 'convergence', uris, locator.id, this) → connect
  accept(message)   this.converge(message.record)
  close()           stop consuming; the storage under it closes after
  everything else   delegated
```

`accept` does nothing but merge: the record carries its own rank, so there is no table to consult
and nothing to refuse.

### `REGION`, a system property

`REGION` is the sixth thing the runtime writes into every record, beside `id`, `VERSION`,
`CREATED`, `UPDATED` and `DELETED`. It holds the **rank** of the region that wrote it, an integer
where lower outranks, declared by `@toa.io/prototype` and written by `Entity.#write` wherever
`UPDATED` is, from `TOA_REGION`. Where that is unset it is `0`, which is what every record of
every application that does not converge holds.

This is a change to the runtime rather than to the extension, and deliberately so. The alternative
was for the extension to add the field on the way into the storage and strip it on the way out, on
every read and every write path, so that the entity contract never saw it. That is a decorator
that rewrites the shape of a document in both directions, and it has to be exhaustive to be
correct. A system property is declared once and written where the others are.

**The first region is rank `0`, and that is a constraint the documentation states.** An
application that converges was an application before it did, and its data was written by whatever
region it is now becoming. Making that region the highest-ranked is what lets the migration below
be true rather than merely harmless, and it means the incumbent wins a tie by default.

1. `runtime/prototype/manifest.toa.yaml` — `REGION: { type: integer, minimum: 0 }`.
2. `runtime/prototype/migrations/0002-region.yaml` — `$set: { REGION: 0 }` over records that lack
   it, recorded as `system:0002-region`, in the style of the two before it.
3. `runtime/core/source/entities/entity.ts` — the stamp.
4. `runtime/norm/src/.component/collapse.js` — `REGION` in `SYSTEM`, so a component that declares
   one is refused with `System property 'REGION' cannot be overridden`.
5. `runtime/norm/src/.component/schema.yaml` — `REGION` in the names a `blank` may not carry.
6. `runtime/core/source/query/options.ts` — `REGION` in what a projection always includes, so the
   record the runtime hands back is whole, as it is for the other four.
7. `runtime/core/source/types/storages.ts` and `runtime/prototype/types/toa.d.ts` — the type.
8. `documentation/component/declaration.md` and a `migrations/<release>.md` note — six system
   properties rather than five, the rank-`0` constraint, and that a component declaring a `REGION`
   property stops building.

The migration is safe wherever it runs: it writes a constant, and `Migrations` records it as
`<collection>:<id>` in a state collection of the database it ran against, so a region seeded from
a snapshot never re-applies it and one started empty applies it to an empty collection.

**And `merge` reads a missing `REGION` as the first region anyway.** Not because the migration is
in doubt, but because the failure without it is silent and permanent: `$gt` matches no document
that lacks the field, so a record that reached a converging deployment without one — a database
restored from before this, a migrations record removed by hand — would lose no tie, and would beat
every equal-version write from anywhere. Two operators of one field against that is worth it.

An application that never converges pays a `0` on every record and the one backfill.

### The storage capability

The clock is already here: `Storage.set` commits a transition by compare-and-swap on
`VERSION: entity.VERSION - 1`. Merging is that comparison loosened from equality to order, with
the rank to break its ties — so the storage owns the whole rule, atomically, in one write.

Both values it compares are on the two records, so it takes nothing else:

```ts
/**
 * Writes `record` as it stands — its VERSION, its timestamps, its REGION and whatever else it
 * carries — where what it would replace precedes it: a lower `VERSION`, or the same `VERSION`
 * written by a region this one outranks. `false` where it does not: nothing is written, and
 * that is not an error.
 */
converge?(record: Record): Promise<boolean>

/** Whether this storage converges. Its absence stands a component of a converging context down. */
readonly converges?: boolean
```

Core learns that a record carries the rank of whoever wrote it and that lower outranks. It learns
of no region name, no table and no query.

The filter selects by `_id` alone, so it always matches what is there and upserts what is not.
The rule is the pipeline, which either replaces the document or keeps it:

```js
const result = await this.#collection.updateOne(
  { _id: document._id },
  [
    {
      $replaceWith: {
        $cond: [
          {
            $or: [
              // nothing stored under this id reads as `0`, the version an entity
              // holds before its first write
              { $lt: [{ $ifNull: ['$VERSION', 0] }, document.VERSION] },
              {
                $and: [
                  { $eq: ['$VERSION', document.VERSION] },
                  { $gt: ['$REGION', document.REGION] }
                ]
              }
            ]
          },
          { $literal: document },
          '$$ROOT'
        ]
      }
    }
  ],
  { upsert: true }
)

return result.upsertedCount === 1 || result.modifiedCount === 1
```

**No index is added, here or anywhere.** The filter is `_id`, which is the one index a collection
always has, and `REGION` is never selected on alone — it is read as part of a document already
found by its id. The outbox is the same: `published` was left meaning "settled everywhere" rather
than replaced by `outstanding`, so a row outstanding for any destination still carries
`published: false` and the partial `outbox_pending` still holds exactly what the pump reads, while
`publishedAt` is still written only when the last destination lands and the TTL is untouched.

**Absent and stale are different answers, not the same one twice.** A record this region has never
seen is an upsert; a record it has already superseded leaves `$$ROOT` in place, changes nothing,
and comes back as `modifiedCount: 0`. Neither raises. The obvious spelling — `replaceOne` with the
rule in the filter and `upsert: true` — cannot tell them apart: no match means either, and the
upsert then attempts an insert that collides on `_id`, so the ordinary case of a duplicate or an
out-of-order delivery is reported by an `E11000` and pays for a failed insert to say nothing
happened. It would also put `$or` in an upsert filter, where it contributes nothing to the
document that would be inserted.

**Absence has to be covered, and it is `$ifNull` that covers it.** On the upsert path the pipeline
runs over the base document the filter builds, which is `{ _id }` and nothing else, so `$VERSION`
is missing there. Were that branch ever false the update would not decline — it would insert
`$$ROOT`, a stub holding an `_id` and no properties at all, which every later read then fails the
entity contract on. `$ifNull` answers for a missing field as well as a null one, and `VERSION` is
never null: the prototype declares it `{ type: integer, minimum: 0 }`, every write of it is `0` at
compose, `++`, `$inc` or `origin.VERSION + 1`, and `Changeset.set` deletes it so that userland
cannot write one. `0` is not a sentinel chosen for the query — it is what `Entity` composes a
blank with, and the first write makes it `1`.

`$literal` is not decoration either: a value in a pipeline is an expression, so a record whose
property happens to hold a string beginning with `$` would otherwise be read as a field path.

The record is written exactly as it arrived, `REGION` included — which is why nothing has to be
added to it here, and why the rank of whoever wrote it survives every hop. A document that lacks
`REGION` altogether fails `$gt` and so wins every tie, which is the hazard the migration closes.

**Stored, not computed.** What decides a tie is who wrote the record being replaced, so it has to
be on that record. A flag or a rank computed from the sender and this deployment cannot do it:
with `eu`, `us` and `ap`, both `eu` and `us` outrank `ap`, so `ap` would compute the same answer
for their two concurrent writes and keep whichever arrived second — ending on `us` where `eu` and
`us` both end on `eu`. Two regions is the case where computing it works, because there "not me"
names the writer uniquely.

A duplicate key still means something, on any index but `_id`: two regions independently took the
same unique value. Redelivery will not help, so it is logged as an error
and the message is acknowledged. Unique indexes other than `_id` are not safe under multi-region
writes, and the readme says so.

## Telemetry

Toa has no metrics API — `extensions.telemetry` is logs and traces — and `observability/tempo.yaml`
runs Tempo's `metrics_generator`, which derives service graphs and span metrics from spans and
remote-writes them to Prometheus. Spans are the instrument, so convergence is observable only to
the extent that it emits them.

`send` opens a producer span and `accept` the `deliver`/`process` pair that
`connectors/bindings.amqp/source/receiver.js` already opens for an event, with
`messaging.destination.name` on both — `tempo.yaml` lists that attribute under `peer_attributes`,
so the two pair into a service-graph edge between the regions, and Prometheus gets its request
rate, its error rate and each side's duration. That is the signal to alert on: whether convergence
is flowing, and whether it is failing.

The merge span carries the region the record came from, the outcome — `inserted`, `superseded` or
`stale` — and the lag in milliseconds. The outcome matters because there is no counter to
increment: without it, convergence healthily dropping duplicates and convergence dropping
everything because the ranks are misconfigured look exactly alike.

`trace` on the message is what joins the two halves. Sampling is decided at the trace root and
propagated, so a recorded write's merge is recorded with it and there are no orphaned halves; and
an unrecorded trace still propagates its context, so **every** log line of the merge carries the
`trace_id` of the write that caused it, at any sample rate. That is the one to reach for first: a
single id leads from a record that surprised someone to the request in another region that wrote
it.

Two things it does not give.

**Convergence lag is not a series.** Tempo's edge histograms are built from each span's own
duration, not from the gap between the producer ending in one region and the consumer starting in
another, which is what the lag is. It is visible in a trace and as an attribute in TraceQL, and
alerting on it would need a metrics facility that does not exist here.

**And no cross-host duration is better than the clocks.** The runtime already treats skew as an
operational hazard in the outbox, in cadence and in atomicity. A lag of hundreds of milliseconds
read against a skew of a few is worth reading; nothing precise should be built on it.

One deployment condition follows: the regions export to one trace store, or to ones that
federate. Two independent backends give two halves of every trace that never join.

## What is refused

Convergence departs from how the runtime treats a missing dependency elsewhere. The outbox
degrades and says so — no Redis and the pump recovers nothing; no replica set and it publishes
inline. That is right for events, where a lost publication means a receiver misses something. It
is wrong for convergence, where a lost publication means two regions diverge permanently, with
nothing that detects it and nothing that repairs it.

**At deploy, an exception.** `deployment(instances, annotation)` throws where the region declares
no rank or no brokers. An environment that declares no convergence at all is not a region, which
is not an error: the same context deploys to `staging` as one place.

**At boot, an exception.** Whether the outbox is durable is a `hello` against the live database,
so it is not knowable at deploy. The storage decorator opens after the storage beneath it, reads
`storage.outbox`, and refuses where there is none, worded as the existing migrations refusal. A
storage without `merges` is refused in the same place.

**In the readme, a requirement.** Atomicity is the same hazard one step out: without it the pump
never recovers a failed publish and that row's change is lost for good. But `slots()` answering
null cannot be told from "not assigned yet", and an extension's `deployment` sees only its own
annotation, so there is no honest check at either end.

## Implementation

Each step stands on its own and is reviewed on its own. Only the last is the extension; the one
before it is a change to the runtime that an application which never converges also carries.

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

### 3. The transport

1. `runtime/core/source/types/bindings.ts` — `outbound`, `inbound`, `Outbound`, `Inbound`.
2. `runtime/core/source/types/extensions.ts` — the locator and manifest on `storage`;
   `Host.outbound`, `Host.inbound`.
3. `runtime/boot/src/storage.js`, `extensions/storage.js` — forward the locator and the manifest.
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
9. `runtime/core/source/types/storages.ts` — `merge` and `merges` on `Storage`.

### 4. `REGION`, a system property

1. `runtime/prototype/manifest.toa.yaml` — `REGION: { type: integer, minimum: 0 }`.
2. `runtime/prototype/migrations/0002-region.yaml` — `$set: { REGION: 0 }` over records that lack
   it.
3. `runtime/core/source/entities/entity.ts` — stamped where `UPDATED` is, from `TOA_REGION`, `0`
   where that is unset.
4. `runtime/norm/src/.component/collapse.js` — `REGION` in `SYSTEM`.
5. `runtime/norm/src/.component/schema.yaml` — `REGION` in what a `blank` may not name.
6. `runtime/core/source/query/options.ts` — `REGION` in what a projection always includes.
7. `runtime/core/source/types/storages.ts`, `runtime/prototype/types/toa.d.ts` — the type.
8. `connectors/storages.mongodb/src/storage.js` — `merge()` and `get merges()`, which belong here
   rather than with the transport now that the rule is two properties of a record.
9. `documentation/component/declaration.md` — six system properties rather than five, and the
   rank-`0` constraint on the region an existing deployment becomes.
10. `migrations/<release>.md` — a component that declares a `REGION` property stops building.

### 5. `@toa.io/extensions.convergence`

1. `extensions/convergence/package.json`, `source/index.ts` — `@toa.io/extensions.convergence`,
   `main: transpiled/index.js`, `files: [transpiled, readme.md]`.
2. `extensions/convergence/source/Factory.ts` — `destination` and `storage`, and nothing else.
3. `extensions/convergence/source/Destination.ts` — `emit(event)` →
   `send(locator.id, { record, trace })`.
4. `extensions/convergence/source/Storage.ts` — `Converging`: the inbound, the merge, and the
   refusals at boot. Every storage method delegated untouched.
5. `extensions/convergence/readme.md` — what to declare, how it is deployed, what it guarantees,
   what it does not, that atomicity is required, and the federation to configure.
6. `definitions/source/extensions.convergence/` — `index.ts`, `deployment.ts` (the table read
   here and nowhere else: the region named becomes `TOA_REGION`, its pointer becomes the rest),
   `const.ts`. No `manifest.ts`: no component declares it.
7. `definitions/source/definition.ts` — the name in `DEFINED`, and the package exports.
8. `definitions/schemas/extensions.convergence/{declaration,annotation}.yaml`.
9. `runtime/norm/src/shortcuts.js` — `convergence`, which is what makes it well known.
10. `runtime/norm/src/context.js` — the step that gives it to every stored component.
11. `docker-compose.yaml` and the port table in `CONTRIBUTING.md` — the two convergence brokers,
    federated to each other, in the `31xxx` block.

## Testing

### The outbox

A row outstanding for two destinations publishes to both in parallel. One rejecting leaves that
destination outstanding and settles the other. A row settles fully only when the last one lands. A
cycle where both landed marks them in one write. A destination whose publications never resolve
fills its own cap and does not stop the cycle.

`settle` per destination, and a row without `outstanding` read as `['events']`.

### The merge

`merge` inserts where nothing is stored under that id, accepts a lower version, accepts an equal
one written by a region it outranks, and leaves the stored record untouched for an equal version
written by a region that outranks it, for one written by the same region, and for a higher stored
version — answering `false` each time, and raising on none of them. A record that lacks `REGION`
loses no tie, which is what the migration is there to prevent.

### The extension

That the deploy renders the rank and the brokers of the region it is, and refuses a declaration
with no rank or no brokers. That a record arriving with this region's own rank is reported.

### The binding

The exchange, queue and binding names, derived from the channel and the label. That the published
body is exactly the message it was handed.

### Gherkin

`features/events/outbox.feature` gains a scenario where one destination fails and the other's
events are not republished, seeded the way that suite already seeds a row.

A deployment scenario: `toa export deployment eu` renders the rank and the brokers of `eu` and of
no other region, in the shape `features/deployment/amqp.feature` already uses; the same context
exported for `us` renders that region's; and one exported for an environment that declares no
convergence renders none of it.

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

A context declares its regions at its root, one per environment, and is deployed once per
region. Every component that stores anything publishes each committed record to
its region's convergence brokers through the outbox, over a transport that is a binding and knows
only a label and a message. Each region writes what the others send into its own database where
the record it replaces is older, ordered by `VERSION` and then by the rank the record itself
carries, so every region holds the same record whatever order it hears things in and however
often. A convergence broker
that is down delays convergence and nothing else, and republishes none of the region's own events.
