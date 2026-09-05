# Toa: Composable Application Runtime

**Execution environment for low-code, eventually consistent, optionally distributed systems.**

Toa is built around **product–platform separation**. Application code defines the product: its
business state, behavior, contracts, and integrations. The runtime provides the platform machinery
required to execute it. This allows different products to be built on the same execution model
without rebuilding that machinery inside each one.

Toa is **opinionated**. Every choice exposed to an application developer requires understanding
the problem behind it, even when the setting itself looks small. The runtime takes responsibility
for making some of those decisions, including where several approaches are reasonable and none
is clearly superior. Choosing one keeps that problem from becoming something every application
developer has to resolve again.

## Motivation

Most of the code in a typical backend service is not business logic.
It is transport, serialization, validation, concurrency control, state persistence, retries,
service discovery, configuration, authentication — the same machinery, rewritten in every service,
entangled with the logic that actually matters.

Toa inverts this ratio.
An application developer writes *operations* — small, pure functions expressing business logic —
and *declares* everything else: data schemas, communication endpoints, HTTP resources,
access policies, storage requirements.

```typescript
export async function transition (input, object: Order) {
  object.status = 'approved'
}
```

The runtime provides the machinery: it persists state with concurrency control,
transmits requests and events reliably across processes and protocols, validates messages,
discovers services, exposes HTTP APIs, and deploys the whole system to Kubernetes with one command.

The result is a system where a service is often a handful of one-liner functions and a YAML
manifest — yet runs as a set of independently scalable, fault-tolerant processes with
eventual consistency guarantees.

## Contents

Parts 1 to 7 are read in order: each assumes the ones before it. Reference is looked up.
Extending is for whoever writes a part of the runtime rather than an application.

1. [Start](1-start/readme.md) — from nothing to a running call
   - [Concepts](1-start/01-concepts.md) — what are the building blocks?
   - [Installation](1-start/02-install.md) — what has to be installed, and how is `toa` obtained?
   - [First application](1-start/03-first-app.md) — how is a minimal application written, run
     and called?
   - [Layout](1-start/04-layout.md) — how is an application repository laid out?
2. [Components](2-components/readme.md) — declaring and implementing one component
   - [Manifest](2-components/01-manifest.md) — how is a component declared?
   - [Entity](2-components/02-entity.md) — how is the state a component owns declared?
   - [Operations](2-components/03-operations.md) — how is an operation declared?
   - [Implementation](2-components/04-implementation.md) — how are operations written in Node.js?
   - [Request and reply](2-components/05-request-reply.md) — what does an operation receive, and
     what does it return?
   - [Calls](2-components/06-calls.md) — how does a component call another?
   - [Events](2-components/07-events.md) — how does a state change become an event?
   - [Receivers](2-components/08-receivers.md) — how does a component react to another's events?
   - [Guards](2-components/09-guards.md) — how is an invariant enforced on every state change?
   - [Consistency](2-components/10-consistency.md) — what is guaranteed between components, and
     what must the code tolerate?
   - [Prototype](2-components/11-prototype.md) — what does every component inherit, and how is
     that changed?
   - [TypeScript](2-components/12-typescript.md) — how is a component written in TypeScript?
3. [Application](3-application/readme.md) — declaring the whole system
   - [Context](3-application/01-context.md) — how is the application declared?
   - [Compositions](3-application/02-compositions.md) — how are components grouped into
     deployable units?
   - [Connectors](3-application/03-connectors.md) — how are bindings, storages and bridges chosen
     and connected?
   - [Configuration](3-application/04-configuration.md) — how do configuration and secrets reach
     a component?
   - [Outbox](3-application/05-outbox.md) — how is event delivery guaranteed?
4. [HTTP](4-http/readme.md) — the exposition extension
   - [Resources](4-http/01-resources.md) — how are operations exposed over HTTP?
   - [Authentication](4-http/02-authentication.md) — how do callers prove who they are?
   - [Authorization](4-http/03-authorization.md) — how is it decided who may call what?
   - [OAuth](4-http/04-oauth.md) — how does the application act as an OAuth 2.1 authorization
     server?
   - [Traffic](4-http/05-traffic.md) — how are requests and responses shaped: cache, throttle,
     CORS, redirects, stubs?
   - [Files](4-http/06-files.md) — how are files stored, uploaded and served?
   - [RPC and MCP](4-http/07-rpc-and-mcp.md) — how are operations called as procedures or as
     tools?
5. [Extensions](5-extensions/readme.md) — other capabilities a component switches on
   - [Cadence](5-extensions/01-cadence.md) — how does an operation run on a schedule, or later?
   - [Stash and state](5-extensions/02-stash-and-state.md) — how is transient data kept, shared
     or per instance?
   - [Atomicity](5-extensions/03-atomicity.md) — how do replicas decide something together?
   - [Realtime](5-extensions/04-realtime.md) — how are events pushed to clients?
   - [Fetch](5-extensions/05-fetch.md) — how are external HTTP services called?
6. [Workflow](6-workflow/readme.md) — the daily loop
   - [Running](6-workflow/01-run.md) — how does the application run locally?
   - [Testing](6-workflow/02-test.md) — how are components and the application tested?
   - [Observing](6-workflow/03-observe.md) — how is what the application does seen?
7. [Deploy](7-deploy/readme.md)
   - [Building](7-deploy/01-build.md) — how are images built and published?
   - [Deploying](7-deploy/02-deploy.md) — how is the application deployed to Kubernetes?
   - [Upgrading](7-deploy/03-upgrade.md) — how is the runtime moved to a newer version?
8. [Reference](8-reference/readme.md) — looked up, not read
   - [Manifest](8-reference/manifest.md) — every `manifest.toa.yaml` key
   - [Context](8-reference/context.md) — every `context.toa.yaml` key and annotation
   - [Context object](8-reference/context-object.md) — every member of `context`
   - [Query](8-reference/query.md) — the Query fields and the criteria grammar
   - [Exceptions](8-reference/exceptions.md) — every exception code
   - [CLI](8-reference/cli.md) — every `toa` command and option
   - [Environment](8-reference/environment.md) — every environment variable the runtime reads
   - [Ports](8-reference/ports.md) — the TCP ports reserved
   - [Glossary](8-reference/glossary.md) — every term, in one line
9. [Extending](9-extending/readme.md) — for whoever writes a part of the runtime
   - [Extensions](9-extending/01-extensions.md) — how is an extension written?
   - [Connectors](9-extending/02-connectors.md) — how is a storage, a binding or a bridge
     written?
