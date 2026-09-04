# JSON-RPC

An application annotates it, and every resource it exposes answers as a procedure as well.

```yaml
exposition:
  rpc: {}
```

Without it `/.rpc` is a path like any other, and nothing answers there. The path is fixed:
one an application could choose is one it could collide with a route of its own.

## The name

A procedure is an RTD method — a node and a verb — and its name is written the way the node
is declared: the route template with its slashes trimmed, then `#` and the verb.

| route | verb | method |
| --- | --- | --- |
| `/pots` | `GET` | `pots#GET` |
| `/pots` | `POST` | `pots#POST` |
| `/pots/:id` | `GET` | `pots/:id#GET` |
| `/identity/tokens/:identity` | `POST` | `identity/tokens/:identity#POST` |
| `/files/**` | `GET` | `files/**#GET` |
| `/` | `GET` | `#GET` |

Neither `#` nor `/` occurs in a path segment, so one name states one procedure and no two
procedures share one. Nothing is declared to make a name: a re-mounted route is a renamed
procedure, because the name is the address.

A route whose segment is `*` has no name — there is nothing to write where the caller cannot
say what goes there.

## The parameters

`params` is by name, and carries what a request carries.

A key the template names is a route variable, and is taken by the path. `query` is the
querystring. Whatever is left is the body.

```json
{"jsonrpc": "2.0", "id": 1, "method": "pots/:id#GET", "params": {"id": "a1b2"}}
```

```json
{"jsonrpc": "2.0", "id": 2, "method": "pots#POST",
 "params": {"title": "Kettle", "volume": 1.7}}
```

```json
{"jsonrpc": "2.0", "id": 3, "method": "pots#GET",
 "params": {"query": {"criteria": "volume=gt=1", "limit": 10}}}
```

The querystring has a name of its own because an operation's input is free to have an `id` or
a `limit`, and the two would otherwise be one object. An operation whose input has a property
named `query` cannot be called with one.

A variable stands for a single segment, so its value may not contain `/`, `?` or `#`. A `**`
stands for the rest of the path and may contain `/`.

## What answers

The reply is the operation's, restricted by the same [`io:output`](io.md) as the resource's,
and encoded as the request's `accept` asks. A call that returned nothing answers `result: null`
— JSON-RPC has no 404, and nothing went wrong.

A call with no `id` is a notification: it runs and answers nothing, and a request carrying only
notifications answers `204`.

## What refuses

The whole request is refused, with a status, when it is not a request this endpoint serves: a
verb other than `POST` is `405`, an unreadable body is `400`, and anything that is not one call
is `400`.

A credential is the request's, so a call cannot be refused for one: a request that presents
none where the procedure requires one is `401`, and carries the challenge that says where to
authenticate.

Everything else a call runs into is a value, at `200`, because the request itself succeeded.

| | |
| --- | --- |
| `-32601` | no route of that name, or no such verb on it |
| `-32602` | a variable is missing, or a query is not one |
| `-32000` | the identity is not authorized to make this call |
| `-32001` | the operation refused, its own code in `data.code` |
| `-32603` | anything the gateway did not mean to answer |

The first five codes JSON-RPC states mean the same to every client. `-32000` and `-32001` are
this gateway's, from the block the specification reserves and leaves empty, so
`-32001` says only that an operation refused — `data.code` is the code that operation declares
in its manifest, and is what a caller reads.

## Authorization

A procedure is authorized as the resource is, against the path and the verb its name states.
A token restricted to `/pots/:id/` for `GET` authorizes `pots/:id#GET` and nothing else,
whichever way the call arrives.

## What has no procedure

`map:buffer` reads the request, and a call is not the request. A resource that declares it
answers over HTTP alone.
