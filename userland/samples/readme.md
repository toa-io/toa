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
Sample file names must follow the convention: `namespace.component.operation.yaml`, that is, be an
endpoint of the operation samples to be applied to. For component-level sample files `namespace`
and `name` must match corresponding component, therefore are optional.

## Message Samples

Message Sample is an object containing receiver's input (`payload`) to be substituted and
outcomes (`input` and `query`) to be verified. Message sample may contain the corresponding
operation
sample. See its [schema](./src/.replay/.suite/translate/schemas/message.cos.yaml).

> Message samples are only supported at [context level](#autonomy).

### Declaration

Operation samples must be located under the `samples/messages` directory in the component or context
root. Samples file names must follow the convention `namesace.component.event.yaml`, that is, be a
label of the event receiver is consuming.

#### Aspect Shortcuts

- `configuration` for [Configuration](/extensions/configuration)
- `state` for [State](/extensions/state)
- `http` for HTTP Aspect from [Origins](/extensions/origins)

#### Aspect Result Type Hints

When using aspect calls, there might be situations where the returned values cannot be adequately
described using YAML.
To address this issue, type hints can be used.

```yaml
state:
  values:Map:
    foo: 1
    bar: 2
```

In the code snippet above, the `state` Aspect returns a `values` field of type Map.

```yaml
state:
  values:Set: [foo, bar]
```

`sync` and `async` hints define functions:

```yaml
state:
  get:sync: foo
  request:async: bar
```

## Autonomy

Component level samples are *autonomous*, namely, does not assume actual remote calls as
replaying of component-level samples will boot only that component. Remote call attempt not declared
within sample will cause an exception.
See [examples](../example/components/math.calculations/samples).

For context level samples (integration samples), remote calls with non-declared outputs will be
actually performed. Replaying these samples will boot the composition with all components of the
context (so as required extensions). See [examples](../example/samples).

> Integration samples are more flexible and less sensitive to implementation details.

## Replay

### CLI

Samples may be replayed using [`toa replay`](/runtime/cli/readme.md#replay) command.

See [features](/features/cli/replay.feature).

### Framework

`async components(paths: string[], options?): boolean`

Replay component samples.

`async components(paths: string[], options?): boolean`

Replay context and its components' samples.

#### Options

<dl>
<dt><code><strong>id</strong>: string</code></dt>
<dd>Replay samples for a specified component</dd>

<dt><code><strong>integration</strong>: string</code></dt>
<dd>Replay samples for a specified component only</dd>
<dd></dd>

<dt><code><strong>operation</strong>: string</code></dt>
<dd>Replay samples for specified operation</dd>

<dt><code><strong>title</strong>: string</code></dt>
<dd>Replay samples with titles matching given regexp</dd>

</dl>

See [types](types/suite.d.ts).
