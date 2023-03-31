## Toa Queues Storage

Stores entities as published messages.

> At this time, only the RabbitMQ broker is supported.

## Properties

Queues storage properties can declare an exchange or queue name to which messages should be
published. The `@toa.io/storages.queues` property can be used with the `exchange` attribute to
specify the exchange name or the `queue` attribute for the queue name:

```yaml
# component.toa.yaml
properties:
  "@toa.io/storages.queues":
    exchange: exchange_name
```

Alternatively, a well-known shortcut `queues` is available, which allows you to declare the exchange
or queue name in a more concise way:

```yaml
# component.toa.yaml
queues:
  queue: queue_name
```

> ![Not Implemented](https://img.shields.io/badge/Not_Implemented-red)<br>
> Publishing to a queue is not implemented.

The default property is `exchange`:

```yaml
# component.toa.yaml
queues: exchange_name
```

## Annotations

Broker addresses must be declared using [Pointer](/libraries/pointer) annotation.

```yaml
# context.toa.yaml
annotations:
  "@toa.io/storages.queues":
    dummies.dummy: amqps://host0
```

Well-known shortcut `queues` is available and
the [connection sharding](https://github.com/toa-io/comq#sharded-connection) is supported:

```yaml
# context.toa.yaml
queues: amqps://host{0-2}
```
