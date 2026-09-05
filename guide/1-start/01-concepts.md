# Concepts

An application on Toa is a set of components. A component owns state, exposes operations that
read or change it, and announces every change as an event other components receive. The runtime
carries the calls and the events, stores the state, and runs the components wherever the Context
deploys them. Every term below names one part of that sentence.

## Component

A **component** is a set of operations sharing one entity: a boundary drawn around one
responsibility, and nothing about deployment. It is declared in a
[manifest](../2-components/01-manifest.md) and identified by a namespace and a name,
`orders.pricing`. Its code is a directory of small modules beside the manifest.

## Entity

The **entity** is the state a component owns: a JSON Schema for one kind of object. The runtime
stores objects of it, gives each an id and a version, keeps timestamps, and never removes one: a
deleted object stays, marked. A component without an [entity](../2-components/02-entity.md) is
one that computes, and is as much a component as any other.

## Operation

An **operation** is a function the runtime calls with a request and, for most types, the current
state. Its type says what it does to that state: a *transition* changes one object, an
*observation* reads, an *assignment* changes many at once, a *computation* touches no state, an
*effect* has side effects. One module per [operation](../2-components/03-operations.md), named
after it; the name is the endpoint callers use.

## Request and reply

Every call carries the same shape: an `input` the operation's schema describes, and a `query`
selecting the state it acts on. What comes back is the output, or an error the operation declared
and returned. An exception is the runtime's answer, to invalid input, to a lost concurrent update,
to an unreachable component, and is never something an operation returns.
[Request and reply](../2-components/05-request-reply.md) states both.

## Event and receiver

A state change is an **event**, published with the change and never without it. A **receiver**
turns an [event](../2-components/07-events.md) of another component into a call of one of its
own operations. Events arrive at least once, so a
[receiver](../2-components/08-receivers.md) is written to be called again with the same event.

## Context

The **Context** is the application: `context.toa.yaml` names it, says where the broker and the
databases are, which components deploy together, and what differs between environments. Component
code knows nothing of the [Context](../3-application/01-context.md).

## `context`

The **`context`** is what an operation receives to reach anything outside itself: its own
operations and remote ones, configuration, logs, file storage, the extensions it switched on. A
component imports no Toa package; everything it needs is on `context`, as
[Implementation](../2-components/04-implementation.md) shows.

## Composition

A **composition** is a set of components deployed as one process: locally, everything in one; in
production, one component per pod or several in one, as the Context says. Nothing in the code
changes either way; [Compositions](../3-application/02-compositions.md) is a deployment
declaration.

## Connector

A **connector** is how the runtime reaches the outside on a component's behalf: a *binding*
carries calls and events (AMQP by default), a *storage* keeps the entity (MongoDB by default, or
SQL), a *bridge* runs the component's code (Node.js, or Bash). Each is named in a declaration and
replaced without touching an operation; [Connectors](../3-application/03-connectors.md) lists
them.

## Extension

An **extension** is a capability a component switches on with a manifest key: HTTP exposition,
configuration with secrets, calls on a schedule, file storage, realtime streams. Three are always
on: telemetry, introspection, and fetch. [HTTP](../4-http/readme.md) covers the first;
[Extensions](../5-extensions/readme.md) the rest.

---

[← Start](readme.md) · [Start](readme.md) · [Installation →](02-install.md)
