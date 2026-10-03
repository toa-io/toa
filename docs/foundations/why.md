# Why Toa
<ok>
## The problem

Consider a service that approves an order. The business logic is one line:

```javascript
order.status = 'approved'
```

Now consider what it takes to run that line in a real distributed system:

- receive the request over some transport and deserialize it,
- validate the request against a schema,
- load the current state of the order from a database,
- handle the case where another process modified the order concurrently,
- persist the new state, with versioning and timestamps,
- publish an "order approved" event so other services can react,
- reply to the caller — or report a failure in a way the caller can handle,
- and, around all of that: configuration, secrets, service discovery, retries,
  connection management, logging, tracing, deployment.

In a typical codebase, the one line of business logic is buried inside hundreds of lines of this
machinery. The machinery is not unique to the order service — every service in the system
reimplements the same patterns, each with its own subtle bugs. Worse, the machinery and the logic
are entangled: the business rule "an order becomes approved" cannot be read, tested, or changed
without touching transport, storage, and serialization code.
</ok>

## The Toa answer
<ok>
Toa splits a service into two parts:

**Logic** — functions written by the application developer. In Toa they are called *operations*.
The order approval above is a complete, valid Toa operation:

```javascript
// operations/approve.js
async function transition (input, order, context) {
  order.status = 'approved'
}
```

**Mechanics** — everything else, provided by the runtime and driven by *declarations*.
The developer declares what the service is, not how it works:

```yaml
# manifest.toa.yaml
name: orders

entity:
  schema:
    properties:
      status: { type: string, enum: [pending, approved] }

operations:
  approve:
    concurrency: retry
```

From these declarations the runtime derives the machinery: it validates incoming requests against
the schema, retrieves the order from storage before calling the function, persists the returned
state after, retries the whole cycle on concurrent modification (`concurrency: retry`), and emits
events when the state changes.

This is what *low-code* means in Toa. Not visual programming, and not "less capable" — it means
the code that remains is almost entirely business logic, while the mechanics are declared and
outsourced to the runtime.
</ok>

<ok>Notice what the `approve` function above does *not* contain: no database client, no message
broker, no HTTP. It receives plain values and returns a plain value.</ok>

Business logic stays within the boundaries set by the runtime: state and external interactions
pass through the interfaces it provides.

<ok>These constraints are what make the mechanics *possible to outsource*.</ok>
This is what makes Toa *opinionated*: it establishes a common model for application logic,
state, and communication. Applications follow that model so the runtime can take responsibility
for their execution. The trade-off is freedom in how the application is structured in exchange
for less machinery to build and maintain.

## Eventual consistency as a first-class citizen

Distributed systems are eventually consistent by nature: independent services with independent
storage cannot share a global transaction without giving up the very properties — autonomy,
availability, scalability — that made them separate services in the first place.

Most frameworks treat this as an unfortunate detail the developer must paper over. Toa instead
builds on it:

- Each component owns its state exclusively; no other component can touch it.
- Components integrate through *events*: when a component's state changes, the runtime emits an
  event; other components declare *receivers* to react to it.

```yaml
# the workspaces component reacts to an event of the epics component
receivers:
  epics.closed: destroy
```

- Communication is asynchronous and reliable: messages are acknowledged and redelivered, and
  operations are constrained so that redelivery is safe.

The system as a whole converges: every state change eventually propagates to everyone who
declared an interest in it, and the developer writes no coordination code along the way.

## Design principles

The rest of the documentation repeatedly returns to a few principles, so they are worth naming
up front:

1. **Declarations over code.** If something can be expressed as data — schemas, endpoints,
   access policies, event bindings — it is declared in YAML, validated at startup, and used by
   the runtime, tooling, and documentation alike.
2. **The runtime owns the mechanics.** State persistence, concurrency, transport, validation,
   discovery, deployment: all replaceable implementations of runtime abstractions, invisible
   to the logic.
3. **Uniform interfaces.** Every operation, local or remote, is called the same way; every
   message has the same shape (see [Communication](../concepts/communication.md)). Uniformity is
   what makes transparent discovery, in-memory shortcuts, and multi-protocol transmission
   possible.
4. **Everything is replaceable.** Storages, protocols, languages ("bridges"), and even core
   behaviors are connectors and extensions behind contracts. Built-in implementations are just
   defaults.

## Trade-offs

Toa is opinionated, and the opinions have a price:

- **No shared transactions across components.** If two components must change together
  atomically, they are probably one component.
- **Operations are constrained.** Code that wants to open sockets, keep in-process caches, or
  throw exceptions across boundaries is fighting the model. Escape hatches exist (unmanaged
  operations, origins), but they are explicit and visible.
- **Strong conventions.** File layout, naming, and manifests follow the runtime's rules; the
  payoff is that every Toa component looks familiar, and tooling works everywhere.

---

Next: [The Big Picture](overview.md) — the shape of a whole Toa application.
