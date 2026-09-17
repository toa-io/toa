# Toa AMQP binding

AMQP asynchronous binding on top of [ComQ](/libraries/comq).

## Annotation

```yaml
amqp:
  context:
    .: amqp://com.example.com
    dummies.dummy: amqp://dummmy.example.com
  sources:
    somewhere: amqp://queues.somewhere.com
```

Context annotaition is a [Pointer](/libraries/pointer) with `amqp-context` ID.

Sources annotation is a set of Pointers, declared by components consuming foreign events.
Each Pointer ID is as follows: `amqp-sources-{source}`.

## Names

A process given `TOA_SUFFIX` declares every exchange and queue under `<context><suffix>.`, so
processes of one context with different suffixes share a virtual host without seeing each other's
messages. Without one, names are unchanged. See
[deployment](/documentation/deployment.md#several-processes-of-one-context-on-shared-infrastructure).

The exchange a receiver with a `source` consumes is under the scope as every other name is, while
whoever publishes those events names it without one, so a process under a suffix receives no
foreign event.
