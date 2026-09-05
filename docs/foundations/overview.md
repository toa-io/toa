# The Big Picture

Most backend architectures make an early decision between a monolith and microservices.
That decision shapes the source tree, module boundaries, communication style, deployment model,
and often the business logic itself. Changing it later means redesigning the application.

Toa separates the two concerns hidden inside that decision:

- a **component** is a logical boundary — a unit of business capability, state ownership, and
  integration;
- a **composition** is a physical boundary — a group of components running together as one
  process.

Components define what the system *is*. Compositions define how it *runs*.

This separation replaces the monolith-versus-microservices choice with deployment configuration.
The same components can run in one composition, like a monolith; each can run in its own
composition, like microservices; or they can be grouped somewhere in between. The application
code does not change when the grouping changes.

## Logical architecture: components

A component owns a business concept. It declares its state, exposes operations, emits events, and
reacts to events from elsewhere in the application.

For example, an online shop may contain these components:

```
orders       owns orders and their lifecycle
billing      owns charges and payment status
inventory    owns stock levels and reservations
reports      derives analytical views
```

These boundaries are chosen for domain reasons, not for process topology. An `orders` component
remains the same component whether it shares a process with `billing` or runs on another machine.

A minimal component declares its state and operations in a manifest:

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

```typescript
export async function transition (input, object: Order) {
  object.status = 'approved'
}
```

The component is a strong logical boundary in two important ways.

**Exclusive state ownership.** Only `orders` operations can access order state. Other components
cannot share its database tables or reach through the boundary to mutate an order. They interact
with `orders` through its operations and events.

**Explicit integration.** A component calls operations by logical address and subscribes to named
events. It does not know where another component runs, which transport connects them, or which
storage it uses.

This makes a component closer to a service in the domain sense than to a deployed microservice.
It has service boundaries without imposing a network boundary.

## Physical architecture: compositions

A composition groups components and, optionally, extension services into a runnable process.
It is the unit of deployment and scaling, and therefore the physical boundary of a Toa application.

Compositions are declared in the Context:

```yaml
# context.toa.yaml
compositions:
  - name: core
    components: [orders, billing, inventory]
    services: [exposition]
  - name: analytics
    components: [reports]
```

Here, the four logical components become two physical processes. Calls among `orders`, `billing`,
and `inventory` can stay in memory. Calls to `reports` cross a process boundary through a binding.
The component interface is identical in both cases.

The `services` declaration places the Exposition gateway alongside the `core` components,
so they run and scale together. Extension services not assigned to a composition are deployed
separately.

This grouping is an operational decision. Components may be grouped by traffic, resource usage,
scaling profile, fault isolation, or deployment cadence. If reporting becomes CPU-heavy, it can be
isolated and scaled without redesigning the domain. If several small components do not justify
separate processes, they can remain together without surrendering their logical boundaries.

## Monolith and microservices become configurations

Consider the same four components deployed in three ways.

### One composition: monolithic deployment

```yaml
compositions:
  - name: application
    components: [orders, billing, inventory, reports]
```

The application runs as one process. It has the operational simplicity of a monolith, while its
state ownership and integration boundaries remain explicit components.

The CLI can discover manifests under `components/*` and boot this shape directly:

```shell
toa mono
```

Extension services join the process as well. `toa deploy --mono` deploys this arrangement.

### One composition per component: microservice deployment

```yaml
compositions:
  - name: orders
    components: [orders]
  - name: billing
    components: [billing]
  - name: inventory
    components: [inventory]
  - name: reports
    components: [reports]
```

The application runs as independently deployable and scalable processes. The network boundaries
change, but the components do not.

### Mixed compositions: fit the workload

```yaml
compositions:
  - name: core
    components: [orders, billing, inventory]
  - name: reports
    components: [reports]
```

Most systems do not need either extreme. Toa allows physical boundaries to follow operational
evidence instead of architectural prediction.

