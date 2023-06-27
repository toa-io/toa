# Toa Stash

Shared cache and distributed lock manager on top of [ioredis](https://github.com/redis/ioredis)
and [redlock](https://github.com/mike-marcacci/node-redlock).

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

## Distributed lock manager

`async lock<T>(id: string | string[], routine: async? () => T): T`

Executes `routine` once a lock is succesively acquired. Lock ID is component-scoped.

```javascript
async function computation (input, context) {
  await context.stash.lock('lock id', () => console.log('Lock acquired'))
}
```

## Manifest

To enable extension for a component, add `null` definition to its manifest:

```yaml
stash: ~
```

## Deployment

`stash` context annotation is a [Pointer](/libraries/pointer)-like.

```yaml
stash: # shortcut is available
  default: redis://redis.example.com
  dummies.dummy: redis://dummies.redis.example.com
```

Neither Password Authentication nor TLS are implemented.
[#367](https://github.com/toa-io/toa/issues/367)
