# Toa Configuration Extension

## TL;DR

### Define

```yaml
# component.toa.yaml
domain: dummies
name: dummy
configuration:
  foo: bar
  baz: 1
```

### Use

```javascript
function transition (input, entity, context) {
  const { foo, baz } = context.configuration

  // ...
}
```

### Override

```yaml
# context.toa.yaml
configuration:
  dummies.dummy:
    foo: qux
    foo@staging: quux # use deployment environment discriminator
    baz: $BAZ_VALUE   # use secrets
```

### Deploy secrets

```shell
$ toa conceal
```

---

## Problem Definition

- Components must be reusable in different contexts and deployment environments,
  that is in different configurations.
- Some algorithm parameters must be deployed secretly.

## Definitions

### Configuration (Distributed System Configuration)

Set of static[^1] parameters for all algorithms within a given system.

### Configuration Schema

Schema defining component's algorithms parameters (optionally with default
values).

### Configuration Object

Value valid against Configuration Schema.

### Configuration Value

Merge result of Configuration Schema's defaults and Configuration Object.

### Context Configuration

Map of Configuration Objects for components added to a given context.

## Responsibility Segregation

Configuration Schema is a *form* of configuration defined by component. Specific *values* for
specific contexts and deployment environments are defined by Context Configuration according to the
Schema.

See [Reusable Components](#).

## Configuration Schema

Configuration Schema is declared as a component extension
using [JSON Schema](https://json-schema.org) `object` type.

> ![Warning](https://img.shields.io/badge/Warning-yellow)<br/>
> By introducing non-backward compatible changes to a Configuration Schema the compatibility
> with existent contexts and deployment environments will be broken. That is, Configuration
> Schema changes are subjects of component versioning.

> ![Recommendation](https://img.shields.io/badge/Recommendation-green)<br/>
> Having default values for all required parameters will allow components to be runnable
> without configuration (i.e. on local environment).

### Example

```yaml
# component.toa.yaml
domain: dummies
name: dummy

extensions:
  @toa.io/extensions.configuration:
     properties:
       foo:
         type: string
         default: 'baz'
       bar:
         type: number
     required: [foo]
```

### Concise Declaration

As it is known that Configuration Schema is declared with a JSON Schema `object` type, any
configuration declaration without defined `properties` considered as concise. Properties of concise
declaration are treated as required configuration properties with the same type as its value
type and no additional properties allowed.

Also note that a well-known shortcut `configuration` is available.

Next two declarations are equivalent.

```yaml
# component.toa.yaml
configuration:
  foo: baz
  bar: 1
```

```yaml
# component.toa.yaml
extensions:
  @toa.io/extensions.configuration:
     properties:
       foo:
         type: string
         default: baz
       bar:
         type: number
         default: 1
     additionalProperties: false
     required: [foo, bar]
```

## Context Configuration

Context Configuration is declared as a context extension. Its keys must be
component identifiers and its values must be Configuration Objects for those
components.

Context Configuration keys and Configuration Object keys may be defined
with [deployment environment discriminators](#).

### Example

```yaml
# context.toa.yaml
configuration:
  dummies.dummy:
    foo: quu
    bar: 1
    bar@staging: 2
```

### Local environment

Configuration Objects for local environment may be created
by [`toa configure`](../../runtime/cli/readme.md#configure) command.

## Configuration Secrets

Context Configuration values which are uppercase strings prefixed with `$`
considered as Secrets.

### Example

```yaml
# context.toa.yaml
configuration:
  payments.gateway:
    api-key: $STRIPE_API_KEY
```

### Secrets Deployment

Secrets are not being deployed with context
deployment ([`toa deploy`](../../runtime/cli/readme.md#deploy)),
thus must be deployed separately once for each deployment environment
manually ([`toa conceal`](../../runtime/cli/readme.md#conceal)).

## Operation Context

Configuration Value is available as a well-known operation context extension `configuration`.

### Usage: node

```javascript
function transition (input, entity, context) {
  const foo = context.configiuration.foo

  // ...
}
```

> ![Warning](https://img.shields.io/badge/Warning-yellow)<br/>
> It is strongly **not** recommended to store a copy of value type configuration
> values outside of operation scope, thus it prevents operation to benefit
> from [hot updates](#).
>
> ```javascript
> // THIS IS WEIRD, BAD AND NOT RECOMMENDED
> let foo
> 
> function transition (input, entity, context) {
>   if (foo === undefined) foo = context.configuration.foo
> 
>   // ...
> }
> ```
> See [Genuine operations](#).

## Appendix

- [Discussion](./docs/discussion.md)
- [Configuration consistency](./docs/consistency.md)

[^1]: That is can’t be changed without a deployment. This is because new values
considered to be a subject of
testing. [#146](https://github.com/toa-io/toa/issues/146)
