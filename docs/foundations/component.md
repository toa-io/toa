# Anatomy of a Component

This section takes a single component apart, file by file. The example is `orders` — simplified,
but structurally identical to real-world components.

```
orders/
  manifest.toa.yaml     # declaration: what this component is
  package.json          # ES module format
  types/                # declarations, generated with toa types
    index.d.ts
    toa.d.ts
  operations/           # logic: one file per operation
    create.ts
    approve.ts
    status.ts
  events/               # integration: when to announce state changes
    approved.ts
  receivers/            # integration: how to react to others
    payments.completed.ts
```

The manifest declares; the directories implement. These examples use TypeScript ES modules,
so `package.json` beside the manifest contains:

```json
{ "type": "module" }
```

Run `toa types` from the application Context to generate declarations before typechecking.
Node runs the `.ts` modules directly, with no build step or loader.

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
introspection: ...     # extension: topology visibility and sampling policy
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

Each operation is declared in the manifest and implemented in `operations/<name>.ts`.
The Node bridge also supports JavaScript and CommonJS modules.
The declaration carries the schema of the input and the concurrency strategy:

```yaml
operations:
  approve:
    description: Approve a pending order.
    concurrency: retry
    errors: [NOT_PENDING]
    input:
      properties:
        comment: { type: string, maxLength: 256 }
```

The implementation exports a single function *named after the operation's type* — the type
determines what the runtime does before and after the call:

```typescript
export async function transition (input: ApproveInput, object: Entity) {
  if (object.status !== 'pending')
    return new Error('NOT_PENDING')

  object.status = 'approved'
}
```

A `transition` modifies the supplied state; its return value is the reply, not replacement state.
The second parameter names the scope: `object`, `objects`, or `changeset`. Declare `scope`
explicitly if using another parameter name. Expected errors must appear in `errors`; returning
an undeclared code is a contract violation. Other types make
different deals with the runtime:

```typescript
// observation: read-only view of the state
export async function observation (input: unknown, object: Entity) {
  return object.status
}
```

```typescript
// computation: no state at all, pure function of input
export async function computation (input: { price: number, quantity: number }) {
  return input.price * input.quantity
}
```

```typescript
// effect: interact through context without owning entity state
export async function effect (input: ChargeInput, context: Context) {
  return context.remote.shop.billing.charge({ input })
}
```

The full catalog — five types plus the `unmanaged` escape hatch, and the rules operations must
obey — is in [Operations](../concepts/operations.md).

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
export async function transition (input: ApproveInput, object: Entity, context: Context) {
  // call an operation of this component
  await context.local.status({ query: { id: object.id } })

  // call an operation of another component
  const balance = await context.remote.shop.billing.balance({ query: { id: object.customer } })

  // read deployment-time configuration
  const limit = context.configuration.limit

  // write a structured log (an aspect provided by the telemetry extension)
  context.logs.info('Order approved', { id: object.id })
}
```

Extensions supply context capabilities from their declarations; remote calls use logical component
names. Call dependencies are also expressed in code, so the manifest alone is not a complete list
of the components an operation may call. A configuration secret is read with
`context.configuration.apiKey.unwrap()`, not used as a plain string.

Application operations, events, receivers, and guards do not import runtime packages under
`@toa.io/*`. Type-only imports are the exception.

## Events: announcing changes

A component announces its state changes with event files. Each file names an event and defines
the condition under which it fires:

```typescript
type Change = { origin: Entity | null, state: Entity }

export function condition (event: Change) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}
```

`event.origin` is the entity before the operation, `event.state` — after. The runtime evaluates
conditions for committed state changes and emits `shop.orders.approved` when the predicate turns
true. By default the payload is the new state; add an exported `payload` function to the same
module to customize it, reusing its `Change` type:

```typescript
export function payload (event: Change) {
  return { id: event.state.id, total: event.state.total }
}
```

Events are not sent by operations. Operations change state; events are a *declared consequence*
of the change. This keeps the logic pure and guarantees that an announcement can never be
forgotten, no matter which operation caused the change.

In a deployment, events consumed outside the Context must also be listed in its `events`
declaration. Events with no declared consumer are not published; local runs publish all events.

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
export function request (payment: { order: string }) {
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

Values (including secrets) come from the Context at deployment time and surface as
`context.configuration`. A missing or invalid value fails at startup, not in production at 3am.

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

`auth:id` compares an identity with a named route parameter; it does not read an entity
field. Ownership checks that depend on stored order data belong in the application operation.
Credentials are sent in the `authorization` header; Toa does not use cookies.

Each extension chapter covers its section; the point here is the pattern: a component gains
capabilities by *declaring* them, and the manifest remains the single place where the component's
entire surface — state, logic, events, HTTP, configuration — can be read.

Some extensions are predefined and therefore need no declaration in the common case.
Introspection, for example, includes the component in the product topology by default. A component
that handles sensitive data can prohibit call samples, even when sampling is enabled for the
application:

```yaml
introspection:
  samples: false
```

Setting `introspection: false` excludes the component from topology collection entirely.

## TypeScript and generated types

Run `toa types` from the application Context after changing manifests. It generates
`types/toa.d.ts` for each component and creates `types/index.d.ts` once for additions you own.
Import declarations with `import type` from `../types/index.d.ts`.

Application `.ts` modules run directly with Node's type erasure. Use erasable syntax, explicit
file extensions in relative imports, and a `package.json` with `"type": "module"` for ES modules.
Enums, namespaces, and parameter properties need compilation and are not supported here.
Keep helpers and tests outside `operations/`, and never leave both `approve.js` and `approve.ts`
there: each file defines an endpoint. Packaged components installed under `node_modules` must
ship transpiled code. See the [Node bridge](../../connectors/bridges.node/readme.md#typescript).

## Periodic and delayed calls

A component can declare periodic work with [Cadence](../../extensions/cadence/readme.md):

```yaml
cadence:
  sweep: 3600           # call this component's sweep operation once an hour
```

The operation receives `{ n, i }`, the interval count and index within a cycle. A missed interval
is not made up: select work that is still due. Cadence requires configured atomicity; without it,
no calls are made.

The same extension provides `context.delay` and `context.delay.cancel`. Delays use milliseconds
and require an explicit `overdue` bound (or `null`). Delayed calls may repeat, and scheduling one
is not transactional with the caller's state. The target must handle duplicates.

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
