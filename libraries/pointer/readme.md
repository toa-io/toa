# Pointer

Library to declare, deploy and resolve URL to connect to at the runtime. Used by connectors.

## Pointer class

Pointer builds URL for a given locator, protocol and a package prefix. Prefix must be unique value
for a given package conforming [label format](#) (ex.: `bindings-ampq`).

### Constructor signature

<dl>
<dt><code>prefix</code></dt>
<dd><code>string</code> unique for each package</dd>
<dt><code>locator</code></dt>
<dd><code>toa.core.Locator</code> component for which Pointer is intended</dd>
<dt><code>options</code></dt>
<dd><code><a href="./types/pointer.d.ts">toa.pointer.Options</a></code> Pointer options</dd>
</dl>

### Local Environment

If `TOA_ENV` is `local` then these values are used:

| Property | Value       |
|----------|-------------|
| hostname | `localhost` |
| username | `developer` |
| password | `secret`    |

> In the local environment there is no way to provide values for `protocol` or `port`.

See [types](types/pointer.d.ts) and [tests](test/pointer.test.js) for details.

## Annotation

Declaration of a set of hosts, matching exact components, namespaces with a default value for
non-matched ones.

```yaml
something:
  default: protocol://host1
  namespace1: protocol://host2
  namespace1.component1: protocol://host3
  namespace2.component2: protocol://host4
```

See the [schema](source/uris/.construct/schema.yaml).

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
const { uris } = require('@toa.io/pointer')

const annotation = uris.construct(declaration)
const url = uris.resolve(annotation, locator)
```

See [types](types/uris.d.ts) and [tests](test/uris.test.js) for details.

### Custom Extensions

Packages using Pointer Annotation may use or require additional properties.
See [Deployment Extensions](#extensions) below.

## Deployment

Deployment function builds global[^1] variables: containing Annotation and a set of variables for
pointer credentials.

See [types](types/deployment.d.ts) and [tests](test/deployment.test.js) for details.

### Credentials

Each entry of the Annotation requires values for `username` and `password`. These values are being
deployed as global[^1] secret variables. Secret names are following the
convention: `toa-package-prefix-entry-label` and `key` names match corresponding URL
properties (`username` and `password`).

> Note that declaration is made of `Locator.id` while secret names contain `Locator.label`.
> See [Locator](#).

#### Example

```yaml
# context.toa.yaml
amqp:
  default: amqp://host0
  dummies.dummy: amqps://host1:5671
```

```shell
$ toa conceal bindings-amqp-default username=admin password=ibreakthings
$ toa conceal bindings-amqp-dummies-dummy username=developer password=iluvtests
```

See [`toa conceal`](../../runtime/cli/readme.md#conceal).

### Extensions

For each custom extension additional proxy is being deployed.

#### Example

AMQP binding is a systematic binding used by the runtime. That is a system proxy must be deployed
and compositions require variables to establish connection through that proxy.

Therefore, AMQP binding declares a `system` extension and deployment function declares additional
proxy `bindings-amqp-system`.

[^1]: [#174](https://github.com/toa-io/toa/issues/174)
