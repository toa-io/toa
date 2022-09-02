# Samples

## TL;DR

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764532091744292&cot=14">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./docs/sampling-dark.jpg">
        <img alt="4D" width="640" height="435" src="./docs/sampling-light.jpg">
    </picture>
</a>

See [features](./features).

## Sample

Sample is an object containing values of operation inputs (i.e.: context outputs and initial state)
to be replaced and outcomes (reply and transient state) to be verified. See
its [schema](./src/.suite/sample.cos.yaml).

> Note that although input and output are declared as arbitrary values, they must conform to the
> corresponding operation schemas.

## Declaration

Samples must be declared as [multi-document YAML files](https://yaml.org/spec/1.2.2/#22-structures)
located under the `samples` directory in the component or context root. Sample file names must
follow the convention: `namespace.name.operation.yaml`, that is, be an endpoint of the
operation samples to be applied to. For component-level sample files `namespace` and `name` must
match corresponding component, therefore are optional.

Component-level samples must be *complete*, namely, contain declaration of all context interaction
outputs that an operation is expected to preform. Replaying these samples will boot only
corresponding component. See [examples](../example/components/math/calculations/samples).

Context-level samples may be *incomplete*. Context interactions with non-declared outputs will be
actually performed. Replaying these samples will boot the composition of all components of the
context (so as required extensions). See [examples](../example/samples).

## Execution

Samples may be *replayed* using [`toa replay`](/runtime/cli/readme.md#replay) command.

> Replaying samples requires local deployment environment (e.g. RabbitMQ, databases, etc.).
