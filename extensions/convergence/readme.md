# Toa Convergence

Two or more deployments of one context, each with its own database, converging on the same
entity state.

## Declaration

A region is a deployment of the context, and **the environment is which region it is** — the
same thing that already decides which database and which broker it uses. So a context declares
one of these per region, and they share nothing:

```yaml
# context.toa.yaml
mongodb@eu: mongodb://mongo.eu.example.com/store
mongodb@us: mongodb://mongo.us.example.com/store

convergence@eu:
  priority: 0 # a rank: 0 outranks 1
  binding:
    provider: amqp
    pointer: [amqp://cnv-eu-0.example.com, amqp://cnv-eu-1.example.com]

convergence@us:
  priority: 1
  binding: { provider: amqp, pointer: amqp://cnv-us.example.com }
```

```shell
$ toa deploy eu
```

An environment that declares no `convergence` is not a region and converges nothing, so the
same context still deploys to `staging` as one place.

Nothing is declared in a manifest. A context that declares convergence converges **every
component that stores anything** — its own, and the ones its extensions ship: identity is what
holds users, their roles and the keys their tokens are read with, and a region without them is
one where nobody registered elsewhere exists.

**A storage that does not converge stands the component down, and says so at boot.** Nothing
else about the component changes and nothing else is held back; it is one line in the log,
because a component quietly not converging is two regions differing with nothing to notice it.

`pointer` is a [pointer](/libraries/pointer), so a URL carries no credentials — they are
deployed as secrets — and shards syntax works. It is flat: a URL or a list of them. A region has
one set of brokers, and they are that region's own, shared with nothing else.

**`priority` is the same table in every region, and nothing checks that.** A deployment reads
only its own declaration, so two regions given one rank is a misconfiguration no deploy can see:
ties between those two would resolve for neither. What notices is the runtime — a record can
only carry the rank of the region that wrote it, so one arriving with this region's own rank is
reported as an error.

**The region an existing application is first deployed as is rank `0`.** Its records were
written by whatever region it is now becoming, and that is what they are recorded as.

## The brokers

Convergence has its own brokers, one set per region. The context binding carries what happens
inside a region; these carry what crosses between them, and RabbitMQ federation is a thing to
keep away from the brokers an application depends on to serve a request.

Each region's broker holds two exchanges, the same two names everywhere:

| | |
| --- | --- |
| `convergence.out` | what this deployment publishes to. Nothing local binds to it, so a region is never delivered its own writes. |
| `convergence.in` | **federated** from every other region's `convergence.out`. |
| `convergence.<namespace>.<name>` | a durable queue per component, bound to `convergence.in` under that component's key. |

Nothing declares those queues for a region that is not running yet, which is what makes adding
one an order that matters, and adding a converging component to a running pair the same:
`toa export convergence <environment>` prints what a region's broker must carry, and
[operations](./operations.md) says when to declare it.

**Toa does not configure the federation.** On each region's broker, an upstream per other region
and one policy over them:

```shell
$ rabbitmqctl set_parameter federation-upstream us \
    '{"uri":"amqp://cnv-us.example.com","exchange":"convergence.out","max-hops":1}'

$ rabbitmqctl set_policy convergence '^convergence\.in$' \
    '{"federation-upstream-set":"all"}' --apply-to exchanges
```

Two exchanges and one link per other region, whatever the number of components. Federation
propagates a queue's binding keys upstream, so a region pulls only records for the components it
runs.

## What it guarantees

**Convergence.** Every region ends with the same record, whatever order records arrive in and
however often they repeat.

**Whole records.** A record is replaced entire. Two regions writing the same entity at the same
time lose one of the two writes completely; there is no field-level merge.

**Latency, not atomicity.** A read in one region may be behind another by the federation link.
Nothing is transactional across regions.

**One failure does not become the other's.** A convergence broker that is down delays
convergence and nothing else: the region's own events are unaffected, and neither is republished
because of the other.

**Changes only.** Convergence carries what happens after it is on. Seeding a new region is a
database copy, made before it serves.

## What it requires

**A replica set.** A component that converges does not start where the outbox is not durable —
where a change that failed to publish would be lost rather than recovered, and the regions would
differ with nothing to say so. Events degrade there; convergence refuses.

**[Atomicity](/connectors/atomicity).** Without it the outbox pump recovers nothing, so a
publication that fails is never retried and that change is lost for good. Nothing can refuse at
boot over it — a replica owns no lane for a moment anyway — so what happens instead is that the
pump says so, every ten cycles it has owned none.

**Which delayed calls a region makes is `cadence.regions`,** not something held back from
convergence: every region holds every region's rows, and each makes the calls of the region it
is. See [cadence](/extensions/cadence#regions).

**The same components in every region.** A component deployed in one and not another has no
queue there, so its records cannot be routed; publishing is `mandatory`, so what had nowhere to
go is logged rather than dropped in silence.

**Uniqueness over anything but `id` is not safe.** Two regions can independently take the same
value, and the record that arrives second cannot be stored at all. It is logged and dropped;
redelivery would not help.

## What a record carries

[`REGION`](/documentation/component/declaration.md#entity) is which region wrote a record, as
that region's rank. An incoming record wins where its version is greater, or where the version
is equal and the region that wrote it outranks the one that wrote what is stored. `priority` is
read there and nowhere else.

**`context.region` is that rank**, which is what a component reads to tell where it is running.
It is zero where an application is deployed as one place, which is what such a deployment's
records carry.

An unmanaged operation reads the driver's own handle, and will see the field.
