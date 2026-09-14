# Service discovery

## TL;DR

A component is never told what another one provides. It asks, and what it asks for is the version
a map names:

```shell
$ toa map                      # writes .map.json beside the context
$ toa compose ./components/*   # finds it, the way it finds .env
```

Without a map, nothing starts.

## What is asked, and when

A call is addressed by name — `<namespace>.<component>.<endpoint>` — so nothing is discovered to
reach one. What is discovered is what a component declares:

| what                        | when                              | what is read       |
| --------------------------- | --------------------------------- | ------------------ |
| the component you call       | the first call to it, per process | its operations     |
| the component whose event you receive | boot                    | the event's binding |

Neither is declared, and a component's own manifest is never asked for: `context.local` and a
receiver's target are read from what the process already has.

## The map

`toa map` reads the context and writes every component of it with the version it is running:

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
$ toa compose ./components/* --env application/.env --map application/.map.json
```

`toa compose`, `toa serve` and `toa mono` are refused where neither finds one, because an unmapped
process asks whichever replica answers first.

A component the context [evicts](/documentation/compositions.md#evicted) is left out: this context
does not decide what version of it is running, so a lookup of one is answered by whatever is.

`toa deploy` writes the map it deploys. Everywhere else, **run `toa map` again when a component's
sources change** — a map naming a version nothing runs is a lookup that waits.

## What the version buys

Two versions of a component serve at once for as long as a rolling update takes, and both consume
the same endpoint queues. Only replicas of the version the map names answer a lookup, so a process
that starts during a rollout reads the contract its deployment intends rather than whichever
replica took the message.

A component whose sources did not change keeps its version, so a process of a new release asks the
replicas already running and is answered by them. Nothing has to be deployed in an order.

## What a wait means

A lookup has no deadline. It waits on its queue until the version it asks for answers, and says
what it is waiting for every five seconds:

```
Waiting for lookup response { component: 'default.billing', version: 'b7e4d510', waiting: 35 }
```

It ends by itself when that version comes up — there is no retry and no attempt limit. A process
waiting on one is a process that is not ready, which is what its readiness probe reports.

Three things it can be: the component is starting, the map names a version nothing runs, or the
component was never deployed.

## What it does not promise

**That a call reaches the version whose contract you read.** A call goes to the endpoint's queue,
which every version serves, so an endpoint two versions both declare is served by either. The
caller validates against the contract it discovered and the callee does not validate again, so
**an endpoint's input schema is yours to keep compatible while two versions serve** — the same
rule a rolling update holds you to for the State.

An endpoint or an event that only the new version declares is not affected: the old one serves
neither, and nothing routes to it.

## Avoiding it

A receiver states the binding, and then nothing is asked for at boot:

```yaml
# manifest.toa.yaml
receivers:
  external.orders.created:
    binding: amqp
    operation: transit
```

A [foreign event source](/documentation/component/declaration.md#event-sources) requires this: it
is not a component of the context, so there is nothing to ask.

## The broker

A lookup queue is named after the version it serves, so each version of each component leaves one
behind when it is retired — empty, with no consumer and no publisher.

Set an [`expires` policy](https://www.rabbitmq.com/docs/parameters#policies) over the lookup queues
to clear them. Give it a TTL well above how long a deployment takes: a queue that expires takes
whatever is waiting in it, and what waits in this one is a process that has not started yet.
