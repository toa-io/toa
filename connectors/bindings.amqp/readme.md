# AMQP Binding

AMQP binding is asynchronous, broadcast and *systemic*, that is being used by the runtime.
See [Bindings](#).

## Deployment

AMQP binding requires RabbitMQ broker(s) available from the cluster. As AMQP is a systemic binding,
so at least one `system` or `default` broker must be provisioned.

### Declaration

AMQP deployment must be declared by [URI Set annotation](#) with a `system` extension, which value
must be the host of the broker to be used by the runtime. Either `system` or `default` hosts must be
defined.

```yaml
# context.toa.yaml
annotations:
  @toa.io/bindings.amqp:
     system: host0          # the runtime 
     default: host1         # all undeclared
     dummies: host2         # namespace-wide
     dummies.dummy1: host3  # component exclusive
```

### Concise Declaration

> Well-known shortcut `amqp` is available.

String annotation value is considered as `default`.

The next two declarations are equivalent.

```yaml
# context.toa.yaml
annotations:
  @toa.io/bindings.amqp:
     default: host1
``` 

```yaml
# context.toa.yaml
amqp: host1
``` 