The important invariant is that all three deployments have the same logical architecture. A
composition can be split or merged without merging component state, exposing internals, or
rewriting calls as network clients. In Toa, distribution is a property of deployment rather than
a property of business code.

## The Context: application and environment

The Context is the root declaration of an application, written in a single `context.toa.yaml`
file. It gives the application a name and points to its components:

```yaml
# context.toa.yaml
name: shop
```

Components live under `components/` in the application source tree.

The same file describes compositions, infrastructure, extension configuration, and values that
vary by environment. An application can run locally and in production with different topology
and configuration while keeping the same component code.

## An application on disk

The separation is visible in the project layout:

```
application/
  context.toa.yaml             # application, compositions, extensions, and infrastructure
  components/                  # logical business boundaries
    orders/
      manifest.toa.yaml
      operations/
        approve.ts
      events/
        approved.ts
    billing/
      manifest.toa.yaml
      operations/
        charge.ts
      receivers/
        orders.approved.ts
```

There is no `main()` or server setup in a component. Source code describes logic; manifests
describe contracts; the Context describes the application and its deployment environment. The
runtime assembles these declarations into processes.

## Location-transparent calls

Components call one another through the operation context, using logical names:

```typescript
const reply = await context.remote.orders.approve({
  query: { id: input.order }
})
```

There is no URL, hostname, or port in this call. Discovery resolves the component, and the runtime
selects the available communication path. If caller and callee belong to the same composition, the
call can be completed in memory. If they belong to different compositions, it is transmitted
through a configured binding.

Because both paths implement the same interface, moving a component across a physical boundary
does not leak into its logic.

Location transparency does not make distribution free: cross-process calls still have latency and
failure modes. It makes the location decision reversible and keeps its mechanics out of business
code.

## Integration through events

Operations provide direct interaction. Events let components integrate without temporal coupling.
A component declares an event as a condition on its own state change:

```typescript
export function condition (event: Event<Order>) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}
```

Another component binds that event to one of its operations:

```yaml
# components/billing/manifest.toa.yaml
receivers:
  orders.approved: charge
```

The `billing` component depends on the event contract, not on the physical location or availability
of `orders`. This remains true whether the two components run together or in different
compositions. Their logical integration does not change when their deployment topology does.

## The gateway is another physical edge

Components expose internal operations, not HTTP servers. The exposition extension maps external
resources to those operations:

```yaml
# components/orders/manifest.toa.yaml
exposition:
  /:id:
    PATCH:
      endpoint: approve
```

The gateway discovers the declaration and maps `PATCH /orders/:id` to `orders.approve`.
Authentication, authorization, caching, and input/output mapping surround the same logical
component contract.

The gateway can also expose these resources through [JSON-RPC](../../extensions/exposition/documentation/rpc.md)
and [MCP](../../extensions/exposition/documentation/mcp.md), with
[OAuth](../../extensions/exposition/documentation/oauth.md) support for authorizing clients.

Like a composition boundary, the HTTP boundary is supplied by the runtime. It does not become part
of the operation.

## Introspection: seeing the resulting system

Location transparency keeps deployment mechanics out of components, but operators still need to
see the system that those declarations and runtime interactions produce. The introspection
extension collects that topology and presents it as a graph.

Its nodes describe components and their declared entities, operations, events, receivers, and
extension surfaces. Its edges combine declared event relations with calls observed between
components and services at runtime. The graph is available through a web UI and an API.

This does not weaken component boundaries. Introspection observes declarations and runtime
communication from the platform side; business operations do not acquire discovery or telemetry
code to participate.

That is the central architectural move in Toa:

> Components preserve logical boundaries. Compositions choose physical boundaries.

A system no longer has to encode “monolith” or “microservices” into its source architecture. It
can begin with one process, separate components when operational pressure appears, regroup them as
conditions change, and retain the same application model throughout.

---

Next: [Anatomy of a Component](component.md) — the logical boundary taken apart, file by file.
