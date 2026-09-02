# svas — advanced patterns

Idioms for non-trivial usage. All build on `Maybe<T> = null | T | Error` and the `ok()` guard.

## Derived `Maybe` stores

Compute one async store from others with `svelte/store`'s `derived`. Forward `null`/`Error` early, and return a cleanup function when you subscribe to linked entities.

```ts
const internal = collection<Item>({ get: () => api.get(), persist: 'items' })

export const items = derived<[typeof internal, typeof me], Maybe<Item[]>>(
  [list, me],
  ([$list, $me], set, update) => {
    if (!ok($list)) return set($list)   // forward loading/error verbatim
    if (!ok($me)) return set($me)

    const items = $list.map((i) => map(i, $me.id))
    set(items)

    // live updates: re-emit when a linked entity changes
    const unsubs = items.map((item) =>
      accounts.get(item.owner).subscribe((account) =>
        update((items) => {
          if (!ok(items) || !ok(account)) return items
          const i = items.findIndex((v) => v.owner === account.id)
          if (i < 0) return items
          items[i] = { ...items[i], account }
          return items
        })
      )
    )

    return () => unsubs.forEach((u) => u())   // cleanup on unsubscribe
  }
)
```

Key moves: `if (!ok(x)) return set(x)` to forward non-resolved states, `update()` for incremental edits, return a teardown for any subscriptions you open.

## Realtime event wiring

> Usually used with antcn/@realtime

Apply server events into stores with `sync` (collections/values-backed) or `.set` (standalone `values`). Mutating functions sync their own result so the optimistic and authoritative paths converge.

```ts
// collection backed by a values side store
events.on('todos.sync', (todo) => sync(todos, todo))

// standalone values map
events.on('accounts.sync', (a) => accounts.set(a.id, a))

export async function add(input: Input): Promise<Todo | Error> {
  const me = await having(account)        // wait for auth
  const res = await net.add(me.id, input)
  if (res instanceof Error) return res     // error as value
  sync(todos, res)                         // merge authoritative result
  return res
}
```

## Linked / enriched entities

Join a network type with domain data. Use `.extract()` for a sync snapshot at map time; subscribe via `.get()` inside derived stores for live enrichment.

```ts
export interface Contact extends net.Contact {
  account: Maybe<Account>
}

export function map(entry: net.Contact): Contact {
  return { ...entry, account: accounts.extract(entry.owner) }  // sync snapshot
}
```

Hold a `Maybe<T>` per link; never reach through it with `?.` — guard with `ok()` before use. For many links, `Record<string, Maybe<T>>` keyed by id.

## Optimistic updates with rollback

`values.set(key, v, { stash: true })` remembers the prior persisted value; `reset(key)` restores it if the request fails.

```ts
products.update(id, (product) => ({ ...product, ...properties }))

const res = await net.patch(id, properties)

if (res instanceof Error) return res
else sync(products, res)
```

## `ensure` vs `having`

- `ensure(store)` — **sync**, throws if `null`/`Error`. Use when the value must already exist (auth checks inside service functions called in response to user action).
- `await having(store)` — **async**, waits for a resolved value, rejects on `Error`. Use at init time when the value may still be loading (initial data fetching when app is starting).
