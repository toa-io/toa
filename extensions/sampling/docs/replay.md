# Sample Replay

## UI extension

Sampling extends UI Request with `sample` property which is an object confirming
the [schema](../src/sample.cos.yaml).

## Core Decorators

Sampling provides a set of [core decorators](#) to substitute operation inputs and verify outputs.

Decorators use sample from shared [async storage](https://nodejs.org/api/async_context.html), that
is, a *sampling context*.

### Component Decorator

If invocation request contains `sample` extension, Sampling Component Decoration creates a sampling
context, invokes operation and validates its reply if `output` is declared.

### Context Decorator

Context decorator validates context interactions[^1] inputs and substitutes outputs using sampling
context. If no output is provided, then an actual call is performed.

[^1]: local, remote or annexes calls

### State Decorator

State decorator substitutes current state provided as an input for operation. Samples
of `transitions` may declare a `next` state to validate the transition result. Samples
of `assignments` may declare an `update` to validate assignment changeset.
