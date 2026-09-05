# Anatomy of a Component

A component brings together state, operations, and integration contracts. This section follows
an `orders` component to show how those parts fit together.

```
orders/
  manifest.toa.yaml     # declaration: what this component is
  operations/           # logic: one file per operation
    create.ts
    approve.ts
    status.ts
  events/               # integration: when to announce state changes
    approved.ts
  receivers/            # integration: how to react to others
    payments.completed.ts
```

The manifest describes the component; operations, events, and receivers express its behavior.

## The manifest

The manifest declares the component's state, operations, and integrations:

```yaml
# manifest.toa.yaml
name: orders
namespace: shop        # groups related components

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
      customer:
        type: string
      status:
        type: string
        enum: [pending, approved, cancelled]
      total:
        type: integer
        minimum: 0
```

The schema describes what an order contains and which values are valid. The runtime owns
persistence, identity, and concurrency control; operations work with the order itself.

## Operations: the unit of logic

Each operation is declared in the manifest and implemented in `operations/<name>.ts`.
Its declaration describes what it does and the rejections a caller can expect:

```yaml
operations:
  approve:
    description: Approve a pending order.
    errors: [NOT_PENDING]
```

The implementation exports a single function *named after the operation's type* — the type
determines what the runtime does before and after the call:

```typescript
export async function transition (input: ApproveInput, object: Order) {
  if (object.status !== 'pending')
    return new Error('NOT_PENDING')

  object.status = 'approved'
}
```

A `transition` modifies the supplied state; its return value is the reply, not replacement state.
Here, an order that is no longer pending is rejected with the declared `NOT_PENDING` error.
Other operation types express different kinds of work:

```typescript
// observation: read-only view of the state
export async function observation (input, object: Order) {
  return object.status
}
```

```typescript
// computation: no state at all, pure function of input
export async function computation (input: LineItem) {
  return input.price * input.quantity
}
```

```typescript
// effect: interact through context without owning entity state
export async function effect (input: ChargeInput, context: Context) {
  return context.remote.shop.billing.charge({ input })
}
```

The operation types are covered in [Operations](../concepts/operations.md).

Note what the function signature *lacks*: transport, storage, serialization. An operation is
directly callable in a unit test:

```typescript
const object = { status: 'pending' }

await transition({}, object)

assert.equal(object.status, 'approved')
```

## Context: the door to the world

The `context` argument is the only way an operation reaches beyond its input and state:

```typescript
export async function transition (input: ApproveInput, object: Order, context: Context) {
  // call an operation of this component
  await context.local.status({ query: { id: object.id } })

  // call an operation of another component
  const balance = await context.remote.shop.billing.balance({ query: { id: object.customer } })

  // read deployment-time configuration
  const limit = context.configuration.limit

  // record what happened
  context.logs.info('Order approved', { id: object.id })
}
```

The context connects business logic to the rest of the application. Calls use component names;
configuration and other capabilities are supplied by extensions.

## Events: announcing changes

A component announces its state changes with event files. Each file names an event and defines
the condition under which it fires:

```typescript
export function condition (event: Event<Order>) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}
```

`event.origin` is the entity before the operation, `event.state` — after. The runtime evaluates
conditions for committed state changes and emits `shop.orders.approved` when the predicate turns
true. By default the payload is the new state; add an exported `payload` function to the same
module to customize it:

```typescript
export function payload (event: Event<Order>) {
  return { id: event.state.id, total: event.state.total }
}
```

Operations change state; events are a *declared consequence* of the change. The same event
condition applies whichever operation changes the order, so each operation only expresses its
own business rule.

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

```typescript
export function request (payment: Payment) {
  return { query: { id: payment.order } }
}
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

Values come from the application Context and are available as `context.configuration`.
The same operation can use different limits in different environments without changing its code.

## Extensions in the manifest

Extensions add their own declaration sections. The most common is `exposition` — HTTP resources
with authorization and I/O shaping:

```yaml
exposition:
  /:id:
    GET:
      auth:role: manager
      endpoint: status
    PATCH:
      auth:role: manager
      endpoint: approve
```

Here, a manager can read an order's status or approve it through HTTP. The operation itself
contains no routing or authorization code.

Extensions follow this pattern: a component declares a capability, and the runtime provides it.
Configuration supplies deployment values, Cadence arranges periodic or delayed work, and
Introspection makes the component visible in the application's topology. Each extension has its
own chapter; what matters here is that these capabilities fit around the same component model.

## Why the ignorance matters

A component knows nothing about:

- **transport** — same code whether calls arrive over AMQP, HTTP, or in memory;
- **storage** — same code on MongoDB or SQL;
- **location** — same code in one process or across a cluster;
- **language of its peers** — components interact through the same contracts across languages.

This ignorance is not a limitation; it is the entire point. It is what lets the runtime scale,
regroup, redeploy, and upgrade the mechanics of the system while the business logic — the part
that is expensive to get right — stays untouched.

---

Next: [Chapter II. Core Concepts](../concepts/operations.md), starting with operations in full
detail.
