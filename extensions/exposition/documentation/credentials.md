# Persistent credentials

Persistent credentials associate an [Identity](identity.md) with a reusable authentication method.
Exposition stores Basic, OpenID Connect federation, and WebAuthn passkey credentials. Local tokens
and one-time passwords are not persistent credentials: tokens are stateless and OTP records expire.

See [Features](../features/credentials.feature).

## Listing credentials

`GET /identity/credentials/:identity/` returns all persistent credentials associated with the
Identity in the current authority. Access requires credentials of that Identity.

```http
GET /identity/credentials/fc8e66ddd51d45eea89602c9dd38a542/ HTTP/1.1
authorization: Token ...
accept: application/yaml
```

```yaml
basic:
  username: user@example.com
federation:
  - id: 09200d0bcc2448c5863e3f50ae18af84
    iss: https://accounts.google.com
    _created: 1754899200000
passkeys:
  - id: 54ed430804324e81b39756ea4708b546
    aid: adce0002-35bc-c60a-648b-0b25f1f05503
    synced: true
    label: Personal iPhone
    _created: 1754899200000
```

`basic` is `null` when Basic credentials do not exist. `federation` and `passkeys` are always
arrays. Secret and authentication data, including password hashes, federation subjects, public
keys, signature counters, and transports, are not returned.

The federation issuer identifies the provider. For example, Google uses
`https://accounts.google.com` and Apple uses `https://appleid.apple.com`. Applications should map
trusted issuers to their own provider names and presentation.

The passkey `aid` is its
[AAGUID](https://www.w3.org/TR/webauthn-2/#aaguid), which can be resolved against an authenticator
metadata catalog. `synced` indicates whether the credential was backed up and is therefore likely
available on more than one device.

## Basic credentials

- `POST /identity/basic/:identity/` adds Basic credentials to an Identity.
- `PATCH /identity/basic/:identity/` changes its username or password.
- `DELETE /identity/basic/:identity/` removes its Basic credentials.

An Identity can have at most one Basic credential in an authority. See
[Basic credentials configuration](components.md#basic-credentials) for password hashing,
constraints, and principal configuration.

## Federated credentials

- `POST /identity/federation/:identity/` associates credentials from a trusted issuer and returns
  the associated credential as it is listed.
- `GET /identity/federation/:identity/` lists federated credentials.
- `DELETE /identity/federation/:identity/:credential/` removes one federated credential.

If the credentials are already associated with the Identity, the existing credential is returned.

An Identity can have credentials from multiple issuers and can have multiple subjects from the
same issuer. The `:credential` segment is the `id` returned by any of these resources. Federation
resources are provider-independent; issuer-specific authorization flows remain the responsibility
of the application.

## Passkeys

Passkey registration consists of a challenge followed by credential creation:

- `POST /identity/passkeys/challenges/:identity/` creates a registration challenge.
- `POST /identity/passkeys/:identity/` verifies the response and stores the passkey.
- `GET /identity/passkeys/:identity/` lists passkeys.
- `DELETE /identity/passkeys/:identity/:credential/` removes one passkey.

See [Web Authentication](passkeys.md) for standards and feature scenarios.

## Removing the last credential

Credential components intentionally do not coordinate with one another. Consequently, credentials
can be removed without checking whether another persistent credential exists.
Applications that require a recoverable login must prevent removal of the last usable credential
in their client workflow.
