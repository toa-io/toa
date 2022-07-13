# Common Connector Solutions

## URI Set Context Annotation

Declaration of a set of hosts, matching exact components, namespaces with a default value for
non-matched ones.

```yaml
something:
  default: host1
  namespace1: host2
  namespace1.component1: host3
  namespace2.component2: host4
```

See the [schema](src/uris/.construct/schema.yaml).

### Concise Declaration

Next two declarations are equivalent.

```yaml
something: host1
```

```yaml
something:
  default: host1
```

### Usage

```javascript
const { uris } = require('@toa.io/libraries/connectors')

const annotation = uris.construct(declaration)
const url = resolve(annotation, locator)
```

See [types](types/uris.d.ts) and [tests](test/uris.test.js) for details.

### Custom Extensions

Packages using URI Set Annotation may use or require additional properties.
See [Custom Extensions Deployment](#custom-extensions-deployment) below.

## Pointer

Pointer builds URL for a given locator, protocol and a package prefix. Prefix must be unique value
for a given package conforming [label format](#) (ex.: `bindings-ampq`).

See [types](types/pointer.d.ts) and [tests](test/pointer.test.js) for details.

### Local Environment

If `TOA_ENV` is `local` then these values are used:

| Property | Value       |
|----------|-------------|
| hostname | `localhost` |
| username | `developer` |
| password | `secret`    |

> In the local environment there is no way to provide non-default values for `protocol` or `port`.

## Deployment

Deployment function builds a set of proxies corresponding the [URI Set](#uri-set-context-annotation)
and the [package prefix](#pointer), and a global[^1] variable containing URI Set.

See [types](types/deployment.d.ts) and [tests](test/deployment.test.js) for details.

[^1:] [#174](https://github.com/toa-io/toa/issues/174)

### Secrets

Values for `username` and `password` requires corresponding secrets to be deployed. Secret names are
following the convention: `toa-package-prefix-namespace-name` and `key` names match corresponding
URL properties (`username` and `password`).

#### Example

```shell
$ toa conceal bindings-amqp-default username admin
$ toa conceal bindings-amqp-default password iluvtests
```

### Custom Extensions Deployment

For each custom extension additional proxy will be deployed.

#### Example

AMQP binding is a systematic binding used by the runtime. That is a system proxy must be deployed
and compositions require variables to establish connection through that proxy.

Therefore, AMQP binding declares a `system` extension and deployment function declares additional
proxy `bindings-amqp-system`.

See [`toa conceal`](../../runtime/cli/readme.md#conceal).
