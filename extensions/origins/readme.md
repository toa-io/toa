# Toa Origins

External communications with permissions over supported protocols (HTTP and AMQP).

## TL;DR

```yaml
# manifest.toa.yaml
name: dummy
namespace: dummies

origins:
  docs: http://www.domain.com/docs/
  queues: ~
```

```javascript
async function transition (input, object, context) {
  await context.http.docs.example.get() // GET http://www.domain.com/docs/example
  await context.amqp.queues.emit('something_happened', { really: true })

  // direct Aspect invocation
  await context.aspects.http('docs', 'example', { method: 'GET' })
  await context.aspects.http('http://api.example.com', { method: 'GET' })
}
```

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    queues: amqps://amqp.azure.com
```

## HTTP Aspect

Aspect invocation function
signature: `async (origin: string, rel: string, reuest: fetch.Request): Response`

- `origin`: name of the origin in the manifest
- `rel`: reference to a resource relative to the origin's value
- `request`: `Request` object

### Absolute URLs

`async (url: string, request: fetch.Request): fetch.Response`

Requests to arbitrary URLs can be implemented with overloaded direct Aspect invocation.

By default, requests to arbitrary URLs are not allowed and must be explicitly permitted by setting
permissions in the [Origins annotation](#context-annotation).

```javascript
// Node.js bridge
async function transition (input, object, context) {
  await context.aspects.http('https://api.domain.com/example', { method: 'POST' })
}
```

## AMQP Aspect

Uses [ComQ](https://github.com/toa-io/comq), thus, provides interface of `comq.IO` restricted
to `emit` and `request` methods.

## Google Pub/Sub Aspect

[Google Pub/Sub](https://cloud.google.com/pubsub) client.

```javascript
async function transition (input, object, context) {
  await context.pubsub.publish('topic', { message: 'Hello, World!' })
}
```

Messages are batched with a maximum delay of 1 second.

### Pub/Sub credentials

Google Pub/Sub [URL](#context-annotation) must follow the following format:

```yaml
my-topic: pubsub://{emulator_host?}/projects/{project}/topics/{topic}
```

> Messages are published using JSON serialization.

For each `project`,
a secret `TOA_ORIGINS_PUBSUB_{project}`
with [ADC](https://cloud.google.com/docs/authentication/application-default-credentials) must be
deployed.

## Manifest

`origins` manifest is a [Pointer](/libraries/pointer) with origin names as keys.
Its values can be overridden by the context [annotation](#context-annotation).
If the value is `null`, then it _must_ be overridden.

### `null` manifest

To enable the extension for a component that uses arbitrary URLs without any specific origins to
declare, the Origins manifest should be set to `null`.

```yaml
# manifest.toa.yaml
origins: ~
```

## Context annotation

The `origins` annotation is a set of Pointers defined for the corresponding components.
The values of each pointer override the values defined in the manifest.

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    queues: amqps://amqp.azure.com
```

### HTTP URL permissions

The rules for arbitrary HTTP requests are stored in the `http` property of the corresponding
component as an object.
Each key in the rules object is a regular expression that URLs will be tested against, and each
value is a permission — either `true` to allow the URL or `false` to deny it.
In cases where a URL matches multiple rules, denial takes priority.

> The `null` is a special key that represents any URL.

#### Example

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    http:
      /^https?:\/\/api.domain.com/: true
      /^http:\/\/sandbox.domain.com/@staging: true  # `staging` environment
      /.*hackers.*/: false                          # deny
      ~: true                                       # allow any URL
```

## Deployment

Each key of the annotation is deployed as a Pointer with ID
following `origins-{component}-{origin}` with dots replaced by dashes.
This means credentials for the declared origins must be deployed as follows:

```yaml
# context.toa.yaml
origins:
  dummies.dummy:
    queues: amqp://rmq.example.com
```

```shell
$ toa conceal origins-dummies-dummy-queues username=developer password=secret
```
