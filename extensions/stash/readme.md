# Toa Stash

Shared cache and distributed lock manager on top of [ioredis](https://github.com/redis/ioredis).

## Manifest

To enable extension for a component, add `null` definition to its manifest:

```yaml
extensions:
  '@toa.io/extensions.stash': ~
```

or as a shortcut:

```yaml
stash: ~
```

## Shared cache

`async put(key: string, value: any)`

`async get(key: string): any`

Keys are component-scoped, meaning that the underlying Redis keys are `namespace:name:key`.

```javascript
async function computation (input, context) {
  await context.stash.put('key', 'value')
  await context.stash.get('key')
}
```

## Distributed lock manager

`async lock(id: string, callback: async? () => void)`

Attempts to acquire a lock with the specified `id`.
If the lock is successfully acquired, the `callback` function is executed.
Once the execution of the `callback` is completed, the lock is released.

```javascript
async function computation (input, context) {
  await context.stash.lock('lock id', () => console.log('Lock aquired'))
}
```

## Deployment

Stash context annotation is a [Pointer](/libraries/pointer).

```yaml
stash: # shortcut is available
  default: redis://localhost
  dummies.dummy: redis://redis{0-3}:6379 # shard syntax is available for clusters
```
