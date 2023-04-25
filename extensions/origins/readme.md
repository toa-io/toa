# Toa Origins

Enables external communications over supported protocols (HTTP and AMQP).

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
  // direct Aspect invocation
  await context.aspects.http('docs', './example', { method: 'GET' })

  // shortcuts
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

`origins` manifest is an object with origin names as keys an origin URLs as values.
Component's `origins` manifest can be overridden by the Context `origins` annotation.

### Sharded Connections

Origin value may contain [shards](/libraries/generic/readme.md#shards) placeholders.

### Environment Variables

Origin value may contain environment variable placeholders.

```yaml
# manifest.toa.yaml
origins:
  foo@dev: stage${STAGE_NUMBER}.stages.com
```

This is only usable on local development environment.

## HTTP Aspect

Uses [node-fetch](https://github.com/node-fetch/node-fetch) and returns its result.

Aspect invocation function
signature: `async (origin: string, rel: string, reuest: fetch.Request): fetch.Response`

- `origin`: name of the origin in the manifest
- `rel`: relative reference to a resource
- `request`: `Request` form `node-fetch`

### Absolute URLs

Requests to arbitrary URLs can be implemented with overloaded direct Aspect invocation.

`async (url: string, request: fetch.Request): fetch.Response`

By default, requests to arbitrary URLs are not allowed and must be explicitly permitted by setting
permissions in the Origins Annotation.

The Rules object is stored in the `.http` property of the corresponding component. Each key in the
Rules object is a regular expression that URLs will be tested against, and each value is a
permission — either `true` to allow the URL or `false` to deny it. In cases where a URL matches
multiple rules, denial takes priority.

> The `null` key is a special case that represents "any URL".

#### Example

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    .http:
      /^https?:\/\/api.domain.com/: true
      /^http:\/\/sandbox.domain.com/@staging: true  # staging environment
      /.*hackers.*/: false                          # deny rule
      ~: true                                       # allow any URL
```

```javascript
// Node.js bridge 
async function transition (input, object, context) {
  await context.aspects.http('https://api.domain.com/example', { method: 'POST' })
}
```

#### `null` manifest

To enable the extension for a component that uses arbitrary URLs without any specific origins to
declare, the Origins manifest should be set to `null`.

```yaml
# manifest.toa.yaml
origins: ~
```

## AMQP Aspect

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
