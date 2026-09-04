# OAuth 2.1 Authorization Server

An application exposes an authorization server by annotating one, and none without it. A client
authorized this way holds a token of the identity that consented, and presents it as `Bearer`.

## Annotation

```yaml
exposition:
  authorities:
    local: api.example.com
  oauth:
    authorize: https://app.example.com/oauth/authorize
    resources: ['/mcp/']
    scopes: [app:notes, app:notes:read]
    registration: closed
```

<dl>
<dt><code>authorize</code></dt>
<dd>Required. The absolute URL of the consent page. The application serves it; see
<a href="consent.md">Consent</a>.</dd>
<dt><code>resources</code></dt>
<dd>Paths a token may be restricted to. Each is advertised as a protected resource.</dd>
<dt><code>scopes</code></dt>
<dd>What a client may ask for. Each is a <a href="access.md#roles">role</a>, or a scope within
one.</dd>
<dt><code>registration</code></dt>
<dd><code>open</code> advertises the registration endpoint, <code>closed</code> does not.
Defaults to <code>closed</code>.</dd>
</dl>

The issuer is the authority's configured host, over `https` unless the host is a loopback one.

## Discovery

Two documents are served, at the paths their specifications fix, to anyone.

`/.well-known/oauth-authorization-server` is
[RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) metadata:

```yaml
issuer: https://api.example.com
authorization_endpoint: https://app.example.com/oauth/authorize
token_endpoint: https://api.example.com/identity/grants/
registration_endpoint: https://api.example.com/identity/clients/
response_types_supported: [code]
grant_types_supported: [authorization_code]
code_challenge_methods_supported: [S256]
token_endpoint_auth_methods_supported: [none]
client_id_metadata_document_supported: true
authorization_response_iss_parameter_supported: true
```

`/.well-known/oauth-protected-resource` is
[RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) metadata. Each configured resource has one of
its own, at the path the well-known segment is followed by: `/mcp/` is read at
`/.well-known/oauth-protected-resource/mcp`.

```yaml
resource: https://api.example.com/mcp
authorization_servers: [https://api.example.com]
bearer_methods_supported: [header]
```

`/.well-known/openid-configuration` answers with the authorization server metadata, for a client
that reads only that.

A reply of `401` carries the challenge that names the document:

```http
401 Unauthorized
www-authenticate: Bearer resource_metadata="https://api.example.com/.well-known/oauth-protected-resource/mcp", scope="app:notes"
```

## Clients

A `client_id` that is an `https` URL is a
[Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00):
the client publishes what it is at that URL, and the document is read from there. Only origins
`identity.clients` is configured to trust are read, and an empty list reads none:

```yaml
configuration:
  identity.clients:
    trust:
      - https://claude.ai
```

Anything else was registered through
[RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), which `registration: open` advertises:

```http
POST /identity/clients/ HTTP/1.1
content-type: application/json

{"client_name": "Claude", "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"]}
```

```http
201 Created

{"client_id": "c8f3a1e4d8c9b2f6a0e5d7c3b1a9f8e2", "client_name": "Claude", …}
```

A registration is addressed by a hash of what it says, so the same metadata is one client however
many times it arrives. A registration cannot be changed: a revision is a different client.

Only public clients are supported. `token_endpoint_auth_method` other than `none` is refused.

`redirect_uris` are matched exactly, except for a loopback address, where the port is ignored
([RFC 8252 §7.3](https://datatracker.ietf.org/doc/html/rfc8252#section-7.3)).

`GET /identity/clients/:id/` returns a client to any authenticated identity, which is what the
consent page reads.

## Token endpoint

`POST /identity/grants/`, anonymous, `application/x-www-form-urlencoded`.

```http
POST /identity/grants/ HTTP/1.1
content-type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlO&code_verifier=dBjftJeZ&redirect_uri=…&client_id=…
```

```http
200 OK
cache-control: no-store

{"access_token": "…", "token_type": "Bearer", "expires_in": 2592000}
```

`code_verifier` is required: the code was issued against its `S256` hash
([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)). A code may be redeemed once, and is spent
whether or not the verifier matches. Every refusal is `invalid_grant`.

A code is valid for `identity.grants.lifetime` seconds, 60 by default. A token is valid for
`identity.grants.token` seconds, 30 days by default; `0` is until it is revoked.

## Grants

A grant is what a user allowed a client. One is held per identity per client.

`GET /identity/grants/:identity/` lists them. `DELETE /identity/grants/:identity/:id/` revokes one,
which disables the key its token was issued under: the token stops being one within
`identity.tokens.cache.ttl`.

## Tokens

An access token is a token of the identity that consented, carrying the
[roles](access.md#roles) that identity holds, or the subset the client asked for as `scope`. It is
presented as `Bearer`, which `identity.federation` also answers to — see
[Bearer scheme](identity.md#bearer-scheme).

## References

- [OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [Consent](consent.md), the page an application serves
- [Features](../features/oauth.grants.feature)
