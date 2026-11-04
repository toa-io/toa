# Components and resources

Exposition comes with a set of components that run within the same process. These components are
configured in the same
way as if they were a part of the Context. Resources exposed by the components
are [isolated](tree.md#directives).

See [Persistent credentials](credentials.md) for the centralized Basic, federation, and passkey
management API.

## Basic credentials

The `identity.basic` component stores basic credentials.

### Password hashing

Passwords are hashed using the [bcrypt](https://github.com/dcodeIO/bcrypt.js) algorithm with salt
and pepper.

```yaml
# context.toa.yaml

configuration:
  identity.basic:
    rounds: 10 # salt rounds
    pepper: $IDENTITY_BASIC_PEPPER # hashing pepper, a secret
```

### Credentials constraints

Credential constraints are defined using a set of regular expressions (values must match all of
them).

```yaml
# context.toa.yaml

configuration:
  identity.basic:
    username:
      - ^\S{1,128}$
    password:
      - ^\S{8,32}$
```

> Values in the example above are the default values.

### Principal

When an application is deployed for the first time, there are no credentials, and therefore, there
is no Identity that
could have a Role to manage Roles of other Identities.

This issue is addressed by using the `principal` key in the configuration:

```yaml
# context.toa.yaml

configuration:
  identity.basic:
    principal:
      authority: example
      username: root
```

`principal` names the authority and the `username` of the basic credentials. Once these
credentials are created in that authority, the associated Identity is assigned the `system` Role.
The same username in another authority is ordinary credentials.

Credentials created by inception are granted the Role before the reply, so the token that reply
carries already holds it.

Once created, the username of the principal cannot be modified.

### Resources

#### `/identity/basic/`

<code>POST</code> Create new Identity with Basic credentials. Request body is as follows:

```yaml
username: string
password: string
```

Returns `201 Created` if the Identity is created,
or `422 Unprocessable Entity` with one of the error codes:

- `INVALID_USERNAME` - `username` does not match constraints
- `INVALID_PASSWORD` - `password` does not match constraints

Access is [anonymous](access.md#anonymous).

#### `/identity/basic/:id/`

> `:id` placeholder refers to an Identity.

<code>PUT</code> Update basic credentials. Request body is as follows:

```yaml
username?: string
password?: string
```

Access requires basic credentials of the modified Identity or `system:identity:basic` role.

<code>POST</code> Incept new basic credentials. Request body is as follows:

```yaml
username: string
password: string
```

Identity should not have associated basic credentials. Access requires any credentials of the Identity.

#### `/identity/basic/usernames/:username/`

<code>GET</code> Check if the username is available.

`username` must be Base64 URL encoded.

Returns empty response with status `204` if the username is already taken or `404` if it is available.

## Identity federation (OpenID connect)

The `identity.federation` component manages OpenID Connect federated identities.

Both implicit identities creation and forced [identity inception](./identity.md) are supported
as in case with basic credentials. `principal` is also working in the same way.

The configuration schema alongside default values is described in
the [component manifest](../components/identity.federation/manifest.toa.yaml).

No federated tokens are accepted by default until at least one entry is added to the `trust`
configuration.

Issuer metadata is loaded from `<iss>/.well-known/openid-configuration`; signing keys are then
loaded from its `jwks_uri`. These requests, including Authorization Code token exchange, use the
built-in `context.fetch`, so they participate in standard HTTP telemetry and connection pooling.
JWKS resolvers are cached per fetch instance and issuer.

```yaml
# context.toa.yaml

configuration:
  identity.federation:
    trust:
      - iss: https://token.actions.githubusercontent.com
        aud:
          - https://github.com/tinovyatkin
          - https://github.com/temich

      - iss: https://accounts.google.com
        aud: <GOOGLE_CLIENT_ID>
```

### Issuing tokens

An application is an OpenID issuer of its own once it has signing keys and annotates `issuer`.
A component of it then asks for a token, and presents it to another application, which
[trusts](#identity-federation-openid-connect) the issuer as it would any other provider.

```yaml
# context.toa.yaml

exposition:
  authorities:
    nex: api.example.com
  issuer: true

configuration:
  identity.federation:
    keys:
      - kid: k1
        key: $ISSUER_K1
    lifetime: 3600
```

- `keys`: ES256 private keys, PKCS8 in PEM form, given as [secrets](../../configuration/readme.md#secrets).
  The first signs; every one is published.
- `lifetime`: The longest a token may be valid, in seconds (default 3600).

```shell
$ openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256
```

```javascript
const { token, exp } = await context.remote.identity.federation.issue({
  input: {
    authority: 'nex',
    sub: 'billing',
    audience: 'https://api.another.com',
    lifetime: 300
  }
})

await context.fetch('https://api.another.com/invoices/', {
  headers: { authorization: `Bearer ${token}` }
})
```

- `authority`: The authority the token is issued in. Its issuer is `https://` followed by the host
  the annotation maps it to: `https://api.example.com`.
- `sub`: Who presents the token. The issuer takes it as given, so it is the caller's to decide what
  a subject is — a service, an Identity — and to keep one subject's name for that subject alone.
- `audience`: Whom it is presented to, as the receiving application's `trust` names it in `aud`.
- `lifetime`: Seconds the token is valid for (default 300), at most `identity.federation.lifetime`.

The reply is the token and `exp`, the time it expires at, in seconds. The token is a JWS that carries
`iss`, `sub`, `aud`, `iat`, `exp` and `jti`. It is valid until it expires, wherever it is presented
to an application that trusts the issuer for that `aud`, so ask for one per call, or keep one for
no longer than its lifetime.

`issue` refuses with `NOT_ISSUER` without keys, or for an authority the annotation does not map,
and with `LIFETIME` for a lifetime over the limit. It has no HTTP resource.

The application the token is presented to trusts the issuer, and admits it by its claims:

```yaml
# context.toa.yaml

configuration:
  identity.federation:
    trust:
      - iss: https://api.example.com
        aud: https://api.another.com
```

```yaml
# manifest.toa.yaml

exposition:
  /:
    GET:
      auth:claims:
        iss: https://api.example.com
        sub: billing
      endpoint: enumerate
```

See [`auth:claims`](access.md#claims).

#### Discovery

With `issuer: true`, `/.well-known/openid-configuration` is served at every authority, to anyone:

```yaml
issuer: https://api.example.com
jwks_uri: https://api.example.com/identity/federation/keys/
response_types_supported: [id_token]
subject_types_supported: [public]
id_token_signing_alg_values_supported: [ES256]
```

Where the application is an [authorization server](oauth.md#discovery) as well, the same fields
are added to its metadata.

`GET /identity/federation/keys/` is the public part of every key, to anyone, cacheable for 5
minutes.

#### Key rotation

A token stays verifiable while the key it was signed with is listed. An application that trusts
the issuer keeps the keys it read for up to 10 minutes, so a new key is listed before it signs:

1. Add the new key after the current one, and deploy.
2. Once 10 minutes are past, move it first, and deploy.
3. Once the longest lifetime a token was issued with is past, remove the old one.

## Local tokens

The `identity.tokens` component manages local authentication tokens.

These tokens carry the information required to authenticate the Identity and authorize access.

### Issuing tokens

The new token is issued each time the request is made:

1. Using authentication scheme other than `Token`.
2. Using `Token` authentication scheme with an [obsolete token](#token-rotation).

When the token is issued it is sent in the `authorization` response header and the `cache-control`
is set to `no-store`.

```http
authorization: Token ...
cache-control: no-store
```

### Custom tokens

Custom tokens can be issued restricted to a set of scopes and permissions, for the own Identity or
by an Identity with the `system:identity:tokens` role.

Tokens are issued with custom secret keys and are not subject to [token rotation](#token-rotation).
To invalidate a custom token, its secret key must be deleted.

Custom tokens have no `refresh` period, that is, never become obsolete and never refreshed.

```
POST /identity/tokens/<identity>/
host: nex.toa.io
authorization: ...
accept: application/yaml
content-type: application/yaml

lifetime: 3600
label: CI deployment token
scopes: [app:developer]
permissions:
  /users/fc8e66dd/: [GET, PUT]
  /posts/fc8e66dd/**/comments/: [*]
```

```
201 Created
content-type: application/yaml

kid: <key-id>
exp: <unix-time-ms>
token: <token>
```

- `lifetime`: Issued token will be valid for this period
  (default is specified in [the configuration](#token-rotation)).
  The value of `0` means the token will not expire, which is supported, but
  **strongly not recommended** for production environments.
- `label`: Required human-readable name used when listing and revoking issued tokens.
- `scopes`: Issued token will act as an Identity with the specified [roles](access.md#roles) in
  place of its own. Each must be a scope a role of the Identity covers, or the token is not issued.
- `permissions`: Issued token will have permissions to access only specified resources and methods.
  Supports [glob patterns](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html)
  and a wildcard method.
  Patterns are matched against the request path as it is routed: normalized, without the query
  string.

> `scopes` and `permissions` are additional restrictions applied on top of the Identity’s inherent
> privileges. An OAuth access token is bound to an entry as `aud` instead, see
> [Audience](oauth.md#audience).

### Custom token invalidation

A custom token is invalidated through its secret key. The key is revoked, and every token issued
with it is refused, when the Identity is [banned](#banned-identities), its
[Basic credentials](#basic-credentials) are modified, or one of its [roles](#roles) is revoked.
The key can also be deleted by the Identity the token is issued for or by an Identity with the
`system:identity:keys` role.

```
DELETE /identity/keys/<identity>/<key.id>/
authorization: ...
```

The key `id` is returned as `kid` when the token is issued, is visible in the JWE protected header,
and can also be obtained by listing issued token keys. The secret key itself is never returned by
the listing endpoint.

```
GET /identity/keys/<identity>/
authorization: ...
```

The listing returns `id`, `label`, optional `expires`, `revokedAt` where the key is revoked, and
`CREATED`. Revocation and deletion prevent new cache lookups from finding a usable key. A runtime
that already cached it can continue accepting the token for up to `identity.tokens.cache.ttl`
milliseconds (10 minutes by default).

Both listing and deletion require credentials of the owning Identity or the
`system:identity:keys` role. Key creation is internal to `identity.tokens`; there is no public
endpoint that returns a stored secret.

### Token encryption

Issued tokens are compact JWE tokens encrypted with direct symmetric encryption. Their protected
header is `{ alg: 'dir', enc: 'A256GCM', typ: 'JWT', kid: <key id> }`. Keys are configured in one
`keys` array. The first entry whose `format` is `jwe` or omitted is the active issuance key.
Keys are 256-bit secrets encoded with base64url and can be generated with `toa key`.

The optional `format` is `jwe` by default. Entries with `format: paseto` contain legacy PASETO
V3.local secrets and are used only to read old tokens. Legacy tokens are always marked for refresh;
only JWE tokens are issued.
The `format` property is transitional and can be removed together with the PASETO entries after the
legacy compatibility window ends.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    keys:
      - id: 2026q3
        key: $IDENTITY_TOKENS_ENCRYPTION_KEY0
      - id: legacy
        key: $IDENTITY_TOKENS_KEY0
        format: paseto
```

At least one JWE entry is required. PASETO entries are required only while previously issued legacy
tokens must remain readable.

> Valid secret key may be generated using the [`toa key` command](/runtime/cli/readme.md#key).

### Token rotation

Issued tokens are valid for a `lifetime` period defined in the configuration. After the `refresh`
period, the token is considered obsolete (yet still valid), and a new token
is [issued](#issuing-tokens) unless the provided one has been [revoked](#token-revocation).

This essentially means that if the client uses the token at least once every `lifetime` period, it
will always have a valid token to authenticate with.
Also, token revocation or changing roles of an Identity will take effect once the `refresh` period
of the currently issued tokens has expired.
A client that should not wait for it, one told a role was granted, asks for a new token at
[`/identity/tokens/refresh/`](#token-resources).

A change of what an Identity may do reaches every credential it holds: a token issued by the
gateway within `refresh`, a [custom token](#custom-tokens) within `cache.ttl`.

Adjusting these two values is a delicate trade-off between security, performance and client
convenience.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    lifetime: 2592000 # seconds, 30 days
    refresh: 600 # seconds, 10 minutes
```

> Values in the example above are the default values.

### Token revocation

All currently issued tokens of an Identity are revoked when:

1. [Basic credentials](#basic-credentials) associated with the Identity are modified.
2. Identity is [banned](#banned-identities).

Token revocation takes effect once the `refresh` period of the currently issued tokens has expired.
[Custom tokens](#custom-tokens) are revoked through their keys, within `cache.ttl`.

### Secret rotation

Tokens are always encrypted using the first JWE entry of the `keys` array and decrypted by the
entry in the corresponding format branch whose `id` matches the token's `kid`.

Rotation uses array order rather than object property order: index `0` is active for issuance and
the remaining entries are decrypt-only. Use the staged procedure below so every runtime knows the
new key before it becomes active.

Old keys must remain configured until every token issued with them has expired. In the default
configuration this means retaining them for at least `lifetime` (30 days) after making a new key
active. The shorter `refresh` interval only controls replacement during active client use and is
not a safe removal window for clients that remain idle.

> Let's say you are adding a new secret key each quarter: `2024Q1`, `2024Q2` and so on.
> The old key `2024Q1` must be removed only after the maximum lifetime of tokens issued with it has
> elapsed.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    keys:
      - id: 2026q3
        key: $TOKEN_ENCRYPTION_KEY_2026Q3
      - id: 2026q4
        key: $TOKEN_ENCRYPTION_KEY_2026Q4
```

1. First deploy both keys everywhere with the current key at index `0`, as shown above.
2. In an atomic rollout, move the new entry to index `0` and keep the current entry after it.
   All instances can then decrypt tokens encrypted with both the new key and the current key.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    keys:
      - id: 2026q4
        key: $TOKEN_ENCRYPTION_KEY_2026Q4
      - id: 2026q3
        key: $TOKEN_ENCRYPTION_KEY_2026Q3
```

3. Remove `2026q3` only after its last possible token has expired.

The PASETO-to-JWE runtime migration must also be atomic: legacy runtimes cannot decrypt newly
issued JWE tokens. Keep every `format: paseto` entry until its last token has expired;
`toa key --format paseto` exists only for maintaining those legacy secrets.

### Token resources

`/identity/tokens/`

`POST` Issue a new token for the Identity. Request body is as follows:

```yaml
lifetime?: number # seconds
```

Providing a value of `0` will result in the token being issued with no expiration.
However, it will still become invalid once the encryption key used is out
of [rotation](#secret-rotation).

`/identity/tokens/refresh/`

`POST` Replace the presented token with a new one, whatever its age. The reply carries the new
token in the `authorization` header, with roles as the Identity holds them now, and its body is the
Identity as `GET /identity/` answers it.

```http
POST /identity/tokens/refresh/
authorization: Token ...
accept: application/yaml
```

```http
200 OK
authorization: Token ...
cache-control: no-store

id: 2428c31ecb6e4a51a24ef52f0c4181b9
roles: [app:editor]
```

Credentials of other schemes are answered with a new token as any request carrying them is.

| Presented                                                                                  | Reply              |
| ------------------------------------------------------------------------------------------ | ------------------ |
| No credentials                                                                             | `401 Unauthorized` |
| A token issued before its Identity's [revocation](#token-revocation), within `refresh` too | `401 Unauthorized` |
| Credentials of a [banned](#banned-identities) Identity                                     | `401 Unauthorized` |
| A [custom token](#custom-tokens), an OAuth access token included                           | `403 Forbidden`    |

## Roles

The `identity.roles` component manages roles of an Identity used
by [access authorization](access.md#role).

### `/identity/roles/:id/`

`GET` Get roles of an Identity.

Access requires credentials of the Identity or `system:identity:roles` role.

`POST` Add a role to an Identity. Request body is as follows:

```yaml
role: string
```

To assign arbitrary roles, the `system:identity:roles` role is required.

An Identity having `system:identity:roles:delegation` role can delegate roles its own roles cover
(see [Role Hierarchies](access.md#hierarchies)), except roles within the `system:identity:roles`
scope: the right to delegate is not delegated.

### `/identity/roles/:id/:role/`

`DELETE` Revoke a role of an Identity. The `system:identity:roles` role is required.

A Token carries the roles it was issued with; a change reaches its holder when the token is
[refreshed](#token-rotation). Revoking a role also revokes the [custom tokens](#custom-tokens) of
the Identity, which are issued again with the roles it has left.

## Banned Identities

The `identity.bans` component manages banned identities.
A banned identity will fail to authenticate with any associated credentials
(except [tokens](#local-tokens) within the `refresh` period).

```http
PUT /identity/bans/:id/
authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
content-type: application/yaml

banned: true
comment: Bye bye
```

Access requires `system:identity:bans` role.

## Authentication echo

Exposition implements a predefined resource `/identity/` with the `GET` method, which returns the
Identity resolved by the provided credentials.

```http
GET /identity/
authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
accept: application/yaml
```

```
200 OK

id: fc8e66ddd51d45eea89602c9dd38a542
roles:
  - developer
  - system:identity:roles
```

When no credentials are provided, transient Identity is created.

```http
GET /identity/
accept: application/yaml
```

```
201 Created

id: 332017649c814649b25ee466c1fe4534
roles: []
```
