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

Executes `routine` once a lock is successfully acquired. Lock ID is component-scoped.

```javascript
async function computation (input, context) {
  await context.stash.lock('lock id', () => console.log('Lock acquired'))
}
```

## Shared rate metering

`async meter(keys: string[], deltas: number[]): number[]`

Adds each delta to the debt on its key and answers what every process metering that key has reached
between them. Debt is counted in milliseconds and drains at a millisecond a millisecond, so a key
that is left alone returns to zero and expires on its own.

```javascript
async function computation (input, context) {
  const [debt] = await context.stash.meter(['alice'], [1000])
}
```

This is what a rate limiter needs and a counter cannot give it: debt is a duration, so processes
reporting it need not agree on the time — the clock is Redis' own — and it is additive, so each
process reports only its own increments, on its own schedule, and still reads back where the group
stands. A whole batch is metered by one script, because a limiter watches as many keys as it has
clients.

`io:throttle` of the [Exposition](/extensions/exposition/documentation/io.md#throttling) is built on
this.

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
