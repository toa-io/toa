# Service discovery

## TL;DR

A component is never told what another one provides. It asks, and a process is started with a map
that says which version of each component it asks:

```shell
$ toa map                      # writes components.json beside the context
$ toa compose ./components/*   # finds it, the way it finds .env
```

## What is asked, and when

A call is addressed by name — `<namespace>.<component>.<endpoint>` — so nothing is discovered to
reach one. What is discovered is what a component declares:

| what                                  | when                              | what is read        |
| ------------------------------------- | --------------------------------- | ------------------- |
| the component you call                | the first call to it, per process | its operations      |
| the component whose event you receive | boot                              | the event's binding |

Neither is declared, and a component's own manifest is never asked for: `context.local` and a
receiver's target are read from what the process already has.

A component in the same [composition](/documentation/compositions.md) is asked in memory, and so is
called in memory. Nothing of either reaches the broker.

A component is asked **once per process**, at the first call to it, and what it answered is held
for as long as the process runs. So a caller keeps the contract of the version it first met, which
is what its own code was written against — see [while two versions serve](#while-two-versions-serve)
for what that obliges.

## The map

`toa map` reads the context and writes every component of it with the version it runs:

```json
{
  "default.orders": "3f9a1c02",
  "default.billing": "b7e4d510"
}
```

A version is the component's content hash — the same one its image is tagged with — so it changes
when its sources change and not otherwise.

The map is found the way `.env` is: walked up to from where the command runs, or named.

```shell
$ toa compose ./components/* --env application/.env --map application/components.json
```

`toa compose`, `toa serve` and `toa mono` are refused where a Context is there and its map is not:
a process with no map asks whichever replica of a component answers first, and during a deployment
that is not necessarily the one it is meant to talk to. A component run outside a Context has no
peers a map could name, and needs none.

Every component of the context is in it, including one it
[evicts](/documentation/compositions.md#evicted) — an evicted component is called like any other, so
it is looked up like any other. **Deploy one from the sources the context was deployed from**, or
what calls it waits, naming the version it waits for.

`toa deploy` writes the map it deploys. Everywhere else, **run `toa map` again when a component's
sources change** — a map naming a version nothing runs is a lookup that waits.

## While two versions serve

Two versions of a component serve at once for as long as a deployment takes to replace it, and both
take calls from the same queues. Only replicas of the version the map names answer a lookup, so
what a process reads is the contract its deployment intends rather than whichever replica took the
message.

A component whose sources did not change keeps its version, so a process of a new release asks the
replicas already running and is answered by them. Nothing has to be deployed in an order.

The gateway reads the contract of the version that announced the route it matched, so a request it
forwards is described by the same version that offered it the route.

A call is not routed by version: it goes to the endpoint's queue, which every version serves, so
one two versions both declare is served by either. The caller validates against the contract it
read and the callee does not validate again, so **an endpoint's input schema is yours to keep
compatible while two versions of it serve** — the same rule a deployment holds you to for the
State. An endpoint or an event only the newer version declares is not affected: the older one
serves neither.

## When a lookup waits

A lookup has no deadline. It waits on its queue until the version it asks for answers, and says
what it is waiting for every five seconds:

```
Waiting for lookup response { component: 'default.billing', version: 'b7e4d510', waiting: 35 }
```

It ends by itself when that version comes up — there is no retry and no attempt limit. A process
waiting on one is a process that is not ready, which is what its readiness probe reports.

Three things it can be: the component is starting, the map names a version nothing runs, or the
component was never deployed.

## Declaring the binding instead

A receiver that states its binding asks nothing at boot:

```yaml
# manifest.toa.yaml
receivers:
  external.orders.created:
    binding: amqp
    operation: transit
```

A [foreign event source](/documentation/component/declaration.md#event-sources) requires this: it is
not a component of the context, so there is nothing to ask.

## The broker

A lookup queue is named after the version it serves, so each version of each component leaves one
behind when it is retired — empty, with no consumer and no publisher.

Set an [`expires` policy](https://www.rabbitmq.com/docs/parameters#policies) over the lookup queues
to clear them. Give it a TTL well above how long a deployment takes: a queue that expires takes
whatever is waiting in it, and what waits in this one is a process that has not started yet.
