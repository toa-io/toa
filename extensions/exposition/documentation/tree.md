# Resource Tree Declaration

The foundation of a Resource Tree Declaration (RTD) is an RTD node.
An RTD node is an object that consists of _Routes_, _Methods_ and _Directives_.

## Routes

A Route is a key starting with `/` and it has a value as a nested RTD node.

```yaml
/:
  /users:
    /:user-id: ...
  /posts:
    /:post-id: ...
```

Route declarations can also be flat, meaning that the RTD can have adjacent branches.
The following will represent the same resources as the above:

```yaml
/users/:user-id: ...
/posts/:post-id: ...
```

> Refer to the [Directives](#directives) section for an explanation of the differences between
> nested and adjacent RTD branches.

An RTD node that does not contain any Routes is called an _RTD leaf_.

> Route declarations must not have a trailing slash.

### Route variables

Route segments prefixed with a colon (`:`) are Route variables.

> A segment may include a reference to a single variable.
> For instance, in the route `/messages/:sender-:recipient`,
> a single variable is declared with the name `sender-:recipient`.

Refer to [Query mapping](query.md) for the details.

### Route conflicts

Routes with specific, non-variable segments are given precedence in routing decisions.

Consider the following route declarations:

```yaml
/users/:id: ...
/users/hot: ...
```

Request made to `/users/hot/`, will be routed to the second `/users/hot` Route,
as it provides a more specific match compared to the generic `/users/:id` route.

The priority of Routes with the same specificity is determined by the order of declaration.

## Route forwarding

A Route can be forwarded to another Route by using the `forward` key.

```yaml
/dest/:var: ...
/static:
  forward: /dest/hello
/variables/:foo/:bar: # foo is lost
  forward: /dest/:bar
```

Forwarding Route variables are mapped to the forwarded Route variables if they have the same name.

Directives attached to the destination Route are not executed.

## Methods

Methods are mappings of the HTTP methods to the corresponding operations.

A Method is a key named after the corresponding HTTP method, with a value following the schema
below:

```yaml
endpoint: string
query?: Query
```

> Refer to [Query mapping](query.md) for the details.

Methods can be present in any RTD node.
However, it is required that an RTD leaf must have at least one Method.

If a Method only has an `operation` key, it can be declared directly as the value of the `operation`
key.

```yaml
/teapots:
  GET:
    endpoint: select
  /hot:
    GET:
      endpoint: select
      query:
        criteria: state==hot
/posts:
  GET: select
  POST: transit
  /:post-id:
    GET: observe
    PUT: transit
```

HTTP methods can only be mapped to operations of the corresponding types.

| HTTP method | Operation type                                |
|-------------|-----------------------------------------------|
| `POST`      | **Transition** (without Query)<br/>**Effect** |
| `PUT`       | **Transition** (with Query)<br/>**Effect**    |
| `GET`       | **Observation**<br/>**Computation**           |
| `PATCH`     | **Assignment**<br/>**Effect**                 |

As method mapping is unambiguous for Observation, Assignment, and Computation, a concise syntax is
available:

```yaml
/items: compute
/items/:id: [observe, assign]
```

### Projections

A Method can have a `projection` key that specifies the fields of the operation result to be
included in the response.

```yaml
/teapots:
  GET:
    endpoint: select
    projection:
      - name
      - state
```

> `id` is always included in the projection.

## Intermediate Nodes

An RTD Node that has a Route with a key `/` is an _intermediate_ Node.
Intermediate Nodes must not have Methods as they are unreachable.

```yaml
/posts: # Node is intermediate
  GET: select # INVALID: Method is unreachable
  /:
    PUT: transit
```

## Directives

RTD Directives are declared using RTD node or Method keys following the `{family}:{directive}`
pattern and can be used
to add or modify the behavior of request processing. Directive declarations are applied to the RTD
node where they are
declared and to all nested nodes.

```yaml
/posts/:user-id:
  authorization:id: user-id
  /:post-id:
    authorization:role: editor
```

In the above example, the Route `/posts/:user-id/:post-id/` has both `authorization:id`
and `authorization:role` directives applied.

When it is necessary to avoid directive nesting, a Route can be declared adjacent.

```yaml
/posts:
  /:user-id:
    id: user-id
  /:user-id/:post-id:
    role: editor
```

In this example, the Route `/posts/:user-id/:post-id/` has only the `authorization:role` directive
applied.

Another way to avoid nesting is to declare an _isolated_ Node as follows:

```yaml
/posts:
  /:user-id:
    id: user-id
    /:post-id:
      isolated: true
      role: editor
```

See [Access Authorization](./access.md) as an example of directive provider.
