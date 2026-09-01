# Toa Stash

Shared cache on top of [ioredis](https://github.com/redis/ioredis).

## Shared cache

`stash` aspect exposes [`ioredis` methods](https://redis.github.io/ioredis/classes/Cluster.html).

```javascript
async function computation (input, context) {
  await context.stash.set('key', 'value')
  await context.stash.get('key')
}
```

Keys are component-scoped, meaning that the underlying Redis keys are `namespace:name:key`.

### Storing objects

`async store (key: string, value: object, ...args: Array<string | number>)`

`async fetch (key: string): object`

`...args` are the [arguments of `set`](https://redis.github.io/ioredis/classes/Cluster.html#set)
starting from third.

Values are encoded using [msgpack](https://msgpack.org).

## Manifest

To enable extension for a component, add `null` definition to its manifest:

```yaml
stash: ~
```

## Deployment

`stash` context annotation is a [Pointer](/libraries/pointer) with ID `stash`.

```yaml
stash: # shortcut is available
  .: redis://redis.example.com
  dummies.dummy: redis://dummies.redis.example.com
```

Neither password authentication nor TLS are implemented.
[#367](https://github.com/toa-io/toa/issues/367)
