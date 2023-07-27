# Toa AMQP Binding

AMQP asynchronous binding on top of [ComQ](/libraries/comq).

## Deployment

AMQP deployment must be declared with
the [Pointer annotation](/libraries/pointer/readme.md#annotation). Either `system` or `default`
pointers must be defined.

Well-known annotation shortcut `amqp` is available.

```yaml
# context.toa.yaml
annotations:
  "@toa.io/bindings.amqp":
    system: url0          # the runtime
    default: url1         # all undeclared
    dummies: url2         # namespace-wide
    dummies.dummy1: url  # component exclusive
```

### Concise Declaration

Well-known shortcut `amqp` is available. The next two declarations are equivalent:

```yaml
# context.toa.yaml
annotations:
  "@toa.io/bindings.amqp":
    system: url0
    dummies: url1
```

```yaml
# context.toa.yaml
amqp:
  system: url0
  dummies: url1
```

`string` annotation value is considered as `default`. The next two declarations are equivalent:

```yaml
# context.toa.yaml
annotations:
  "@toa.io/bindings.amqp":
    default: url1
```

```yaml
# context.toa.yaml
amqp: url1
```

### Environment Variables

Then Connection string may contain `environment` variable placeholders.

```yaml
# manifest.toa.yaml
amqp:
  foo@dev: amqp://stage${STAGE_NUMBER}.stages.com:5672
```

This is only usable in local development environment.
