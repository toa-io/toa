# A token is refreshed when the client asks

## Design concept

A session token carries the roles it was issued with, and the gateway replaces it once it is older
than `identity.tokens.refresh`. A change of what an identity may do reaches a client holding it at
most that long after the change. A client that has learned of the change — a role granted, told
over a realtime stream — has no way to have it now.

`POST /identity/tokens/refresh/` replaces the token it is presented with, whatever its age, and
answers the identity as `GET /identity/` does:

```http
POST /identity/tokens/refresh/ HTTP/1.1
authorization: Token <current>
accept: application/yaml
```

```http
200 OK
authorization: Token <new>
cache-control: no-store

id: 2428c31ecb6e4a51a24ef52f0c4181b9
roles: [app:editor]
```

### Guarantees

**Refreshing**

1. A session token is replaced however recently it was issued, and the new one carries the roles
   the identity holds when the request is answered.
2. Credentials of any other scheme are answered with a new token, as any request carrying them is
   _(today)_.

**What is refused**

3. A session token issued before the identity's tokens were revoked — its Basic credentials
   changed, the identity banned — is answered `401`, even within `refresh`. A request elsewhere
   with the same token is admitted until `refresh` has passed _(today)_; the refresh is not a way
   around the revocation.
4. A banned identity is answered `401`.
5. A custom token, an OAuth access token included, is answered `403`. A session token issued in its
   place would carry the identity's roles and none of its `scopes`, `permissions` or `aud`.
6. A request without credentials is answered `401`.

**What is not promised**

- That a client learns it should refresh. The resource is asked; nothing tells the client a change
  was made.
- That the token presented stops working. It is valid until its `lifetime`, as a replaced token is
  _(today)_.

### What a client does differently

A client that is told its roles changed asks for a new token, and keeps the one in the
`authorization` header of the reply.

## The changes, by area

1. **`identity.tokens`.** `authenticate` takes `force`. With it, a session token is checked for
   revocation whatever its age and marked for refresh, and a custom token is refused with
   `UNREFRESHABLE`.
2. **Gateway.** A predefined route `/identity/tokens/refresh` with `POST` and the `auth:refresh`
   directive. The directive asks `identity.tokens.authenticate` again with `force` for a session
   token, and marks the identity for refresh; the token is re-issued where any is, at the end of the
   request.
3. **Documentation.** `Token rotation` and `Token resources` of
   [components](../extensions/exposition/documentation/components.md).

## Decisions

- **A resource, not a header on any request.** Authentication is request-agnostic and reads only
  `authorization`; a resource of its own is what `GET /identity/` already is.
- **`POST`.** It produces a credential, which no cache may hold and no prefetch should cause.
- **The revocation is checked on every refresh.** Asked only for an aged token, as rotation does,
  a token revoked a second ago would be exchanged for one issued after the revocation, which no
  check would ever refuse.
- **A custom token is refused rather than re-issued with what it carries.** It is invalidated by
  deleting its key, and one re-issued under another key would outlive that.
- **The token is authenticated twice.** The route is not known when the credential is read, so the
  directive asks again with `force`. Decrypting is local; only this resource pays for it.

## What happens today

A token older than `refresh` is replaced on its next use, which is when roles are read again and
revocation is checked. A younger one is used as it is.

## Stages

1. `force` on `identity.tokens.authenticate`.
2. `auth:refresh` and the predefined route.

## Verification

- A role granted after a token was issued is held by the token the refresh answers.
- A token issued before a password change is refused by the refresh within `refresh`.
- A custom token is refused by the refresh.
- A request without credentials is refused by the refresh.

## Compatibility

A new route under `/identity/tokens/`, whose `:identity` routes are unchanged: an identity id is
never `refresh`. `authenticate` without `force` answers as before.
