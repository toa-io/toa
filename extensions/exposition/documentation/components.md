# Components and resources

Exposition comes with a set of components that run within the same process. These components are
configured in the same
way as if they were a part of the Context. Resources exposed by the components
are [isolated](tree.md#directives).

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
    pepper: '' # hashing pepper
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
    principal: root
```

The value of the `principal` key corresponds to the `username` of the basic credentials. Once these
credentials are
created, the associated Identity will be assigned the `system` Role.

Once created, the username of the principal cannot be modified.

### Resources

#### `/identity/basic/`

<code>POST</code> Create new Identity with Basic credentials. Request body is as follows:

```yaml
username: string
password: string
```

Access is [anonymous](access.md#anonymous).

#### `/identity/basic/:id/`

> `:id` placeholder refers to an Identity.

<code>PUT</code> Update basic credentials. Request body is as follows:

```yaml
username?: string
password?: string
```

Access requires basic credentials of the modified Identity or `system:identity:basic` role.

## Identity federation (OpenID connect)

The `identity.federation` component manages OpenID Connect federated identities.

Both implicit identities creation and forced [identity inception](./identity.md) are supported
as in case with basic credentials. `principal` is also working in the same way.

The configuration schema alongside default values is described in
the [component manifest](../components/identity.federation/manifest.toa.yaml).

No federated tokens are accepted by default until at least one entry is added to the `trust`
configuration.

Toa supports either asymmetric RS256 or symmetric HS256 / HS384 / HS512 tokens with pre-shared
secrets.

```yaml
# context.toa.yaml

configuration:
  identity.federation:
    trust:
      - iss: https://token.actions.githubusercontent.com
        aud:
          - https://github.com/tinovyatkin
          - https://github.com/temich

      - issuer: some.private.issuer
        secrets:
          HS256:
            k1: <secret-to-be-used-for-hs256>
```

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

```
POST /identity/tokens/
host: nex.toa.io
authorization: Token <token>
accept: application/yaml
content-type: application/yaml

lifetime: 3600
scopes: [app:developer]
permissions:
  /users/fc8e66dd/: [GET, PUT]
  /posts/fc8e66dd/**/comments/: [*]
```

```
201 Created
content-type: application/yaml

token: <token>
```

- `lifetime`: Issued token will be valid for this period
  (default is specified in [the configuration](#token-rotation)).
  The value of `0` means the token will not expire, which is supported, but
  **strongly not recommended** for production environments.
- `scopes`: Issued token will assume only specified [role scopes](access.md#roles).
- `permissions`: Issued token will have permissions to access only specified resources and methods.
  Supports [glob patterns](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html)
  and a wildcard method.

> `roles` and `permissions` are additional restrictions applied on top of the Identity’s inherent
> privileges.

### Token encryption

Issued tokens are encrypted
with [PASETO V3 encryption](https://github.com/panva/paseto/blob/main/docs/README.md#v3encryptpayload-key-options)
using the first key from the `keys` configuration value.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    keys:
      2024q1: $TOKEN_SECRET_2024Q1
```

At least one key in the `keys` configuration value is required.

> Valid secret key may be generated using the [`toa key` command](/runtime/cli/readme.md#key).

### Token rotation

Issued tokens are valid for a `lifetime` period defined in the configuration. After the `refresh`
period, the token is considered obsolete (yet still valid), and a new token
is [issued](#issuing-tokens) unless the provided one has been [revoked](#token-revocation).

This essentially means that if the client uses the token at least once every `lifetime` period, it
will always have a valid token to authenticate with.
Also, token revocation or changing roles of an Identity will take effect once the `refresh` period
of the currently issued tokens has expired.

Adjusting these two values is a delicate trade-off between security, performance and client
convenience.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    lifetime: 2592000 # seconds, 30 days
    refresh: 600      # seconds, 10 minutes
```

> Values in the example above are the default values.

### Token revocation

All currently issued tokens of an Identity are revoked when:

1. Basic credentials associated with the Identity are [modified](#identitybasicid).
2. Identity is [banned](#banned-identities).

Token revocation takes effect once the `refresh` period of the currently issued tokens has expired.

### Secret rotation

Tokens are always encrypted using the first key from the `keys` configuration value,
and decrypted by the key used to encrypt them.

To rotate the secret key, a new key must be added to the top of the `keys` configuration value, that
is, it will be used to encrypt new tokens.

Old keys must be removed only after the `refresh` period of the previously issued tokens has
expired.

> Let's say you are adding a new secret key each quarter: `2024Q1`, `2024Q2` and so on.
> The old key `2024Q1` must be removed from the configuration only when the `refresh` period after
> the new key `2024Q2` was added has expired.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    key0: $TOKEN_ENCRYPTION_KEY_2023Q3
    key1: $TOKEN_ENCRYPTION_KEY_2023Q4
```

2. Move the new secret key from `key1` to `key0`, and move the current key from `key0` to `key1`.
   During this rollout,
   all instances can decrypt tokens encrypted with both the new key and the current key.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    key0: $TOKEN_ENCRYPTION_KEY_2023Q4
    key1: $TOKEN_ENCRYPTION_KEY_2023Q3
```

### Token resources

`/identity/tokens/`

`POST` Issue a new token for the Identity. Request body is as follows:

```yaml
lifetime?: number # seconds
```

Providing a value of `0` will result in the token being issued with no expiration.
However, it will still become invalid once the encryption key used is out
of [rotation](#secret-rotation).

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

An Identity having `system:identity:roles:delegation` role can delegate roles within its own
Role Scopes (see [Role Hierarchies](access.md#hierarchies)).

## Banned Identities

The `identity.bans` component manages banned identities.
A banned identity will fail to authenticate with any associated credentials
(except [tokens](#stateless-tokens) within the `refresh` period).

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
