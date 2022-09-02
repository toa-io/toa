# Sample Replay

## UI extension

Sampling extends UI Request with `sample` property which is an object confirming
the [schema](../src/sample.cos.yaml).

## Core Decorators

Sampling provides a set of [core decorators](#) to replace operation inputs and verify outputs.

Decorators use sample from common shared [async storage](#), that is, a *sampling context*.

### Component Decorator

If invocation request contains `sample` extension, Sampling Component Decoration setups sampling
context, invokes operation and validates its reply.
