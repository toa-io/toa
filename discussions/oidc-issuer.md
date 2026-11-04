# An application that issues OpenID tokens

## Design concept

An application is an OpenID issuer of its own. A component asks `identity.federation` for a
token naming a subject and an audience, and presents it as `Bearer` to another application,
which trusts the issuer the way it trusts any provider: through `identity.federation.trust`,
with the keys it discovers at the issuer's `/.well-known/openid-configuration`.

### Guarantees

**Issuing**

1. `identity.federation.issue` returns a compact JWS signed with ES256 by the first of
   `identity.federation.keys`, whose `kid` its header names.
2. The token carries `iss`, `sub`, `aud`, `iat`, `exp` and `jti`, and no other claim. `iss` is
   `https://` followed by the host the `authorities` of the exposition annotation map the given
   authority to — the issuer [the authorization server](../extensions/exposition/documentation/oauth.md)
   is named by _(today)_.
3. `sub` and `aud` are the caller's: the issuer does not check that `sub` is an identity, or
   that `aud` is anyone it knows.
4. A token is valid for the `lifetime` asked for, 300 seconds without one, and is not issued
   for longer than `identity.federation.lifetime`, 3600 seconds by default.
5. Without keys, or for an authority the annotation does not map, nothing is issued:
   `NOT_ISSUER`.
6. `issue` is not exposed: only a component calls it.

**Discovery**

7. With `issuer: true` in the exposition annotation, `/.well-known/openid-configuration` is
   served to anyone, at every authority, naming the issuer and the key set.
8. `/identity/federation/keys/` serves the public parts of every key, to anyone, cacheable:
   a token signed by a key that is still listed stays verifiable after the key stops signing.
9. Where `oauth` is annotated as well, the document is the authorization server metadata with
   the issuer's fields added to it, and is served at both well-known paths _(today: without
   the issuer's fields)_.

**Trusting** _(today)_

10. An application that lists the issuer in `identity.federation.trust`, with its own `aud`,
    admits the token as `Bearer`, and `auth:claims` admits it by `iss` and `sub`.

**What is not promised**

11. That a token is spent once: it is valid until it expires.
12. That a token stops being valid before it expires. Keys are rotated, not revoked.
13. Claims other than those above, an allowlist of audiences, an HTTP endpoint that issues,
    and ID tokens issued to a person through an authorization flow.

### What a component author does differently

The issuer:

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
        key: $ISSUER_K1 # ES256, PKCS8 PEM
```

```javascript
export async function effect(input, context) {
  const { token } = await context.remote.identity.federation.issue({
    input: { authority: 'nex', sub: 'billing', audience: 'https://api.another.com' }
  })

  return await context.fetch('https://api.another.com/invoices/', {
    headers: { authorization: `Bearer ${token}` }
  })
}
```

The application it calls:

```yaml
# context.toa.yaml
configuration:
  identity.federation:
    trust:
      - iss: https://api.example.com
        aud: https://api.another.com

# manifest.toa.yaml
exposition:
  /:
    GET:
      auth:claims:
        iss: https://api.example.com
        sub: billing
      endpoint: enumerate
```

## The changes, by area

1. `definitions`: `issuer` in the exposition annotation, its schema, and the deployment that
   passes it to the gateway.
2. `extensions/exposition`, discovery: the well-known document is built where `oauth` or
   `issuer` is annotated, with `jwks_uri`, `subject_types_supported` and
   `id_token_signing_alg_values_supported` where `issuer` is.
3. `extensions/exposition`, `identity.federation`: `keys` and `lifetime` in its configuration,
   the computations `issue` and `keys`, and the route `/identity/federation/keys/`.
4. Documentation: `identity.md` and `components.md` of the exposition extension, and the
   discovery section of `oauth.md`.

## Decisions

1. **`identity.federation`, not a component of its own.** It owns trust in issuers, the keys a
   client assertion is signed with, and `jose`. Issuing is the other side of the same
   relationship.
2. **A component calls it, a request does not.** The caller is the application's own code,
   which already decides who it acts as. Who may ask for a token over HTTP, for which subject
   and which audience, is a design of its own, and nothing here needs it.
3. **Two switches.** The document is built from the annotation, as the authorization server's
   is, so serving it takes no I/O; the keys are secrets, which only a component's configuration
   holds. Either without the other issues nothing a verifier accepts.
4. **The issuer is read from the annotation.** `identity.federation` runs in the gateway's
   process and reads the authorities the gateway was deployed with, rather than a second map
   of hosts in its configuration that could disagree with the first.
5. **ES256, as the client assertion is signed.** One algorithm, which every verifier speaks.
6. **First signs, all are published.** A key is rotated by listing the new one after the
   current, deploying, and moving it first once verifiers had time to read it: `jose`, which a
   Toa verifier is, keeps a key set for 10 minutes, and the set is cacheable for 5.
7. **`https` only.** The issuer is named as the authorization server is, and OpenID Connect
   Discovery has it be `https` as RFC 8414 does. A loopback host is no exception, as it is no
   longer one for the authorization server.

## Context

- The trusting side exists: `identity.federation.trust`, discovery of a provider's keys, and
  `auth:claims`.
- [MCP host](mcp-host.md) for the authorization server's discovery this extends.

## What happens today

A token of the authentication system is a JWE encrypted with a symmetric key, which only the
application that issued it can read. `/.well-known/openid-configuration` is served only with
`oauth`, as the authorization server metadata, without `jwks_uri`. One application has no way to
prove to another who is calling.

## Stages

1. This discussion and the documentation.
2. Scenarios: discovery, the key set, a token issued and admitted by `auth:claims`, a token for
   another audience refused, `NOT_ISSUER`.
3. The annotation and the document.
4. The configuration, `keys` and `issue`.

## Verification

- `features/identity.federation.issuer.feature`: the requirements above, with the gateway both
  issuer and verifier, the issuer's host reached at the gateway.
- `features/oauth.discovery.feature`: the document where both are annotated.

## Compatibility

Without `issuer` and `keys` nothing changes. The authorization server metadata of an
application that annotates both gains fields a client that does not know them ignores.

## References

- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [RFC 7517](https://www.rfc-editor.org/rfc/rfc7517), JSON Web Key
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), JSON Web Token
- [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414), Authorization Server Metadata
