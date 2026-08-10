# Toa

**Toa is a runtime for low-code, eventually consistent distributed systems.**

Most of the code in a typical backend service is not business logic.
It is transport, serialization, validation, concurrency control, state persistence, retries,
service discovery, configuration, authentication — the same machinery, rewritten in every service,
entangled with the logic that actually matters.

Toa inverts this ratio.
An application developer writes *operations* — small, pure functions expressing business logic —
and *declares* everything else: data schemas, communication endpoints, HTTP resources,
access policies, storage requirements.
The runtime provides the machinery: it persists state with optimistic concurrency control,
transmits requests and events reliably across processes and protocols, validates messages,
discovers services, exposes HTTP APIs, and deploys the whole system to Kubernetes with one command.

The result is a system where a service is often a handful of one-liner functions and a YAML
manifest — yet runs as a set of independently scalable, fault-tolerant processes with
eventual consistency guarantees.

This book explains Toa from first principles: starting with the ideas the runtime is built on,
descending through its core abstractions, down to the implementation details of connectors and
extensions, and ending with operating Toa systems in production.
Each chapter builds on the previous ones, so it is meant to be read in order —
though later parts can serve as reference material.

---

## Table of Contents

### Part I. Foundations

*The ideas. What problems Toa solves and the mental model behind it. No code yet.*

1. **[Why Toa](foundations/why.md)**
   — the cost of distributed systems machinery; low-code as separation of logic from mechanics;
   eventual consistency as a first-class citizen; design principles and trade-offs.
2. **[The Big Picture](foundations/overview.md)**
   — components, compositions, and the context; how a Toa application is shaped;
   a walkthrough of a minimal application from source tree to running system.
3. **[Anatomy of a Component](foundations/component.md)**
   — the manifest; operations as the unit of logic; entities as the unit of state;
   events as the unit of integration; why components stay ignorant of transport and storage.

### Part II. Core Concepts

*The vocabulary of Toa, one concept at a time. After this part you can read and write
Toa applications.*

4. **[Operations](concepts/operations.md)**
   — the retrieve–run–commit lifecycle; the five types: transition, observation, assignment,
   computation, effect; safe vs. unsafe operations; genuine operation rules
   (stateless, deterministic, autonomous, pure, non-exceptional); unmanaged escape hatch.
5. **[State and Entities](concepts/state.md)**
   — entity schemas; the scope: object, set, stream; changesets; identity, versioning,
   and timestamps; optimistic concurrency control and the `retry` strategy; invariants (guards).
6. **[Queries](concepts/queries.md)**
   — input/query segregation; criteria, projection, sorting, pagination; queryability limits.
7. **[Context](concepts/context.md)**
   — what an operation is allowed to see: local and remote calls, configuration, aspects;
   why the context is the only door to the outside world.
8. **[Events and Receivers](concepts/events.md)**
   — entity events and conditional emission; binding receivers to domestic and foreign events;
   event sources beyond the application boundary.
9. **[Errors and Exceptions](concepts/errors.md)**
   — successful rejections vs. distributed exceptions; error contracts in schemas;
   how failures propagate across component boundaries.
10. **[Communication](concepts/communication.md)**
    — the Uniform Communication Protocol (UCP): request, reply, event;
    message validation; transparent service discovery; flow control;
    multi-protocol transmission and in-memory shortcuts.
11. **[Prototypes](concepts/prototypes.md)**
    — service prototyping through inheritance; the generic prototype;
    building families of components without repetition.

### Part III. Building Applications

*The practice. From an empty directory to a tested application.*

12. **[Project Layout and the Context](building/context.md)**
    — `context.toa.yaml`; namespaces; environments; annotations and pointers.
13. **[Manifests in Depth](building/manifest.md)**
    — full manifest reference by example: entity, operations, events, receivers,
    extensions; schema definitions (concise syntax and JSON Schema).
14. **[Bridges](building/bridges.md)**
    — language interoperability; the Node.js bridge in detail; the Bash bridge;
    how to implement a bridge for another language.
15. **[The CLI](building/cli.md)**
    — developing, running, and inspecting applications; the development environment;
    replay and debugging workflows.
