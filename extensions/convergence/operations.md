# Adding a region

An application runs in one region and is to run in two. The order below is what keeps a change
from falling between the copy and the second region starting, and every step of it says what it
is for.

Read [the readme](./readme.md) first: this assumes the topology it describes, and calls the
region that exists `region0` and the one being added `region1`.

## Before anything

**`region0` must be on a replica set, with [atomicity](/connectors/atomicity) configured.** A
component that converges does not start where the outbox is not durable, so turning convergence
on for an application that is not on one takes it down rather than degrading. And without
atomicity the outbox pump recovers nothing, so a publication that fails is lost with no sign of
it.

**Pick `region1`'s rank.** `region0` is `0`, and every region's rank is distinct — two of one
rank cannot be told apart where they write the same version of a record, and nothing at deploy
can see that, because a deployment reads only its own declaration. What notices is the runtime:
a record carrying this region's own rank is reported as an error.

## 1. Stand up `region1`'s infrastructure

Its database, its context broker, its convergence broker. Nothing is deployed onto it yet.

## 2. Federate the convergence brokers, both ways

Each region publishes to its own `convergence.out` and consumes its own `convergence.in`, and
`convergence.in` is fed from the **other** region's `convergence.out`. Nothing binds to a
region's own `convergence.out`, which is why a region is never delivered its own writes.

On `region1`'s broker:

```shell
$ rabbitmqctl set_parameter federation-upstream region0 \
    '{"uri":"amqp://cnv-region0.example.com","exchange":"convergence.out","max-hops":1}'

$ rabbitmqctl set_policy convergence '^convergence\.in$' \
    '{"federation-upstream-set":"all"}' --apply-to exchanges
```

And the mirror of it on `region0`'s, with an upstream named `region1` pointing at
`amqp://cnv-region1.example.com`.

`region0`'s link has nothing to pull yet, and will log that what it federates from does not
exist until step 3 declares it. That is expected.

## 3. Declare `region1`'s queues, before anything is copied

**This is the step that makes the rest safe, and it is easy to miss.** Federation propagates a
downstream queue's bindings up to the upstream, so a region pulls only what it has somewhere to
put. Until `region1` has a queue bound, `region0`'s writes are routed nowhere: they are not held
for later, they are dropped, and `region0` logs each one as returned.

So the queues are declared before the copy is taken, and they are what holds everything written
from that moment on.

Which queues those are — one per component of the context that converges, plus the two
exchanges they hang off — is what `toa export convergence` answers, read from the context
itself:

```shell
$ toa export convergence region1 \
    | curl -u <user>:<password> -H 'content-type: application/json' \
           -X POST --data @- http://<region1-broker>:15672/api/definitions
```

The import adds and removes nothing, so it is safe against a broker that already carries some of
what it declares, and safe to run twice. Where the management API is out of reach,
`--format=commands` prints `rabbitmqadmin` invocations to run instead.

Nothing it declares is settable, and that is deliberate: the application asserts the same queues
when it starts, and one that exists with other arguments makes that assertion fail.

Check that the link picked them up. On `region0`'s broker there is now an internal queue per
component, filling:

```shell
$ rabbitmqctl list_queues name messages | grep federation
```

## 4. Copy the data, strictly after (3)

A dump of `region0`'s database, restored into `region1`'s. Take it however you like; what
matters is that it is taken **after** the queues exist.

Everything written in `region0` from step 3 onwards is in `region1`'s queues, so the copy and the
queue overlap. That overlap is the point: a change made while the dump was being taken is in the
queue whether or not it made it into the dump.

Carry the migrations record with it — it is a collection of the database like any other, and a
region restored from a dump must not re-apply what has already been applied.

## 5. Deploy `region1`, strictly after (3) and (4)

```shell
$ toa deploy region1
```

It asserts the queues that already exist, drains what is in them, and starts publishing its own
writes to its own `convergence.out`, which `region0` has been federating since step 2.

The drain re-applies changes the dump already contains. That costs nothing: a record whose
version is not greater is not written, so what the dump already had is dropped and only what
happened after it lands.

## Why this order

Nothing is lost only because the queues exist before the copy is taken. Reverse those two, and
everything written between the dump and the queues appearing is dropped rather than held —
`region1` holds the stale record, no message will ever bring the new one, and nothing converges
it until something writes that entity again, which may be never.

The same reasoning is why the copy is taken after step 3 rather than before it, and why deploying
`region1` last costs nothing but a duplicate drain.

## Watch for

**The queue's depth between steps 3 and 5.** It holds every write of every converging component
for as long as the gap lasts. A long gap on a busy application is a queue that grows without
anything reading it.

**`region0` returning messages.** A `mandatory` publication that reaches no queue is returned and
logged. Before step 3 that is every message; after it, one means a component has no queue on the
far side — a component deployed in one region and not the other.

**A record of this region's own rank.** Reported as an error, and it means two regions were given
one rank. Fix the declaration and redeploy; records already written with the wrong rank keep it
until they are next written.

## Adding a converging component

A component added to a context that already runs in several regions has the same problem in
miniature. It is deployed to one region before the others, and until a region has a queue bound
for it, what the regions ahead write for that component is routed nowhere and dropped. There is
no dump to cover it here, and nothing converges those records until something writes them again.

So declare its queue on every region's broker first, from a checkout that has the component, and
deploy after:

```shell
$ toa export convergence region0 | curl ... region0's broker
$ toa export convergence region1 | curl ... region1's broker
```

The export names the same components whichever region it is asked for — a context converges the
same set everywhere — and the import is additive, so a region that already carries the rest of
its queues is left as it was.

## Removing a region

Stop deploying to it, delete its federation upstreams on every other region's broker, and delete
its queues. A queue left bound goes on filling with nothing to read it.
