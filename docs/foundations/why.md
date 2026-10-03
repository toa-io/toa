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
broker, no HTTP. It receives plain values and returns a plain value.

Business logic stays within the boundaries set by the runtime: state and external interactions
pass through the interfaces it provides.
</ok>

<ok>These constraints are what make the mechanics *possible to outsource*.</ok>
This is what makes Toa *opinionated*: it establishes a common model for application logic,
state, and communication. Applications follow that model so the runtime can take responsibility
for their execution. The trade-off is freedom in how the application is structured in exchange
for less machinery to build and maintain.

## Eventual consistency as a first-class citizen

Distributed systems are eventually consistent by nature: independent services with independent
storage cannot share a global transaction without giving up the very properties — autonomy,
availability, scalability — that made them separate services in the first place.
