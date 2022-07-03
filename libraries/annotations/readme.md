# Common Context Annotations

## Proxy Set Annotation

Declaration of a set of hosts, matching exact components, namespaces with a default value for
non-matched ones.

```yaml
something:
  default: host1
  namespace1: host2
  namespace1.component1: host3
  namespace2.component2: host4
```

See the [schema](src/.proxy/schema.yaml).

### Concise Declaration

Next two declarations are equivalent.

```yaml
something: host1
```

```yaml
something:
  default: host1
```

### Custom extensions

Packages using Proxy Set Annotation may declare custom extensions for the declaration.
