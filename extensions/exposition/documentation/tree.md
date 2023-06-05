# Resource Tree Definition

The foundation of a Resource Tree Definition (RTD) is an RTD node.
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

Route declarations can also be flat, meaning that the RTD can have adjacent branches. The following is equivalent to the
above:

```yaml
/users/:user-id: ...
/posts/:post-id: ...
```

> Refer to the [Directives](#directives) section for an explanation of the differences between nested and adjacent RTD
> branches.

An RTD node that does not contain any Routes is called an _RTD leaf_.

Route segments prefixed with a colon `:` are Route Variables. Refer to [Query mapping](tree.query.md) for the details.

## Methods

Methods are mappings of the HTTP methods to the corresponding operations.

A Method is a key named after the corresponding HTTP method, with a value following the schema below:

```yaml
operation: string
query?: Query
```

> Refer to [Query mapping](tree.query.md) for the details.

Methods can be present in any RTD node. However, it is required that an RTD leaf must have at least one Method.

If a Method only has an `operation` key, it can be declared directly as the value of the `operation` key.

```yaml
/teapots:
  GET:
    operation: select
  /hot:
    GET:
      operation: select
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

| HTTP method | Operation type                                 |
|-------------|------------------------------------------------|
| `GET`       | **Observation**<br/>**Computation**            |
| `PUT`       | **Transition** (with Query)<br/>**Assignment** |
| `POST`      | **Transition** (without Query)<br/>**Effect**  |

As method mapping is unambiguous for all operations, except Transition, a consice syntax is available:

```yaml
/posts: observe
/posts/:id: [observe, assign]
```

## Directives

RTD Directives are declared using RTD node or Method keys following the `{provider}:{directive}` pattern and can be used
to add or modify the behavior of request processing. Directive declarations are applied to the RTD node where they are
declared and to all nested nodes.

```yaml
/posts/:user-id:
  authorization:id: user-id
  /:post-id:
    authorization:role: editor
```

In the above example, the Route `/posts/:user-id/:post-id` has both `authorization:id` and `authorization:role`
directives applied.

When it is necessary to avoid directive nesting, a Route can be declared adjacent.

```yaml
/posts:
  /:user-id:
    id: user-id
  /:user-id/:post-id:
    role: editor
```

In this example, the Route `/posts/:user-id/:post-id` has only the `authorization:role` directive applied.

> Directives can be declared without the `{provider}:` prefix unless there are multiple directives with the same name
> across different providers.

See [Access Authorization](./access.md) as an example of directive provider.