16. **[Testing](building/testing.md)**
    — unit testing operations as pure functions; the integration stage SDK;
    the runtime bootloader API; example-based walkthrough.

### Part IV. The Runtime

*Under the hood. How the core actually works. Required reading for extending Toa,
optional for using it.*

17. **[The Connector Model](runtime/connector.md)**
    — the universal lifecycle abstraction: open, close, linking; connector trees;
    why everything in Toa (storages, bindings, operations themselves) is a connector.
18. **[Boot](runtime/boot.md)**
    — from declarations to a running composition: manifest normalization (norm),
    dependency resolution, assembly of the connector tree.
19. **[Core Abstractions](runtime/core.md)**
    — a guided tour of the core: call, transmission, emission, discovery, receiver,
    guard, cascade, reflection; how a request travels through the runtime.
20. **[Compositions and Processes](runtime/composition.md)**
    — grouping components into deployable units; local vs. distributed calls;
    scaling model.
21. **[Extensibility](runtime/extensibility.md)**
    — the extension contract: manifests extension points, tenants, aspects;
    how to write your own extension, storage driver, or binding.

### Part V. Connectors

*The built-in implementations of runtime abstractions.*

22. **[Bindings](connectors/bindings.md)**
    — AMQP binding on top of ComQ: reliable RPC and events; the loop binding
    for in-process communication.
23. **[Storages](connectors/storages.md)**
    — the storage contract; MongoDB driver; SQL driver (Knex); the null storage;
    multi-document transactions.

### Part VI. Extensions

*Everything beyond the core. Each chapter is self-contained, but assumes Parts I–II.*

24. **[Exposition: the API Gateway](extensions/exposition/readme.md)**
    — the largest extension, in its own sub-book:
    - [Resource Tree and Discovery](extensions/exposition/tree.md) — ROA over SOA;
      declarative HTTP resources; routing and the resource tree.
    - [Protocol](extensions/exposition/protocol.md) — content negotiation, methods, embedding.
    - [Queries over HTTP](extensions/exposition/query.md) — criteria, ranges, projections.
    - [Identity](extensions/exposition/identity.md) — basic auth, identity federation (OIDC),
      passkeys (WebAuthn), one-time passwords.
    - [Access Control](extensions/exposition/access.md) — authorization directives and policies;
      roles and rules.
    - [Cache Control](extensions/exposition/cache.md).
    - [Octets](extensions/exposition/octets.md) — file uploads, downloads, and processing.
    - [I/O and Throttling](extensions/exposition/io.md) — decentralized rate limiting.
25. **[Configuration](extensions/configuration.md)** — declarative configuration with secrets.
26. **[State](extensions/state.md)** — transactional multi-entity state manipulation.
27. **[Stash](extensions/stash.md)** — shared cache and the distributed lock manager.
28. **[Storages](extensions/storages.md)** — shared BLOB storage; MIME detection and validation;
    file system, Amazon S3, and Cloudinary providers.
29. **[Origins](extensions/origins.md)** — governed external communications: HTTP, AMQP,
    Google Pub/Sub.
30. **[Realtime](extensions/realtime.md)** — pushing events to clients.
31. **[Telemetry](extensions/telemetry.md)** — structured logs and distributed tracing.
32. **[Mail](extensions/mail.md)** — sending email.

### Part VII. Operations

*Running Toa systems in production.*

33. **[Deployment](operations/deployment.md)**
    — standardized containerization; multi-arch images; one-command Helm deployment
    to Kubernetes; the deployment pipeline in detail.
34. **[Infrastructure and Environments](operations/environment.md)**
    — standalone infrastructure configuration; environment variables; resource management.
35. **[Day-2 Operations](operations/day2.md)**
    — secrets management; remote container shell; observability in production;
    upgrade strategies.

### Appendices

- **[A. Glossary](appendix/glossary.md)** — every term defined in this book, in one place.
- **[B. Manifest Reference](appendix/manifest.md)** — exhaustive schema of `manifest.toa.yaml`
  and `context.toa.yaml`.
- **[C. Design Rationale](appendix/rationale.md)** — notable design decisions and
  the reasoning behind them.
