# Kubernetes

Wrapper for `kubectl` and `kubectx` working in the current context.

## Secrets

### `async get(name)`

Get kubernetes secret's declaration.

<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the secret</dd>
</dl>

Returns [`toa.kubernetes.secrets.Declaration`](types/secrets.d.ts) | `null`

### `async store(name, values)`

Create or update a secret. Don't delete existing keys.

<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the secret</dd>
<dt><code>values</code></dt>
<dd><a href="types/secrets.d.ts"><code>toa.kubernetes.Secret</code></a> secret values</dd>
</dl>

Returns `void`

## Context

### `async get(name)`

Get current context.

<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the context</dd>
</dl>

Returns `string` | `null`

### `async set(name)`

Set current context.

<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the context</dd>
</dl>

Returns `void`
