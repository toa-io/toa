---
name: svas
description: >
  Async Svelte stores (svas): fetching, caching, revalidation, persistence.
  Use when UI presents data from the API.
---

# svas — Svelte Async Stores

Stores that fetch lazily, cache, revalidate, and persist. Every store emits one of three types:

```ts
type Maybe<T, E extends Error = Error> = null | T | E
//   null  → no data yet (loading / cleared / not fetched)
//   T     → resolved value
//   E     → fetch error (errors are values, never thrown)
```

```ts
import {
  value, values, collection,           // stores
  ok, ensure, having, awaited, once,   // guards & awaiting
  combined, sync, Async,               // compose & render
  type Maybe
} from 'svas'
```

## Shared lifecycle

Every store fetches on **first subscribe**, then auto-revalidates. Common options:

| Option | Meaning |
|--------|---------|
| `get` | fetcher returning `Promise<T \| Error>` |
| `revalidate` | ms before re-fetch (default `300_000`; `Infinity` disables) |
| `persist` | mirror into local storage under this key |
| `session` | use `sessionStorage` instead of `localStorage` |
| `stale` | keep previous value visible while revalidating (default `false`) |
| `bind` | `Readable<unknown \| null>` — reset/clear store when bound store is `null` (tie data to a user) |
| `default` | initial value when nothing is persisted |

## Stores

All stores implements Readable interface from svelte/store.

Use `persist` whenever it makes sense to persist the data, it will vastly speed up the initial load.
If store contains user-bound data, use `bind` to reset the store when the user is logged out.

### `value<T>` — one async value

`Writable<T | null>`. For single fetched values, auth tokens, transient UI flags.

```ts
const me = value<User>({ get: () => api.me(), persist: 'user' })
const seen = value<number>({ persist: 'seen', default: 0 }) // transient/local-only
```

Methods: `set(v)`, `update(fn)`, `extract(): T | null` (sync read), `sync()` (revalidate if stale).

### `values<T>` — keyed cache

A map of independent `Readable<Maybe<T>>` lifecycles, one per key.

```ts
const products = values<Product>({ get: (id) => api.product(id), stale: true, persist: 'products' })

const one = products.get('42')      // Readable<Maybe<Product>>, fetches if missing
products.set('42', next)            // write by key
products.extract('42')              // Product | null, sync
```

Methods: `get(key, { fetch? })` · `set(key, v, { stash? })` · `reset(key)` (restore stashed value) · `extract(key)` · `delete(key)` · `clear()`.

Extra options: `permanent` (don't revalidate persisted entries on startup). `stash: true` on `set` remembers the prior persisted value so `reset(key)` can roll back — use for optimistic updates.

### `collection<T>` — list of `Identifiable` items

`Readable<Maybe<T[]>>`. Items must have `{ id: string }`. Pass a `values` store to also observe items individually via `get(id)`.

```ts
const todos = collection<Todo>({
  get: () => api.todos(),
  values: values<Todo>(), // enables todos.get(id) / extract(id)
  stale: true, 
  persist: 'todos', 
  bind: session
})
```

Methods: `subscribe` · `add(item)` · `set(item, { add? })` (replace by id; `add` inserts if absent) · `update(id, fn, opts?)` · `delete(id)` · `replace(items)` · `get(id)`/`extract(id)` (require `values`) · `sync(): this` · `fetch(): Promise<this>`.

Mutations mirror into the `values` store, so components subscribed via `get(id)` update without re-fetching.

## Guards & extraction

Never use `?.` on a `Maybe<T>` — an `Error` has no domain properties. Narrow first.

```ts
ok($store)          // boolean type guard: narrows Maybe<T> → T (excludes null | Error)
ensure(store)       // sync read, THROWS if null/Error — use when value must exist now (e.g. unsafe net requests in response to user action)
store.extract(key?) // sync read, T | null (ignores errors) — never throws
```

```ts
if (ok($todos)) $todos.length        // typed as T
items.filter((i) => ok(i.account) && !i.account.deleted)   // ✅ guard before access
```

## Awaiting

```ts
await having(store)   // first non-null value; REJECTS on Error — services needing auth
await awaited(store)  // first non-null value; returns Error as a value (never rejects)
await once(store, (v) => v === 'ready')   // first value satisfying a condition
```

## Compose & render

### `<Async>` — render a `Maybe`

```svelte
<Async store={todos}>
  {#snippet awaited(todos)}
    <!-- here todos are T[] -->
    {#each todos as t}<Row {t} />{/each}
  {/snippet}
  {#snippet waiting()}<Spinner />{/snippet}   <!-- optional; default loader otherwise -->
  {#snippet error(e)}<Err {e} />{/snippet}    <!-- optional; default error UI otherwise -->
</Async>
```

Props: `store` (required), `awaited` snippet (required), optional `waiting` / `error` snippets, `silent` (suppress default loader/error chrome). Combine with `combined` to await several at once.

### `combined(...stores)`

One `Maybe` from many: tuple when **all** resolve, first `Error`, else `null`. Spreadable.

```svelte
<Async store={combined(account, todos)}>
  {#snippet awaited([account, todos])}
    <!-- here account is U and todos is T[] -->
    <Profile {account} />
    {#each todos as t}<Row {t} />{/each}
  {/snippet}
</Async>
```

### `sync(store, item, { delete? })`

Conflict-free update.

T must implement interface Comparable { id: string; _version: number;_deleted?: number | null }

Merge a versioned item into a `collection` or `value`, respecting `_version`; removes on `_deleted` (unless `delete: false`). For applying server/realtime events.

```ts
events.on('todos.sync', (todo) => sync(todos, todo))
```

## Rules

- **Errors are values** — fetchers and services return `T | Error`; check `instanceof Error`, never `try/catch` for expected failures.
- **Guard before access** — `ok()`/`ensure()`/`extract()`, never `?.` on `Maybe<T>`.
- **One store per source** — derive everything else; don't duplicate fetched data into local state.
- **Lazy by design** — a store does nothing until subscribed; `$store`, `<Async>`, `get`, `having`, or `.subscribe` triggers it.

## Advanced

For derived `Maybe` stores with live subscriptions/cleanup, realtime event wiring, linked/enriched entities, and optimistic update patterns, see [references/patterns.md](references/patterns.md).
