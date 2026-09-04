# Consent

The one endpoint of the [authorization server](oauth.md) that needs a person, and so the one this
extension does not serve. An application serves it at the URL its `exposition.oauth.authorize`
names.

The page is reached by a client opening it in the user's browser. It authenticates the user, shows
them who is asking, and on their assent redirects back to the client with a code.

## What the page receives

```
GET https://app.example.com/oauth/authorize
  ?response_type=code
  &client_id=https%3A%2F%2Fclaude.ai%2Foauth%2Fclaude-code-client-metadata
  &redirect_uri=http%3A%2F%2Flocalhost%3A3118%2Fcallback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &state=af0ifjsldkj
  &resource=https%3A%2F%2Fapi.example.com%2Fmcp
  &scope=app:notes
```

`state` is the client's and is returned untouched. `code_challenge`, `code_challenge_method`,
`client_id`, `redirect_uri` and `resource` are passed on as they arrived.

## What the page does

The user is authenticated by whatever means the application already offers. The page then holds
that identity's own `Token`, and makes two calls with it.

Who is asking:

```http
GET /identity/clients/https%3A%2F%2Fclaude.ai%2Foauth%2Fclaude-code-client-metadata/ HTTP/1.1
authorization: Token …
```

```yaml
client_id: https://claude.ai/oauth/claude-code-client-metadata
client_name: Claude Code
client_uri: https://claude.ai
logo_uri: https://claude.ai/logo.png
redirect_uris: [http://localhost/callback, http://127.0.0.1/callback]
```

The page displays `client_name`, and **the host of `redirect_uri`**. A loopback redirect is
indistinguishable from any other local process, so the user is told where the code will be sent.

On assent:

```http
POST /identity/grants/:identity/ HTTP/1.1
authorization: Token …
content-type: application/json

{"client": "…", "redirect": "…", "challenge": "…", "method": "S256",
 "scope": ["app:notes"], "resource": ["https://api.example.com/mcp"]}
```

```http
201 Created
cache-control: no-store

{"code": "SplxlOBeZQQYbYS6WxSbIA", "expires_in": 60}
```

`:identity` is the id of the identity that consents, which is the one the page authenticated.

## What the page answers

On assent, a redirect carrying the code, the client's `state`, and the issuer:

```
302 Found
location: http://localhost:3118/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj&iss=https%3A%2F%2Fapi.example.com
```

A single-page application does this with `location.assign`; nothing requires a server redirect.

`iss` is [RFC 9207](https://www.rfc-editor.org/rfc/rfc9207), and the metadata declares that it is
sent, so a client rejects a response without it. Its value is the `issuer` of
`/.well-known/oauth-authorization-server`, which the page may read.

On refusal, a redirect saying so, not an error page:

```
302 Found
location: http://localhost:3118/callback?error=access_denied&state=af0ifjsldkj&iss=https%3A%2F%2Fapi.example.com
```

## Errors

`400` with `error` and `error_description` is answered when the client is unknown, when the
redirect is not one that client may receive a code at, or when the challenge method is not `S256`.
A redirect that was not registered must not be redirected to; the page states the refusal itself.

## Consent is asked every time

A grant is recorded, and `GET /identity/grants/:identity/` lists what a user allowed, but it is
not consulted to skip this page.
