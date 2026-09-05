# Layout

An application is a directory with a `context.toa.yaml` and its components under it. A component
is a directory with a `manifest.toa.yaml` and its modules sorted by kind.

## A component

```
pricing/
  manifest.toa.yaml
  package.json
  operations/
    quote.js
    lib/
  events/
  receivers/
  guards/
  rc/
  types/
```

| Path | What it holds |
|---|---|
| `manifest.toa.yaml` | the declaration; the only file a component requires |
| `package.json` | `"type": "module"` for ES modules, and the component's own dependencies |
| `operations/` | one module per operation, named after it: `quote.js` is `quote` |
| `events/` | one module per custom event |
| `receivers/` | one module per receiver |
| `guards/` | one module per invariant checked on every state change |
| `rc/` | run commands: what runs once when the component starts and when it stops |
| `types/` | written by `toa types`; `index.d.ts` there is the component's own to edit |

A module is a `.js`, `.mjs`, `.cjs` or `.ts` file. Every file directly under `operations/` is an
operation, so a test left there is an endpoint; two files with one name are an error. What is not
an operation, a helper, a client, a table of errors, goes a level down, `operations/lib/`, or
beside the manifest in `lib/`, where nothing is read as one.

## An application

```
shop/
  context.toa.yaml
  .env
  package.json
  docker-compose.yaml
  components/
    pricing/
    checkout/
  types/
```

| Path | What it holds |
|---|---|
| `context.toa.yaml` | the Context |
| `.env` | the connectors' addresses for one environment; written by `toa env`, git-ignored |
| `package.json` | `@toa.io/runtime` as a dev dependency; `workspaces: [components/*]` |
| `docker-compose.yaml` | the containers from [Installation](02-install.md) |
| `components/` | one directory per component; the name and the depth are free |
| `types/` | written by `toa types` for the Context |

## Names

A component is `namespace.name`. Each is a letter followed by up to 31 letters or digits;
`namespace` defaults to `default`, and `system` is Toa's own. A directory named `orders.pricing`
supplies both where the manifest states neither, and one named `pricing` supplies the name alone.

From that identity the runtime derives every other name, and none of them is chosen:

| Name | Form | Where it appears |
|---|---|---|
| id | `orders.pricing` | endpoints, `context.remote.orders.pricing`, logs |
| label | `orders-pricing` | pod, image and host names |
| variable | `ORDERS_PRICING` | environment variables |

---

[← First application](03-first-app.md) · [Start](readme.md) · [Components →](../2-components/readme.md)
