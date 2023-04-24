# Toa Origins

`origins` extension enables external communications over supported protocols (HTTP and AMQP).

## TL;DR

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

origins:
  docs: http://www.domain.com/docs/
  amazon: amqps://amqp.amazon.com
```

```javascript
// Node.js bridge 
async function transition (input, object, context) {
  await context.http.docs.example.get() // GET http://www.domain.com/docs/example
  await context.amqp.amazon.emit('something_happened', { really: true })
}
```

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    amazon: amqps://amqp.azure.com
    amazon@staging: amqp://amqp.stage
```

## Manifest

`origins` manifest is an object conforming declaring origin names as keys an origin URLs as values.

## HTTP

Uses [node-fetch](https://github.com/node-fetch/node-fetch) and returns its result.

## AMQP

Uses [ComQ](https://github.com/toa-io/comq), thus, provides interface of `comq.IO` restricted
to `emit` and `request` methods.

AMQP origins can have credential secrets deployed. Secret's name must
follow `toa-origins-{namespace}-{component}-{origin}` and it must have keys `username`
and `password`.

### Example

```shell
# deploy credentials to the current kubectl context
$ toa conceal toa-origins-dummies-dummiy-messages username developer
$ toa conceal toa-origins-dummies-dummiy-messages password secret
```
