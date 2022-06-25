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

- Components must be reusable in different contexts and deployment environments, that is in different configurations.
- Some algorithm parameters must be deployed secretly.

## Definitions

### Configuration (Distributed System Configuration)

Set of static[^1] parameters for all algorithms within a given system.

### Component Configuration

Schema defining component's algorithms parameters (optionally with default values).

### Configuration Object

Value valid against Component Configuration.

### Context Configuration

Map of Configuration Objects for components added to a given context.

## Responsibility Segregation

Component Configuration is a schema defining the *form* of configuration. Specific *values* for this schema are
defined by Context Configuration.

## Component Configuration

Component Configuration is declared as a component extension using JSONSchema `object` type.

> ![Warning](https://img.shields.io/badge/Warning-yellow)<br/>
> By introducing non-backward compatible changes to a Component Configuration the compatibility with existent contexts
> and deployment environments will be broken. That is, Component Configuration changes are subjects of component
> versioning.

### Example

> Well-known shortcut `configuration` is available.

```yaml
# component.toa.yaml
domain: dummies
name: dummy

configuration:
  properties:
    foo:
      type: string
      default: 'baz'
    bar:
      type: number
  required: [foo]
```

### Concise Declaration

As it is known that Component Configuration is declared with a JSONSchema `object` type, any configuration declaration
without defined `properties` considered as concise. Properties of concise declaration are treated as required
configuration properties with the same type as its value type.

Next two declarations are equivalent.

```yaml
# component.toa.yaml
configuration:
  foo: baz
  bar: 1
```

```yaml
# component.toa.yaml
configuration:
  properties:
    foo:
      type: string
      default: baz
    bar:
      type: number
      default: 1
  required: [foo, bar]
```

### Local environment

Local environment configuration values may be created by `toa configure` command, which will prompt values for Component
Configuration.

<dl>
<dt><code>toa configure &lt;component&gt;</code></dt>
<dd>Upsert local environment configuration values (prompts for each).

<code>--reset</code> clear local configuration values<br/>
<code>--export</code> print local configuration values
</dd>
<dt><code>toa configure &lt;component&gt; &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Upsert local environment configuration value</dd>
</dl>

## Context Configuration

Context Configuration is declared as a context extension. Its keys must be component identifiers and its values must be
Configuration Objects for those components.

Context Configuration keys and Configuration Object keys may be defined with [deployment environment discriminators](#).

### Example

```yaml
# context.toa.yaml
configuration:
  dummies.dummy:
    foo: quu
    bar: 1
    bar@staging: 2
```

## Configuration Secrets

Context Configuration values which are uppercase strings prefixed with `$` considered as Secrets.

### Example

```yaml
# context.toa.yaml
configuration:
  payments.gateway:
    api-key: $STRIPE_API_KEY
```

### Secrets Deployment

Secrets are not being deployed with context deployment ([`toa deploy`](#)), thus must be deployed
separately once for each deployment environment manually ([`toa conceal`](#)).

<dl>

<dt><code>$ toa conceal</code></dt>
<dd>Finds all secrets declared in a context, prompts values for those which hasn't been deployed yet and 
deploys those keys with provided values.

<code>--reset</code> don't skip deployed secrets</dd>

<dt><code>$ toa conceal &lt;component&gt; &lt;key&gt; &lt;value&gt;</code></dt>
<dd>Checks if a given <code>key</code> is a declared secret and deploys it with a given <code>value</code>, overwrites if exists.</dd>

</dl>

## Operation Context

Component Configuration values are available as a well-known operation context extension `configuration`.

### Usage: node

```javascript
context.configiuration.foo
```

> ![Warning](https://img.shields.io/badge/Warning-yellow)<br/>
> It is strongly **not** recommended to store a copy of value type configuration values outside of operation scope, thus
> it prevents operation to benefit from [hot updates](#).
>
> ```javascript
> // THIS IS WEIRD, BAD AND NOT RECOMMENDED
> let foo
> 
> function transition (input, entity, context) {
>   if (foo === undefined) foo = context.configuration.foo
> 
>   // use foo
> }
> ```
> See [genuine operations](#).

## Appendix

- [Discussion](./docs/discussion.md)
- [Configuration consistency](./docs/consistency.md) has yet to be implemented.

[^1]: That is can’t be changed without a deployment. This is because new values considered to be a subject of
testing. [#146](https://github.com/toa-io/toa/issues/146)
