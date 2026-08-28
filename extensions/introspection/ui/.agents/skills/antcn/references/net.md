# net

The networking foundation every other Solution builds on. Connects a single `@toa.io/origin` client to your API and re-exports it as `origin`, plus the `query` helper for building criteria query strings. Sibling Solutions import `origin` from `@/net` to declare their resources.

## `$config`

`net` reads two fields from your `$config` module (`import * as config from '$config'`):

| Field    | Type                            | Notes                                                                       |
| -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `origin` | `string`                        | Absolute API origin; `''` is invalid (resolved via `new URL(path, origin)`). |
| `sleep`  | `[number, number] \| undefined` | Dev-only artificial latency range; `undefined` disables it.                 |

## Usage

Declare a resource against the shared client and call it:

```ts
import { origin, query, type RequestOptions } from '@/net'

const echo = origin.resource<{ message: string }>('/accounts/echo/')

async function ping(): Promise<{ message: string } | Error> {
  return echo.json({ method: 'GET' } satisfies RequestOptions)
}
```

`query` turns a `URLSearchParams` into a criteria string; `omit`/`limit`/`search` stay as plain pairs, everything else becomes `criteria=key==value;…`:

```ts
const params = new URLSearchParams({ status: 'active', limit: '20' })
query(params) // '?criteria=status==active&limit=20'
```
