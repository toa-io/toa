# Components and compositions as a unified replacement for microservices and monoliths

.. intro ..

I've built dozens of distributed systems and managed dozens of teams and products, ranging from "simple" monoliths to complex global geo-distributed systems.

## Dream of evolution

In practice, monoliths cannot be broken into microservices in any reasonable way, due to tightly coupled data structures leaked into the code.

## Physical and logical boundaries

It's not about the code. `IUsers.get()` is the same in both cases.
It's about clear and strict boundaries.

.. diagram ..

## Components

A set of operations with a shared Entity. It's a class. It's a logical boundary with no deployment concerns.

## Strong isolation

A component exclusively manages one responsibility, which is typically a persistent state of an Entity.

As a Resource in REST, an Entity can be virtual (e.g. email — there is no persistent state, yet you manage responsibility exclusively).

## Uniform components

I haven't seen any Dockerfile or Helm chart in years. It's a one-time investment.

## Compositions

A set of components with shared resources. It's a unit of deployment.

Monoliths vs. microservices is not a developer's choice. It's a deployment environment configuration.

The same product can be run as a monolith in the development environment, as microservices in staging, and mixed (for very specific reasons inferred from experience) in production.

## Isolation of concerns

- Third-party dependencies that may affect reliability and performance
- Asynchronous aggregations (batching, etc.)
- Individual deployment requirements (hardware, runtime environment, security, etc.)
