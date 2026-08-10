# The Big Picture

A Toa application is built from three kinds of things:

- **Components** — the units of logic and state. Each component is a directory with a manifest
  and a few functions.
- **The Context** — the application itself: a declaration that names the components and
  describes the environment they run in.
- **Compositions** — groupings of components into runnable processes, defined at deployment
  time, invisible to the code.

This section walks through each, top-down.

## An application on disk

A real Toa application looks like this (trimmed):

```
application/
  context.toa.yaml          # the Context: application declaration
  context/
    compositions.yaml       # how components group into processes
    exposition.yaml         # HTTP gateway configuration
    storages.yaml           # BLOB storage providers
  components/
    orders/
      manifest.toa.yaml     # component declaration
      operations/
        approve.js          # business logic
        ...
      events/
        approved.js         # event emission condition
    billing/
      manifest.toa.yaml
      operations/
        ...
      receivers/
        orders.approved.js  # reaction to another component's event
    ...
```

There is no framework code, no `main()`, no server setup anywhere in this tree.
Everything that is not a declaration is a small function.

## The Context

The Context is the root declaration — it gives the application a name and points to its
components:

```yaml
# context.toa.yaml
name: shop
packages: components/*
```

Everything else in the Context describes the *environment*: which infrastructure to use, how to
group components into processes, where the HTTP gateway listens. Environment declarations support
per-environment values with the `@` suffix:

```yaml
# context/exposition.yaml
exposition:
  authorities:
    main@local: localhost:8000
    main@production: api.shop.example
```

The same application source deploys to a laptop or a production cluster; only the annotations
differ.

## Components

A component is the unit of design: it owns a single entity type (its state), exposes operations,
and emits events. A minimal complete component is two files:

```yaml
# components/orders/manifest.toa.yaml
name: orders

entity:
  schema:
    properties:
      status: { type: string, enum: [pending, approved] }

operations:
  approve:
    concurrency: retry
```

```javascript
// components/orders/operations/approve.js
async function transition (input, order, context) {
  order.status = 'approved'

  return order
}
```

Two properties of components carry the whole architecture:

**Exclusive state ownership.** Only the `orders` component can read or write order state. There is
no shared database; there is not even a database *visible* — the manifest declares an entity
schema, and the runtime binds a storage to it at deployment time.

**Location transparency.** Components call each other through the context, addressing operations
by name — never by host, port, or URL:

```javascript
// somewhere in the billing component
const reply = await context.remote.orders.approve({ query: { id: input.order } })
```

Whether `orders` runs in the same process, on the same machine, or across a cluster is decided at
deployment and can change without touching this line.

## Integration through events

Components do not orchestrate each other. Instead, a component announces changes of its own state,
and others react. An event is declared as a *condition* on a state change:

```javascript
// components/orders/events/approved.js
function condition (event) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}
```

`event.origin` is the state before the operation, `event.state` — after. Whenever any operation
causes this predicate to become true, the runtime emits `orders.approved` with the new state as
the payload.

A component that cares declares a receiver — a binding of an event to one of its own operations:

```yaml
# components/billing/manifest.toa.yaml
receivers:
  orders.approved: charge
```

The runtime delivers the event reliably: if `billing` is down when the order is approved, it
processes the event when it comes back. This is the eventual consistency described in
[Why Toa](why.md) made concrete: no component waits for another, and the system converges.

## Compositions: from components to processes

Components are a design-time concept. At deployment time they are grouped into *compositions* —
the actual processes:

```yaml
# context/compositions.yaml
compositions:
  - name: core
    components: [orders, billing]
  - name: heavy
    components: [reports]
```

Grouping is a pure operations decision, made by resource and scaling needs. Calls between
components in one composition short-circuit in memory; calls across compositions travel over a
message broker — through the exact same interface. Regrouping requires no code change.

## The gateway

Components speak the internal protocol only. To face the outside world, a component declares HTTP
resources in its manifest, using the *exposition* extension:

```yaml
# components/orders/manifest.toa.yaml
exposition:
  /:id:
    PATCH:
      endpoint: approve
```

At startup, the gateway discovers these declarations and routes
`PATCH /orders/:id` to the `approve` operation. Authentication, authorization, caching, and
input/output shaping are declared the same way — covered in
[Exposition](../extensions/exposition/index.md).

## The life of a request

Putting it all together, here is what happens when a client approves an order:

1. `PATCH /orders/abc123` arrives at the **gateway**, which matches the declared resource and
   maps it to a request to the `approve` operation of `orders`.
2. The runtime **validates** the request against the declared schema.
3. The request is **transmitted** to an instance of the composition running `orders` — over the
   broker, or in memory if the gateway tenant is co-located.
4. The runtime **retrieves** the current state of order `abc123` from the bound storage.
5. The `approve` function **runs**: pure logic, milliseconds, no I/O.
6. The runtime **commits** the new state — and retries from step 4 if the order changed
   concurrently.
7. The `approved` **event condition** now holds, so the runtime emits `orders.approved`;
   the broker delivers it to `billing`, which runs its `charge` operation, eventually.
8. The **reply** travels back through the gateway to the client.

The developer wrote steps 5 and 7's condition — roughly six lines. Everything else is the runtime
executing declarations.

---

Next: [Anatomy of a Component](component.md) — a component taken apart, file by file.
