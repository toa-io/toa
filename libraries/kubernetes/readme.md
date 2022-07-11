# Kubernetes

Wrapper for `kubectl` working in current context.

## Secrets

### `async get(name)`

Get kubernetes secret's declaration.

#### Arguments
<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the secret</dd>
</dl>

#### Returns
[`toa.kubernetes.secrets.Declaration`](types/secrets.d.ts) | `null`

### `async store(name, values)`

Creates or updates a secret. Doesn't delete existing keys.

#### Arguments
<dl>
<dt><code>name</code></dt>
<dd><code>string</code> name of the secret</dd>
<dt><code>values</code></dt>
<dd><a href="types/secrets.d.ts"><code>toa.kubernetes.Secret</code></a> secret values</dd>
</dl>

#### Returns
`void`
