# Anatomy of a Component

This section takes a single component apart, file by file. The example is `orders` — simplified,
but structurally identical to real-world components.

```
orders/
  manifest.toa.yaml     # declaration: what this component is
  operations/           # logic: one file per operation
    create.js
    approve.js
    status.js
  events/               # integration: when to announce state changes
    approved.js
  receivers/            # integration: how to react to others
    payments.completed.js
```

The manifest declares; the directories implement. Nothing else is required — no package
boilerplate, no wiring code.

## The manifest

The manifest is the component's complete public contract. Everything the runtime, other
components, and tooling need to know is here:

```yaml
# manifest.toa.yaml
name: orders
namespace: shop        # optional; 'default' if omitted

entity:                # the state this component owns
  schema: ...

operations:            # the logic it exposes
  create: ...
  approve: ...
  status: ...

receivers:             # events it reacts to
  payments.completed: approve

configuration: ...     # what can be tuned per deployment

exposition: ...        # extension: HTTP resources
```

The component's full name is `shop.orders`; operations are addressed as
`shop.orders.approve` from anywhere in the application.

## Entity: the unit of state

A component owns at most one entity type, described by a schema:

```yaml
entity:
  schema:
    properties:
      customer: &id
        type: string
        pattern: ^[0-9a-f]{32}$
      status:
        type: string
        enum: [pending, approved, cancelled]
      total:
        type: integer
        minimum: 0
```

The schema is standard JSON Schema in YAML, and YAML anchors (`&id`) are conventionally used to
reuse fragments across the manifest.

Declaring an entity is all it takes to get persistence. The runtime binds a storage (MongoDB,
SQL — a deployment decision), and maintains system fields on every entity object: `id`,
`_version` for concurrency control, `_created` and `_updated` timestamps. The component's code
never sees a database.

## Operations: the unit of logic

Each operation is declared in the manifest and implemented in `operations/<name>.js`.
The declaration carries the schema of the input and the concurrency strategy:

```yaml
operations:
  approve:
    concurrency: retry
    input:
      properties:
        comment: { type: string, maxLength: 256 }
```

The implementation exports a single function *named after the operation's type* — the type
determines what the runtime does before and after the call:

```javascript
// operations/approve.js
async function transition (input, order, context) {
  if (order.status !== 'pending')
    return new Error('NOT_PENDING')

  order.status = 'approved'
}

module.exports = { transition }
```

A `transition` receives the current state and returns the new state to persist. Other types make
different deals with the runtime:

```javascript
// observation: read-only view of the state
async function observation (input, order) {
  return order.status
}

// computation: no state at all, pure function of input
async function computation (input) {
  return input.price * input.quantity
}

// effect: side effects allowed — the escape hatch for I/O
async function effect (input, context) {
  return context.origins.gateway.charge(...)
}
```

The full catalog — five types plus the `unmanaged` escape hatch, and the rules operations must
obey — is in [Operations](../concepts/operations.md).

Note what the function signature *lacks*: transport, storage, serialization. An operation is
directly callable in a unit test:

```javascript
const order = { status: 'pending' }

await approve.transition({}, order)

assert(order.status === 'approved')
```

## Context: the door to the world

The `context` argument is the only way an operation reaches beyond its input and state:

```javascript
async function transition (input, order, context) {
  // call an operation of this component
  await context.local.status({ query: { id: order.id } })

  // call an operation of another component
  const balance = await context.remote.shop.billing.balance({ query: { id: order.customer } })

  // read deployment-time configuration
  const limit = context.configuration.limit

  // write a structured log (an aspect provided by the telemetry extension)
  context.logs.info('Order approved', { id: order.id })
}
```

Everything on the context is declared — configuration in the manifest, remote components resolved
by discovery, aspects contributed by extensions. If it is not declared, it is not there; a
component's dependencies are readable from its manifest alone.

## Events: announcing changes

A component announces its state changes with event files. Each file names an event and defines
the condition under which it fires:

```javascript
// events/approved.js
function condition (event) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}

module.exports = { condition }
```

`event.origin` is the entity before the operation, `event.state` — after. The runtime evaluates
conditions after every unsafe operation and emits `shop.orders.approved` when the predicate turns
true. By default the payload is the new state; an optional `payload` function customizes it:

```javascript
function payload (event) {
  return { id: event.state.id, total: event.state.total }
}
```

Events are not sent by operations. Operations change state; events are a *declared consequence*
of the change. This keeps the logic pure and guarantees that an announcement can never be
forgotten, no matter which operation caused the change.

## Receivers: reacting to others

The other side of integration: a receiver binds someone else's event to one of the component's
own operations.

```yaml
# manifest.toa.yaml
receivers:
  payments.completed: approve
```

When the payload maps directly to the operation's request, the declaration is all that is needed.
Otherwise a translation function in `receivers/` reshapes it:

```javascript
// receivers/payments.completed.js
function request (payment) {
  return { query: { id: payment.order } }
}

module.exports = { request }
```

The receiving component depends only on the event's name and payload — not on the emitter being
available, or even on the emitter being a Toa component.

## Configuration

Anything tunable per deployment is declared with a schema:

```yaml
configuration:
  schema:
    properties:
      limit: { type: integer, default: 10000 }
    required: [limit]
```

Values (including secrets) come from the Context at deployment time and surface as
`context.configuration`. A missing or invalid value fails at startup, not in production at 3am.

## Extensions in the manifest

Extensions add their own declaration sections. The most common is `exposition` — HTTP resources
with authorization and I/O shaping:

```yaml
exposition:
  /:id:
    GET:
      auth:id: customer        # only the order's customer may read it
      io:output: [id, status, total]
      endpoint: observe
    PATCH:
      auth:role: manager
      endpoint: approve
```

Each extension chapter covers its section; the point here is the pattern: a component gains
capabilities by *declaring* them, and the manifest remains the single place where the component's
entire surface — state, logic, events, HTTP, configuration — can be read.

## Why the ignorance matters

A component knows nothing about:

- **transport** — same code whether calls arrive over AMQP, HTTP, or in memory;
- **storage** — same code on MongoDB or SQL;
- **location** — same code in one process or across a cluster;
- **language of its peers** — operations are files interpreted by a *bridge*
  (Node.js is built in, and even Bash works: an operation can be a `.sh` file).

This ignorance is not a limitation; it is the entire point. It is what lets the runtime scale,
regroup, redeploy, and upgrade the mechanics of the system while the business logic — the part
that is expensive to get right — stays untouched.

---

Next: [Chapter II. Core Concepts](../concepts/operations.md), starting with operations in full
detail.
