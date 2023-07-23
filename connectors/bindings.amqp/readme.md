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
