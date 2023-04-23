# Toa Origins

Origins extension enables external communications over supported protocols (`HTTP` and `AMQP`).

## TL;DR

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

origins:
  website: http://www.domain.com/docs/
  messages: amqps://amqp.amazon.com
```

```javascript
// Node.js bridge 
async function transition (input, object, context) {
  await context.http.example.get() // GET http://www.domain.com/docs/example
  await context.amqp.emit('something_happened', { really: true })
}
```

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    messages: amqps://amqp.azure.com
    messages@staging: amqp://amqp.stage
```

## Declaration

Origins extension declaration is a [Pointer](/libraries/pointer). Declarations can be overridden by
the context annotations.

## HTTP

Uses [node-fetch](https://github.com/node-fetch/node-fetch) and returns its result.

## AMQP

Uses [ComQ](https://github.com/toa-io/comq), thus, provides interface of `comq.IO` restricted
to `emit` and `request` methods.

AMQP origins require credential secrets to be deployed. Secret's name must
follow `toa-origins-{namespace}-{component}-{origin}` and it must have keys `username`
and `password`.

### Example

```shell
# deploy credentials to the current kubectl context
$ toa conceal toa-origins-dummies-dummiy-messages username developer
$ toa conceal toa-origins-dummies-dummiy-messages password secret
```
