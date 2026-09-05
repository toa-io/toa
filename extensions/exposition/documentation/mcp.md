# Model Context Protocol

An application annotates it, and the methods it names as tools are what a model may call.

```yaml
exposition:
  mcp:
    name: Teapots
    instructions: A pot is read by its id. A pot that is brewing cannot be emptied.
    origins: [https://claude.ai]
```

<dl>
<dt><code>name</code></dt>
<dd>Required. What the server calls itself, which a client shows a user.</dd>
<dt><code>instructions</code></dt>
<dd>What a model is told before it calls anything here.</dd>
<dt><code>origins</code></dt>
<dd>Browser origins the endpoint answers. A request carrying an <code>Origin</code> that is not
listed is <code>403</code>, and an empty list admits none; a request carrying none is unaffected.</dd>
<dt><code>anonymous</code></dt>
<dd>Whether the endpoint answers without a credential. It does not unless it says so.</dd>
</dl>

Without the annotation `/.mcp` is a path like any other, and nothing answers there. The path is
fixed: one an application could choose is one it could collide with a route of its own.

## What a tool is

A tool is an RTD method that says it is one, named as the [procedure](rpc.md#the-name) it is.

```yaml
/pots:
  GET:
    endpoint: enumerate
    mcp:tool: true
  /hot:
    GET:
      endpoint: enumerate
      query: { criteria: state==hot }
      mcp:tool: Only the pots that are hot.
```

`true` takes the operation's own [`description`](/documentation/component/declaration.md). A string
replaces it, for one operation mounted twice where the route is what makes the two different. A
method whose operation describes itself and which gives no description of its own is refused where
the tree is built, and so is one on a route that has no name.

`annotations` are read from the verb: `GET` and `HEAD` are `readOnlyHint`, `DELETE` is
`destructiveHint`, `PUT` and `DELETE` are `idempotentHint`.

## What a tool takes

`inputSchema` is the procedure's `params`, which is what the method
[says of itself](introspection.md): a route variable by the name the template gives it, the
querystring under `query`, and what is left is the body. `io:input` restricts it, and a property
`map` fills is not there — a call carries no headers of its own.

```yaml
type: object
properties:
  id: { type: string, pattern: ^[a-fA-F0-9]{32}$ }
  query:
    type: object
    properties:
      criteria: { type: string }
      sort: { type: string }
      limit: { type: integer, minimum: 1, maximum: 100, default: 10 }
      omit: { type: integer, minimum: 0, maximum: 1000, default: 0 }
required: [id]
additionalProperties: false
```

## What a tool answers

`content` carries one `text` block holding the reply's JSON, and `structuredContent` the reply
itself. A reply of nothing is an empty `content`.

`outputSchema` is what the operation declares, restricted by `io:output`. An operation's `output` is
optional and normalizes to `{}`, which describes nothing, and none is stated for it — an
application that wants the schema declares the operation's `output`.

An operation that refuses answers a result with `isError: true` carrying its message, not an error
of the protocol: it is something a model reads and may correct itself by.

## Two revisions

Both are answered from one endpoint that remembers nothing between requests.
[`2026-07-28`](https://modelcontextprotocol.io/specification/2026-07-28) carries the version and
the client's capabilities in every request; `2025-11-25` opens with `initialize`. Which one a
request is, is read from `MCP-Protocol-Version`, or from
`_meta['io.modelcontextprotocol/protocolVersion']` where the header is absent; `initialize` is one
by itself, and a request naming no version is of a revision that sent none.

| method | |
| --- | --- |
| `server/discover` | what is served, and who serves it |
| `tools/list` | every tool this caller may reach, in a stable order |
| `tools/call` | the call the tool is |
| `initialize` | the same as `server/discover`, in the shape a client of `2025-11-25` reads |
| `notifications/initialized` | `202`, and nothing done |
| `ping` | `{}` |

`POST` only, one message per request; `GET` and `DELETE` are `405`. An `Mcp-Session-Id` is ignored
and none is minted, a `Last-Event-ID` is ignored, and `accept` is negotiated as everywhere else.

Of the modern revision, `MCP-Protocol-Version` and `Mcp-Method` are required, and `Mcp-Name` for a
`tools/call`; each must say what the body says. `_meta` states the protocol version and the client's
capabilities. Every result carries `resultType` and names the server in its own `_meta`.

Neither `listChanged` nor a subscription is declared: both are a stream held open, and this endpoint
holds none.

## Authorization

The endpoint is a protected resource, and an application advertises it as one:

```yaml
exposition:
  oauth:
    authorize: https://app.example.com/oauth/authorize
    resources: ['/.mcp']
```

Its RFC 9728 document is then read at `/.well-known/oauth-protected-resource/.mcp`, and the
canonical URI of the resource is `https://api.example.com/.mcp`. See [OAuth](oauth.md).

A request without a credential is `401`, carrying the challenge that names that document — which is
where the flow starts. A call the identity is not authorized to make is `403` with
`error="insufficient_scope"`. Each tool is authorized as the resource it is, against the path and
the verb its name states.

So a route that is [`anonymous`](access.md#anonymous) and nothing else is no tool: `anonymous`
admits a caller who presents no credential, and only such a caller, while a client here always
presents one. Such a method answers `403` and is not listed at all. A tool states who may reach it
holding a credential — [`anyone`](access.md#anyone), a role, or a rule.

## What refuses

| | |
| --- | --- |
| `-32700` | the body is not readable |
| `-32600` | the body is not one JSON-RPC message |
| `-32601` | no method of that name, at `404` |
| `-32602` | the arguments do not fit, or `_meta` states too little |
| `-32603` | anything the gateway did not mean to answer |
| `-32020` | a header says one thing and the body another |
| `-32022` | a revision neither served, naming both |

The codes MCP reserves for itself are `-32020` to `-32099`, and it has an implementation use none of
`-32000` to `-32019` — which is where [JSON-RPC](rpc.md#what-refuses) has this gateway's own, so none
of those is answered here.

## References

- [The specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [JSON-RPC](rpc.md), where a procedure gets its name
- [Introspection](introspection.md), which is what a tool's schemas are
- [Features](../features/mcp.feature)
