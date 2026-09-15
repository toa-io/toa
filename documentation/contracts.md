# Contracts

## TL;DR

A component is given what another one provides, rather than asking for it. A process is started
with a map that holds the contract of every component of the context:

```shell
$ toa map                      # writes components.json beside the context
$ toa compose ./components/*   # finds it, the way it finds .env
```

## What is given, and when

A call is addressed by name — `<namespace>.<component>.<endpoint>` — so nothing has to be found to
reach one. What a contract says is what a component declares:

| what                                  | when                              | what is read        |
| ------------------------------------- | --------------------------------- | ------------------- |
| the component you call                | the first call to it, per process | its operations      |
| the component whose event you receive | boot                              | the event's binding |

Neither is declared, and a component's own contract is read from its own manifest: `context.local`
and a receiver's target are what the process already has, and so is every component composed beside
it.

A boot makes no call to another component. A composition is ready when its own bindings are up,
whatever else is running.

## The map

`toa map` reads the context and writes every component of it with the version it runs and the
contract of that version:

```json
{
  "default.orders": {
    "version": "3f9a1c02",
    "entity": { "properties": { "sum": { "type": "number" } }, "required": ["sum"] },
    "operations": {
      "transit": { "type": "transition", "scope": "object", "bindings": ["@toa.io/bindings.amqp"] }
    },
    "events": { "created": { "binding": "@toa.io/bindings.amqp" } }
  }
}
```

A version is the component's content hash — the same one its image is tagged with — so it changes
when its sources change and not otherwise. What a component states about serving a call rather than
about making one — an operation's concurrency and bridge, the entity's storage and its migrations —
is left out.

The map is found the way `.env` is: walked up to from where the command runs, or named.

```shell
$ toa compose ./components/* --env application/.env --map application/components.json
```

`toa compose`, `toa serve`, `toa mono` and `toa call` are refused where a Context is there and its
map is not. A component run outside a Context has no peers a map could name, and needs none — it
calls what it composes.

Every component of the context is in it, including one it
[evicts](/documentation/compositions.md#evicted) — an evicted component is called like any other, so
it is described like any other. **Deploy one from the sources the context was deployed from**: the
map says what the context holds, which is what its callers are held to.

`toa deploy` writes the map it deploys. Everywhere else, **run `toa map` again when a component's
sources change** — a composition whose component the map states another version of is refused at
boot, and names it.

## When a call has no contract

A call to a component that the process neither composes nor finds in its map is refused, naming the
component:

```
Cannot call 'default.billing': the component map names no such component. Run `toa map`.
```

## While two versions serve

Two versions of a component serve at once for as long as a deployment takes to replace it, and both
take calls from the same queues. What a caller is held to is the version the map names, which is
what the deployment that wrote the map intends.

A component is described **once per process**, at the first call to it, and what was read is held
for as long as the process runs. So a caller keeps the contract it first read, which is what its own
code was written against.

A call is not routed by version: it goes to the endpoint's queue, which every version serves, so one
two versions both declare is served by either. The caller validates against the contract it read and
the callee does not validate again, so **an endpoint's input schema is yours to keep compatible
while two versions of it serve** — the same rule a deployment holds you to for the State. An
endpoint or an event only the newer version declares is not affected: the older one serves neither.

The gateway is described by the version that announced the route it matched, whatever the map says,
so a request it forwards is described by the same version that offered it the route — it forwards
what a client sends rather than what its own sources knew.

## Declaring the binding instead

A receiver that states its binding reads nothing at boot:

```yaml
# manifest.toa.yaml
receivers:
  external.orders.created:
    binding: amqp
    operation: transit
```

A [foreign event source](/documentation/component/declaration.md#event-sources) requires this: it is
not a component of the context, so nothing states its contract.
