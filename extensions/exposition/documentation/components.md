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
    peper: ''  # hashing pepper
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
      - issuer: https://token.actions.githubusercontent.com
        audience:
          - https://github.com/tinovyatkin
          - https://github.com/temich

      - issuer: some.private.issuer
        secrets:
          HS256:
            k1: <secret-to-be-used-for-hs256>
```

## Stateless tokens

The `identity.tokens` component manages stateless authentication tokens.

These tokens carry the information required to authenticate the Identity and authorize access.

### Issuing tokens

The new token is issued each time the request is made:

1. Using authentication scheme other than `Token`.
2. Using `Token` authentication scheme with an [obsolete token](#token-rotation).

### Token encryption

Issued tokens are encrypted
with [PASETO V3 encryption](https://github.com/panva/paseto/blob/main/docs/README.md#v3encryptpayload-key-options)
using the `key0` configuration value as a secret.

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    key0: $TOKEN_ENCRYPTION_KEY
```

The `key0` configuration value is required.

> Valid secret key may be generated using the [`toa key` command](/runtime/cli/readme.md#key).

### Token rotation

Issued tokens are valid for a `lifetime` period defined in the configuration. After the `refresh`
period, the token is
considered obsolete (yet still valid), and a new token is [issued](#issuing-tokens) unless the
provided one has
been [revoked](#token-revocation).

This essentially means that if the client uses the token at least once every `lifetime` period, it
will always have a
valid token to authenticate with. Also, token revocation or changing roles of an Identity will take
effect once
the `refresh` period of the currently issued tokens has expired.

Adjusting these two values is a delicate trade-off between security, performance and client
convinience.

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

Tokens are always encrypted using the `key0` configuration value, and they will be decrypted by
attempting both
the `key0` and `key1` values in order.

`key0` is considered the "current key," and `key1` is considered the "previous key."

```yaml
# context.toa.yaml

configuration:
  identity.tokens:
    key0: $TOKEN_ENCRYPTION_KEY_2023Q3
    key1: $TOKEN_ENCRYPTION_KEY_2023Q2
```

Secret rotation is performed by adding a new key as the `key0` value and moving the existing `key0`
to the `key1` value.

When rolling out the new secret key, there will be a period of time when the new key is deployed to
some Exposition
instances. During this time, these instances will start using the new key to encrypt tokens, while
other instances will
continue using the current key and will not be able to decrypt tokens encrypted with the new key.

To address this issue, the `key1` configuration value may be used as a "transient key."

The secret rotation is a 2-step process:

> The process **must not** be performed earlier than the `lifetime` period since the last rotation,
> as it may invalidate
> tokens before they expire. Therefore, it is guaranteed that there are no valid tokens issued with
> the current `key1`
> value.

1. Deploy the new secret key to all Exposition instances as `key1`. This enables all instances to
   decrypt tokens
   encrypted with the new key while still using the current key for encryption.

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

> However, it will still become invalid once the encryption key used is out
> of [rotation](#secret-rotation).

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
A banned identity will fail to authenticate with any associated credentials (
except [tokens](#stateless-tokens) within
the `refresh` period).

```http
PUT /identity/bans/:id/
authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
content-type: application/yaml

banned: true
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
