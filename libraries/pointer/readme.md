# Toa Pointer

The Pointer is a mechanism to deploy and resolve at runtime a set of URLs.
Used by [connectors](/connectors) and [extensions](/extensions).

## Annotation syntax

The Pointer annotation is an object whose keys are arbitrary dot-separated strings.
The meaning of these keys are defined in the corresponding module that unilizes the Poiner.

The values of the annotation object must be a URL or a list of URLs without credentials.

```yaml
something:
  one: amqp://all-dummies.rmq.example.com
  two:
    - amqp://rmq0.example.com
    - amqp://rmq1.example.com
```

If the Pointer annotation is a `string`, then its value is considered as default (`.`).

```yaml
mongodb: mongo://default.db.example.com
```

### Shards

Pointer values can contain [shards](/libraries/generic/readme.md#shards) syntax.

```yaml
something:
  one: redis://redis{0-2}.example.com
```

### Deduplication

Pointer values are [DNS-deduplicated](/libraries/dns/readme.md#deduplication).

### `default` namespace

When the Pointer is used for component-specific URLs and the component is in the `default`
namespace (that is, no `namepsace` is specified in its manifest), the annotation value must
explicitly contain the `default` namespace.

```yaml
amqp:
  # value for the `default` namespace
  default: amqp://default-ns.rmq.example.com
  # value for `teapots` component of the `default` namespace
  default.teapots: amqp://default-dummy.rmq.example.com
```

## Resolution

Although the most common use case of the Pointer is component-specific connection strings, where
the keys are namespaces or component IDs, it is not mandatory.
The Pointer considers keys as nested dot-separated alphanumeric strings.

A module that uses the Pointer, resolves a set of URLs by providing annotation and a set of
_selectors_ during deployment.
The resolution finds _the deepest match for a given dot-separated string_ within the annotation,
falling back to the default URL (`.` key) if no matches are found.

### Example

```yaml
# context.toa.yaml

amqp:
  .: amqp://default.rmq.example.com # default URL
  dummies: amqp://all-dummies.rmq.example.com # default URL for the `dummies` namespace
  dummies.dummy: amqp://dummies1.rmq.example.com # URL for the `dummies.dummy` component
```

URL resolution for the example above is as follows:

| Selector          | Result                               | Description        |
|-------------------|--------------------------------------|--------------------|
| `dummies.dummy`   | `amqp://d1.rmq.example.com`          | Exact match        |
| `dummies.another` | `amqp://all-dummies.rmq.example.com` | Partial match      |
| `what.ever`       | `amqp://default.rmq.example.com`     | No match (default) |

## Credentials

For security reasons, URL credentials cannot be specified in the annotation;
they must be deployed secretly.

Secret names must match the annotation keys with dots replaced by dashes and prefixed by an
identifier provided by the corresponding connector or extension using the Pointer.

### Example

Given the [AMQP binding](/connectors/bindings.amqp)
providing `amqp-context` Pointer identifier and the follwing annotation:

```yaml
# context.toa.yaml
amqp:
  context:
    .: amqp://default.rmq.example.com
    dummies: amqp://dummies.rmq.example.com
    dummies.dummy: amqp://dummy.rmq.example.com
```

Secret names for the specified keys are as follows:

- `amqp-context.default`
- `amqp-context-dummies`
- `amqp-context-dummies-dummy`

> If secrets are not deployed with the [`toa conceal`](/runtime/cli/readme.md#conceal), then their
> names must be prefixed with `toa-`.

Only one secret can be deployed per annotation key. Therefore, when using a URL set, all URLs will
utilize the same credentials.

### Plain

Secret's value for plain authentication must contain `username` and `password` keys.

```shell
$ toa conceal amqp-context-dummies-dummy username=developer password=secret
```

### TLS

Not implemented. [#367](https://github.com/toa-io/toa/issues/367)

## API

### Deployment

```typescript
import { createVariables } from '@toa.io/pointer'

// ...

const variables = createVariables(id, annotation, requests)
```

`id` is a Pointer identifier, `annotation` the Pointer annotation value, and `requests` is an array
of objects conforming to the following:

```yaml
# label of the component
label: string
# list of the annotation keys to be deployed for the component
selectors: string[]
```

### Resolution

```typescript
// runtime
import { resolve } from '@toa.io/pointer'

// resolve a set of URLs with credentials
// for a given pointer identifier and a selector
const urls = resolve(id, locator.id)
```
