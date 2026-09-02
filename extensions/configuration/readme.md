# Toa Configuration

## TL;DR

### Define

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    type: object
    properties:
      foo:
        type: string
      bar:
        type: number
  defaults:
    foo: bar
    bar: 1
```

### Use

```javascript
function transition (input, entity, context) {
  const { foo, bar } = context.configuration

  // ...
}
```

### Override

```yaml
# context.toa.yaml
configuration:
  dummies.dummy:
    foo: qux          # override default value
    foo@staging: quux # deployment environment discriminator
    bar: $BAZ_VALUE   # secret
```

### Deploy secrets

```shell
$ toa conceal configuration BAZ_VALUE=$ecr3t
```

### Change at runtime

```http
POST /configuration/values/dummies.dummy/ HTTP/1.1
authorization: Token ...
content-type: application/yaml

configuration:
  foo: quux
  bar: 2
```

---

## Manifest

Component's configuration is declared using the `configuration` manifest, containing `schema`
and optionally `defaults` properties.

### Schema

Configuration schema is declared with [JSON Schema](https://json-schema.org).

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    type: object
    properties:
      foo:
        type: string
      bar:
        type: number
```

### Defaults

The default configuration value can be provided using the `defaults` property, which should
conform to the configuration schema.

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    type: object
    properties:
      foo:
        type: string
      bar:
        type: number
  defaults:
    foo: hello
    bar: 0
```

### Epoch

The configuration epoch of a component is the SHA-256 of its configuration schema, as
canonical JSON. A configuration object belongs to the epoch of the schema it was validated
against. A schema change is a new epoch.

## Annotation

A component's configuration can be overridden using the configuration context annotation.

```yaml
# context.toa.yaml
configuration:
  dummies.dummy:
    foo: bye
    bar: 1
    bar@staging: 2
```

The annotated object is deployed as the defaults of the component for its epoch, in place of
the manifest `defaults`.

Every key names a component except `resources`, which is the values service's own: it deploys
like any other and states what it may take. A component actually named `resources` is written
with its namespace, `default.resources` — the bare form is only shorthand for that.

```yaml
# context.toa.yaml
configuration:
  resources:
    cpu: [200m, 1000m]
    memory: [200Mi, 500Mi]
  dummies.dummy:
    foo: bye
```

## Secrets

Configuration values which are uppercase strings prefixed with `$` are considered as secrets.

```yaml
# context.toa.yaml
configuration:
  payments.gateway:
    api-key: $STRIPE_API_KEY
```

Secrets are not being deployed with context
deployment ([`toa deploy`](/runtime/cli/readme.md#deploy)), thus must be deployed separately at
least once for each deployment environment
manually ([`toa conceal`](/runtime/cli/readme.md#conceal)).

Deployed kubernetes secret's name is predefined as `configuration`.

```shell
$ toa conceal configuration STRIPE_API_KEY=xxxxxxxx
```

A secret is substituted in the component's process, from the variable
`TOA_CONFIGURATION__<NAME>` deployed to it. The values service holds and returns the
reference.

In the component, a secret is a `Secret` object: `unwrap()` returns the string, while
`toString()`, JSON and `util.inspect` give `<REDACTED>`.

```javascript
function transition (input, entity, context) {
  const key = context.configuration.apiKey.unwrap()

  // ...
}
```

A value a component reads as a secret is given as a reference: a plain string in its place
has no `unwrap`.

## Values

Configuration values are held by the `configuration.values` component, deployed as the
`configuration-values` service. The service is deployed with the variable
`TOA_CONFIGURATION_VALUES`: the epoch, the schema and the defaults of every component
declaring configuration.

```json
{
  "dummies.dummy": {
    "epoch": "3f2a…",
    "schema": { "type": "object", "properties": { "foo": { "type": "string" } } },
    "defaults": { "foo": "bye" }
  }
}
```

Configuration objects are immutable. Creating a configuration is creating a new object for
the component's current epoch; the latest object for a component and an epoch is the last
created one. Each object records its `originator`.

The configuration of a component for an epoch is:

1. The latest object created for the component and the epoch;
2. Otherwise, the deployed defaults, if the epoch is the deployed one;
3. Otherwise, none.

### Operations

- `get({ component, epoch? })`: the configuration with the schema it is checked against, as
  `{ configuration, schema, epoch }`, or `null` when there is none. The epoch is the deployed
  one when omitted; an epoch the deployment does not know has no `schema`.
- `fetch([{ component, epoch }])`: the same for several pairs at once, as
  `[{ component, epoch, configuration }]`.
- `list()`: every component's configuration for its deployed epoch, by component name, as
  `[{ component, epoch, schema, configuration }]`.
- `create({ component, configuration, originator })`: a new object for the component's
  deployed epoch. The configuration must satisfy the schema. Errors: `UNKNOWN_COMPONENT`,
  `INVALID_CONFIGURATION`.

Creating a configuration publishes the `configuration.values.created` event with the
object as stored.

### Resources

| Method | Path                                  | Role                          |
|--------|---------------------------------------|-------------------------------|
| `GET`  | `/configuration/values/`              | `system:configuration:get`    |
| `GET`  | `/configuration/values/:component/`   | `system:configuration:get`    |
| `POST` | `/configuration/values/:component/`   | `system:configuration:create` |

`GET /configuration/values/` lists every component's configuration for its deployed epoch, by
component name, as `[{ component, epoch, schema, configuration }]`.

`GET /configuration/values/:component/` returns `{ configuration, schema, epoch }` for the
deployed epoch, `404` when there is none.

`POST` takes `{ configuration }`, records the Identity as the `originator`, and returns
`{ id, epoch }`. A configuration not satisfying the schema, or an unknown component, is
`422`.

## UI

The values service serves a page listing the configured components and creating
configurations, mounted at `/.configuration` on port `8003`. Reading it needs the
`system:configuration:get` role, creating needs `system:configuration:create`.

The page is always published: unlike the introspection annotation, the configuration
annotation is the per-component values map and has nowhere to carry a switch.

## Aspect

Component's configuration values are available as a well-known Aspect `configuration`.

```javascript
function transition (input, entity, context) {
  const foo = context.configuration.foo

  // ...
}
```

On start, a component requests its configuration for its epoch from the values service and
waits until there is one, reporting every fifth attempt. The schema is applied, and secrets
are substituted. After a configuration is created, the running component receives the new
object and takes it when its `_created` is later than that of the value it holds.

### Local override

When the variable `TOA_CONFIGURATION_<NAMESPACE>_<NAME>` is set, the component's
configuration is the variable's value with the manifest `defaults` and the schema applied,
and the values service is not used.

```shell
$ TOA_CONFIGURATION_DUMMIES_DUMMY='{"foo":"local"}' toa run components/dummy
```
