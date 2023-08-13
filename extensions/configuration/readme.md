# Toa Configuration

## TL;DR

### Define

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    foo: string
    bar: number
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

---

## Problem Definition

- Components should be runnable in different deployment environments.
- Some algorithm's parameters should be deployed secretly.
- Components should be reusable in different contexts.

## Manifest

Component's configuration is declared using `configuration` manifest,
containing `schema` and optionnaly `defaults` properties.

### Schema

Configuration schema is declared with [COS](/libraries/concise).

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  $schema:
    foo: string
    bar: number
```

> Introducing non-backward compatible changes to a configuration schema will result in a loss of
> compatibility with existing contexts and deployment environments.
> Therefore, configuration schema changes are subject to component versioning.

### Defaults

The default configuration value can be provided using the `defaults` property, which should conform
to the configuration schema.

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    foo: string
    bar: number
  defaults:
    foo: hello
    bar: 0
```

#### Schema defaults hint

The configuration schema itself can contain default primitive values using the COS syntax.

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

configuration:
  schema:
    foo: hello
    bar: 0
```

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

## Secrets

Configuration annotation top-level values which are uppercase strings prefixed with `$` considered as secrets.

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

## Aspect

Component's configuration values are available as a well-known Aspect `configuration`.

```javascript
function transition (input, entity, context) {
  const foo = context.configiuration.foo

  // ...
}
```
