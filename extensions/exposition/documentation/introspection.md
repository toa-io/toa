# Resource introspection

Any resource can be introspected by sending an `OPTIONS` request to the resource's path.
[Discovery](discovery.md) answers the same of every resource at once.

What it answers is what the route's directives leave of what the operation declared, for each
method this identity may reach. A method they may not is not there, nor in `Allow`; a resource
whose every method they may not reach is `403`.

A credential does not narrow it. What refuses one at an [`anonymous`](access.md#anonymous) route
is about a reply a cache would hold, and a description is not one — so a route that is public is
described to whoever asks, as it is at `/.rpc` and `/.mcp`.

What the resource itself is, from [`help:node`](help.md), is answered beside the methods rather
than inside one. A verb is upper case, so neither key can be mistaken for the other. A resource
carries `private`, `protected` and `system` where any of its methods does.

Introspection properties:

- `title` and `description` what the route states this method is, from
  [`help:method`](help.md). The operation states what it is too, and that is not this: it is
  written without knowledge of any route, and the same operation mounted twice is two methods
- `private` reaching it is being the identity it is about — [`auth:id`](access.md#id)
- `protected` reaching it takes a role — [`auth:role`](access.md#role)
- `system` and that role is one of the `system` scope, which guards what an application runs
  on rather than what it serves
- `route` route parameters, including what `map:segments` names differently, each as
  [`help:route`](help.md) describes it
- `query` the [query parameters](query.md#parameters) this resource declares, each as
  [`help:query`](help.md) describes it. What selects records — `criteria`, `sort`, `limit`,
  `omit`, `search` — is not among them: it is the same of every queryable resource, and so
  not something one says about itself. A [procedure](rpc.md) carries it, because there it is
  something the caller sends
- `input` input schema, restricted by `io:input`, without what the gateway fills itself
- `output` output schema, restricted by `io:output`; absent where the reply is not sent at all.
  An operation that declares none is described by what its type answers: a transition, an
  observation and an assignment work on the Entity Object, so that is what they are said to
  answer — a set of them where the scope is a set. A computation neither uses the scope nor
  produces one, and an effect answers whatever it computed, so neither is guessed at. It is a
  description and nothing is held to it — an operation answering a projection says so by
  declaring its own `output`
- `errors` error codes

```http
OPTIONS /pots/:id/ HTTP/1.1
accept: application/yaml
```

```http
200 OK
Allow: GET, POST

GET:
  description: Every pot there is, newest first.
  route:
    id:
      type: string
      pattern: ^[a-fA-F0-9]{32}$
  output:
    type: array
    items:
      type: object
      properties:
        title:
          type: string
          maxLength: 64
        volume:
          type: number
          exclusiveMinimum: 0
          maximum: 1000
        temperature:
          type: number
          exclusiveMinimum: 0
          maximum: 300
      additionalProperties: false
      required:
        - id
        - title
        - volume
POST:
  route:
    id:
      type: string
      pattern: ^[a-fA-F0-9]{32}$
  input:
    type: object
    properties:
      title:
        type: string
        maxLength: 64
      temperature:
        type: number
        exclusiveMinimum: 0
        maximum: 300
      volume:
        type: number
        exclusiveMinimum: 0
        maximum: 1000
    additionalProperties: false
    required:
      - title
      - volume
  output:
    type: object
    properties:
      id:
        type: string
        pattern: ^[a-fA-F0-9]{32}$
    additionalProperties: false
  errors:
    - NO_WAY
    - WONT_CREATE
```
