# Sample Replay

## TL;DR

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764532091744292&cot=14">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./.replay/sampling-dark.jpg">
        <img alt="4D" width="640" height="435" src="./.replay/sampling-light.jpg">
    </picture>
</a>

## Sample

Sample is an object containing values of operation inputs (context and initial state) to be replaced
and outcomes (reply and transient state) to be verified.

Sample may be *incomplete*, namely, not contain some or any of context inputs. It this case real
interaction will be performed unless sample is not defined as *autonomous*. Autonomous samples are
expected to be complete, that is, if operation will perform context interaction not described in a
sample, an exception will be thrown.

## UI extension

Sampling extends UI Request with `sample` property which is an object confirming
the [schema](../src/sample.cons.yaml).

## Core Decorators

Sampling provides a set of [core decorators](#) to replace operation inputs and verify outputs.

Decorators use sample from common shared [async storage](#), that is, a *sampling context*.

### Component Decorator

If invocation request contains `sampling` extension, Sampling Component Decoration setups sampling
context, invokes operation and validates reply.
