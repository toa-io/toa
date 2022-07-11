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

### Deployment Environment

Maps environment variables to URL properties using
convention `TOA_PACKAGE_PREFIX_NAMESPACE_NAME_VARIABLE`, where `VARIABLE` can be:
`USERNAME`, `PASSWORD`, `PROTOCOL` or `PORT`.

See [Deployment](#deployment) for details.

### Local Environment

If `TOA_ENV` is `local` then these values are used:

| Property | Value       |
|----------|-------------|
| hostname | `localhost` |
| username | `developer` |
| password | `secret`    |

> In the local environment there is no way to provide non-default values for `protocol` or `port`.

## Deployment

Deployment function builds a set of proxies and variables corresponding to the given set of context
dependency instances, the [URI Set](#uri-set-context-annotation) and
the [package prefix](#pointer).

See [types](types/deployment.d.ts) and [tests](test/deployment.test.js) for details.

### Secrets

Values for `PROTOCOL` and `PORT` variables are being extracted from URI Set and deployed,
while `USERNAME` and `PASSWORD` requires corresponding secrets to be deployed. Secret names are
following the convention: `toa-package-prefix-namespace-name` and `key` names match corresponding
URL properties (`username` and `password`).

#### Example

```shell
$ toa conceal bindings-amqp-default username admin
$ toa conceal bindings-amqp-default password iluvtests
```

### Custom Extensions Deployment

For each extension additional proxy will be declared and [system variables](#) will be mapped.

#### Example

AMQP binding is a systematic binding used by the runtime. That is a system proxy must be deployed
and compositions require variables to establish connection through that proxy.

Therefore, AMQP binding declares a `system` extension and `deployment` function of this package
declares additional proxy `bindings-amqp-system` and a set of system
variables: `TOA_BINDINGS_AMQP_SYSTEM_PROTOCOL`, `TOA_BINDINGS_AMQP_SYSTEM_PORT`,
`TOA_BINDINGS_AMQP_SYSTEM_USERNAME` and `TOA_BINDINGS_AMQP_SYSTEM_PASSWORD`.

See [`toa conceal`](../../runtime/cli/readme.md#conceal).
