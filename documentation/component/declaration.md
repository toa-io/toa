# Component Declaration

## Receivers

Receivers are bound to event labels using the `receivers` declaration section.

### Domestic Events

The following syntax binds a receiver to the `created` event emitted by the `orders` component of
the`store` namespace, with the processing operation `transit`:

```yaml
receivers:
  store.orders.created: transit
```

### Foreign Events

Domestic event declarations don't specify the bindings used to emit those events, so they will be
resolved by UI Discovery at startup. Therefore, events emitted by external applications that don't
support UI Discovery must have a binding declaration.

```yaml
receivers:
  external.orders.created:
    binding: amqp # avoid discovery
    operation: transit
```

This declaration requires that the Context must have the `external.orders` AMQP Pointer to resolve
the address of the broker to connect to.

### Event Sources

An arbitrary event label can be bound to a receiver with the following syntax:

```yaml
receivers:
  something_happened:
    binding: amqp
    source: import # AMQP Pointer annotation group in the Context
    operation: transit
  something_else_happened:
    binding: amqp
    source: import # consume from the same broker as previous
    operation: transit
```

As the event label doesn't conform to the standard event label format, UI Discovery can't resolve
the broker address to connect to. For this purpose, a `source` property must be declared with the
value corresponding to the Pointer group that must be defined in the Context.

> Declarations conforming the standard event label format implicitly define `source`
> as `{namespace}.{name}`.
