# Drafts

Fragments written before the guide, kept as written. Each is worked into the page named beside it
and deleted from here once it is.

## Eventual consistency as a first-class citizen

→ `2-components/10-consistency.md`, the opening.

Distributed systems are eventually consistent by nature: independent services with independent
storage cannot share a global transaction without giving up the very properties — autonomy,
availability, scalability — that made them separate services in the first place.

## The Big Picture

→ `1-start/01-concepts.md` (component versus composition, the shop example) and
`3-application/02-compositions.md` (the three deployments, `services`, `toa mono`).

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

### Logical architecture: components

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

### Physical architecture: compositions

A composition groups components and, optionally, runtime services into a runnable process.
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
so they run and scale together. Runtime services not assigned to a composition are deployed
separately.

This grouping is an operational decision. Components may be grouped by traffic, resource usage,
scaling profile, fault isolation, or deployment cadence. If reporting becomes CPU-heavy, it can be
isolated and scaled without redesigning the domain. If several small components do not justify
separate processes, they can remain together without surrendering their logical boundaries.

### Monolith and microservices become configurations

Consider the same four components deployed in three ways.

#### One composition: monolithic deployment

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

Runtime services join the process as well. `toa deploy --mono` deploys this arrangement.

#### One composition per component: microservice deployment

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

#### Mixed compositions: fit the workload

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
