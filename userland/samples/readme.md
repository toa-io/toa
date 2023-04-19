# Samples

## TL;DR

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764532091744292&cot=14">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./docs/sampling-dark.jpg">
        <img alt="4D" width="640" height="435" src="./docs/sampling-light.jpg">
    </picture>
</a>

See [features](/features/replay).

## Operation Samples

Sample is an object containing values of operation inputs (i.e.: request, context outputs and
current state) to be substituted and outcomes (reply, context calls, next state and events emission)
to be verified. See its [schema](./src/.replay/.suite/translate/schemas/operation.cos.yaml).

> Although `input` and `output` are declared as arbitrary values, they must conform to the
> corresponding operation schemas.

### Declaration

> Samples must be declared
> as [multi-document YAML files](https://yaml.org/spec/1.2.2/#22-structures).

Operation samples must be located under the `samples` directory in the component or context root.
Sample file names must follow the convention: `namespace.name.operation.yaml`, that is, be an
endpoint of the operation samples to be applied to. For component-level sample files `namespace`
and `name` must match corresponding component, therefore are optional.

## Message Samples

Message Sample is an object containing receiver's input (`payload`) to be substituted and
outcomes (`input` and `query`) to be verified. Message sample may contain corresponding operation
sample. See its [schema](./src/.replay/.suite/translate/schemas/message.cos.yaml).

> Message samples are always [autonomous](#autonomy).

### Declaration

Operation samples must be located under the `samples/messages` directory in the component or context
root. Samples file names must follow the convention `namesace.component.event.yaml`, that is, be a
label
of the event receiver is consuming.

## Autonomy

Component level samples are *autonomous*, namely, does not assume actual remote calls as
replaying of component-level samples will boot only that component. Remote call attempt not declared
within sample will cause an exception.
See [examples](../example/components/math/calculations/samples).

For context level samples (integration samples), remote calls with non-declared outputs will be
actually performed. Replaying these samples will boot the composition with all components of the
context (so as required extensions). See [examples](../example/samples).

> Integration samples are more flexible and less sensitive to implementation details.

## Replay

Samples may be *replayed* using [`toa replay`](/runtime/cli/readme.md#replay) command.

> Replaying samples requires local deployment environment.
