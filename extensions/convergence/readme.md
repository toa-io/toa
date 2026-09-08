# Toa Convergence

Two or more deployments of one context, each with its own database, converging on the same
entity state.

## Declaration

A region is a deployment of the context, not a variant of it: one context declares every region
there is, at its root.

```yaml
# context.toa.yaml
convergence:
  - region: eu
    priority: 0 # a rank: 0 outranks 1
    binding:
      provider: amqp
      pointer: [amqp://cnv-eu-0.example.com, amqp://cnv-eu-1.example.com]
  - region: us
    priority: 1
    binding: { provider: amqp, pointer: amqp://cnv-us.example.com }
```

Nothing is declared in a manifest. A context that declares convergence converges **every
component that stores anything**, as the outbox publishes every event something consumes.

`pointer` is a [pointer](/libraries/pointer), so a URL carries no credentials — they are
deployed as secrets — and shards syntax works. It is flat: a URL or a list of them. A region has
one set of brokers, and they are that region's own, shared with nothing else.

## Deploying

Which region a deployment is, is chosen when it is deployed:

```shell
$ TOA_CONVERGENCE_REGION=eu toa deploy production
```

An operator can write it in `.env` instead of prefixing every command. Without it, a context
that declares convergence is refused rather than deployed as a region it cannot name.

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
publication that fails is never retried and that change is lost for good. Nothing detects this,
which is why it is written here rather than raised.

**The same components in every region.** A component deployed in one and not another has no
queue there, so its records cannot be routed; publishing is `mandatory`, so what had nowhere to
go is logged rather than dropped in silence.

**Unique indexes other than `_id` are not safe.** Two regions can independently take the same
value, and the record that arrives second cannot be stored at all. It is logged and dropped;
redelivery would not help.

## What a record carries

[`REGION`](/documentation/component/declaration.md#entity) is which region wrote a record, as
that region's rank. An incoming record wins where its version is greater, or where the version
is equal and the region that wrote it outranks the one that wrote what is stored. `priority` is
read there and nowhere else.

An unmanaged operation reads the driver's own handle, and will see the field.
