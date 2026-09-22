# MCP on a host of its own

## Design concept

The MCP endpoint may be given a host of its own within an authority. On such a host `POST /` is the
endpoint, its protected-resource document is read at the origin, and nothing else answers there.

The host is the authority it is declared under: the same identities, the same credentials, the same
value `map:authority` writes.

### Guarantees

**The host**

1. An MCP host is declared under the authority it belongs to, and is a host of it.
2. On an MCP host `POST /` is the MCP endpoint, and answers what `POST /.mcp` on the authority's own
   host answers to the same caller.
3. A credential issued on the authority's own host is the credential on its MCP host, and the
   identity it names is one identity.
4. Nothing else on an MCP host answers: an application's routes, `/.rpc`, `/.mcp` and `/.discovery`
   are `404` there, and `GET /` is `405`.
5. `/.mcp` answers on the authority's own host, whether or not an MCP host is declared *(today)*.
6. An MCP host is an ingress host of the gateway, as an authority's host is *(today)*.
7. An MCP host under a key that names no declared authority fails the deploy.
8. A host no annotation names is an authority of its own name *(today)*.

**Authorization**

9. The protected-resource document of an MCP host is read at `/.well-known/oauth-protected-resource`
   of that host. It names the host's origin as the resource, and the authority's issuer as the
   authorization server.
10. A request to an MCP host refused for want of a credential is `401` naming that document.
11. An MCP host serves no authorization-server metadata: `/.well-known/oauth-authorization-server`
    and `/.well-known/openid-configuration` are `404` there.
12. A token asked for with the MCP host's origin as its `resource` is admitted on that host, and
    refused on every other host *(today: an audience is covered by hostname and path)*.

**What is not promised**

13. An MCP host is not an issuer. What a client authorizes against is the authority's host, which
    the protected-resource document names.
14. An authority is one host, as it is *(today)*. An MCP host is not a second name for the
    application: it serves the endpoint alone.

### What a component author does differently

```yaml
# context.toa.yaml

exposition:
  authorities:
    nex: nex.toa.io
  oauth:
    authorize: https://app.nex.toa.io/oauth/authorize
    resources: ['/.mcp']
  mcp:
    name: Teapots
    hosts:
      nex: mcp.toa.io
```

A model is then pointed at `https://mcp.toa.io`, discovers the authorization server from the
document at that origin, and comes back with a token bound to it.

## The changes, by area

1. **`@toa.io/definitions`.** `mcp.hosts` is a host per authority, in the annotation type and in
   its schema. The deployment renders them into the ingress beside the authorities' own, and fails
   where an `mcp.hosts` key names no authority.
2. **The HTTP server.** The map it inverts the annotation into — host to authority identifier —
   holds every MCP host under the authority its key names. What reads the identifier reads what it
   read before.
3. **The gateway.** A request whose host is an MCP host is served MCP at `/` and `404` anywhere
   else, decided where `/.rpc` and `/.mcp` already are. The MCP server holds the set, because it
   holds the annotation.
4. **OAuth discovery.** The documents of a host are built from two strings rather than one: the
   origin they are read from, and the issuer they name. An MCP host is given a document of the
   origin alone, and the challenge that names it.
5. **The discovery UI.** Its interceptor passes an MCP host by, so the gateway's cut answers it.
6. **Documentation.** `documentation/mcp.md` on the host and what answers there,
   `documentation/authorities.md` on whose authority it is, `documentation/oauth.md` on the second
   document and what a token is bound to.

## Decisions

**The host is declared inside `mcp`, keyed by the authority.** The key is the authority identifier,
so what identity a caller has there follows from the declaration and is not stated twice. A bare
`mcp.host` string says nothing about which authority's tokens are valid on it, and a context serving
two domains could not give each an MCP host.

**An authority stays one host.** A second name for the application would be a second name for its
authorization server — a client that read the metadata at one name and the resource at the other
would hold a token bound to a host it does not call. An MCP host is not that: what it serves is one
resource, with a document of its own naming the authority as the server to get a token from.

**An MCP host serves no authorization-server metadata.** The document would have to name the
authority's issuer, which is not the origin it was read from, and a client that checks is right to
reject it. The protected-resource document is what points at the issuer, and it is served there.

**The MCP host answers MCP and nothing else.** A host given to a model is an address with one
meaning; serving the application's tree on it would publish over that host everything the tool
catalogue is deliberately a subset of.

**`/.mcp` keeps answering.** A client already pointed at it stays pointed at it, and a redeploy that
adds a host does not end a flow in the middle.

## What happens today

MCP is served at `/.mcp` on every host the gateway answers on. A request to a host `authorities`
does not name is an authority of that host's name: its routes are served, and every credential
issued elsewhere is unknown to it.

## Verification

`extensions/exposition/features/mcp.host.feature`:

1. `tools/list` on `POST /` of the MCP host answers what `POST /.mcp` of the authority's host does.
2. `/.mcp` still answers on the authority's host with an MCP host declared.
3. The protected-resource document at the MCP origin names that origin and the authority's issuer.
4. `/.well-known/oauth-authorization-server` is `404` on the MCP host.
5. `POST /` there without a credential is `401` naming that document.
6. A token bound to the MCP origin is admitted there and refused at `/.mcp` of the authority's host;
   one bound to `https://nex.toa.io/.mcp` is refused on the MCP host.
7. A credential issued on the authority's host authenticates on the MCP host.
8. `/.discovery/`, `/.rpc`, `/.mcp` and an application's route are `404` on the MCP host, and
   `GET /` is `405`.
9. A host no annotation names serves the application's routes, and `POST /` on it is not MCP.

## Compatibility

`mcp.hosts` is additive: it is absent unless written, and a context that does not write it is served
as it is. The documents, the challenges and the audiences of an authority's own host do not change.

## References

- [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414), authorization server metadata
- [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728), protected resource metadata
- [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
