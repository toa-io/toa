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

For development and compact deployments, `toa mono` takes the same separation one step further:
it boots the application composition and extension services in one process. `toa deploy --mono`
packages that process into one image and one Kubernetes Deployment. This changes the operational
shape, not the component model.

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

A minimal component is a manifest and an operation. The TypeScript examples use ES modules;
place this `package.json` beside the component manifest:

```json
{ "type": "module" }
```

Run `toa types` from the application Context to generate the imported `Entity` declaration.
Node runs the operation directly from its `.ts` file:

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
// components/orders/operations/approve.ts
import type { Entity } from '../types/index.d.ts'

export async function transition (input: unknown, object: Entity) {
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

A composition groups components into a runnable process. It is the unit of deployment and
scaling, and therefore the physical boundary of a Toa application.

Compositions are declared in the Context:

```yaml
# context/compositions.yaml
compositions:
  - name: core
    components: [orders, billing, inventory]
  - name: analytics
    components: [reports]
```

Here, the four logical components become two physical processes. Calls among `orders`, `billing`,
and `inventory` can stay in memory. Calls to `reports` cross a process boundary through a binding.
The component interface is identical in both cases.

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

The same application can be built and deployed as a single image with `toa deploy --mono`.
Extension services join the process as well, so this is the most compact physical form of a Toa
application rather than merely a composition containing every component.

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

The Context is the root declaration of an application. It gives the application a name and points
to its components:

```yaml
# context.toa.yaml
name: shop
```

By convention, components under `components/*` are discovered automatically. A `packages`
declaration is only needed when the application uses another layout.

The Context also contains deployment concerns: compositions, infrastructure addresses,
extension configuration, and environment-specific values.

```yaml
# context/exposition.yaml
exposition:
  authorities:
    main@local: localhost:8000
    main@production: api.shop.example
```

The `@` suffix selects values for an environment. The same application source can run locally,
in a test environment, or in a production cluster with different physical topology and
infrastructure.

## An application on disk

The separation is visible in the project layout:

```
application/
  context.toa.yaml             # application declaration
  context/
    compositions.yaml          # physical process boundaries
    exposition.yaml            # HTTP gateway configuration
    infrastructure.yaml        # environment infrastructure
  components/                  # logical business boundaries
    orders/
      manifest.toa.yaml
      package.json            # { "type": "module" }
      types/                  # declarations generated by toa types
      operations/
        approve.ts
      events/
        approved.ts
    billing/
      manifest.toa.yaml
      package.json            # { "type": "module" }
      types/                  # declarations generated by toa types
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
// components/orders/events/approved.ts
import type { Entity } from '../types/index.d.ts'

type Change = { origin: Entity | null, state: Entity }

export function condition (event: Change) {
  return event.origin?.status !== 'approved' && event.state.status === 'approved'
}
```

Consumers outside the application must be listed in the Context's `events` declaration.
Receivers must tolerate redelivery.

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
Declare authorization for the resource as well: a route without a granting policy denies access.
Authentication, authorization, caching, and input/output mapping surround the same logical
component contract. Credentials travel in the `authorization` header, not cookies.

The gateway can also expose these resources through [JSON-RPC](../../extensions/exposition/documentation/rpc.md)
at `/.rpc` and publish selected methods as [MCP tools](../../extensions/exposition/documentation/mcp.md)
at `/.mcp`. Both require Context annotations; a method becomes a tool only when it declares
`mcp:tool` with a description. The [OAuth authorization server](../../extensions/exposition/documentation/oauth.md)
can authorize clients; the application supplies the page where a user signs in and gives consent.

Like a composition boundary, the HTTP boundary is supplied by the runtime. It does not become part
of the operation.

## Introspection: seeing the resulting system

Location transparency keeps deployment mechanics out of components, but operators still need to
see the system that those declarations and runtime interactions produce. The introspection
extension collects that topology and presents it as a graph.

Its nodes describe components and their declared entities, operations, events, receivers, and
extension surfaces. Its edges combine declared event relations with calls observed between
components and services at runtime. Optional call samples can capture inputs and outcomes;
sampling is off by default and can be prohibited by an individual component.

Introspection is enabled by default. It publishes a protected HTTP API and, unless disabled, a web
UI at `/.introspection/`; both rely on Exposition. The page is public, but its data requires
the `system:introspection` role. A Context without Exposition must disable Introspection.
A Context can tune collection or turn it off:

```yaml
# context.toa.yaml
introspection:
  samples: false
  interval: 300
  ui: true
```

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
