# Request flow

## `flow:fetch`

Fetches the content from the resource returned by the specified endpoint.

The value of the directive is a `string` specifying endpoint to be called for the redirection
request.

Request `authority`, `path` and `parameters` are passed as input to the redirection endpoint,
and it must return a URL `string`, an `Error` or an object with the following properties:

```yaml
url: string
options?:
  method?: string
  headers?: Record<string, string>
  body?: string
```

If it returns a URL or Request, then the response to the specified request is returned as the
response to the original request, along with the `content-type`, `content-length`, and `etag`
headers.

## `flow:compose`

Compose an object from a response stream in object mode.

The value of the directive is an object whose values are JavaScript expressions
accessing the response stream objects composed into an array named `$`.

```yaml
flow:compose:
  one: $[0].status
  two: $[1].data.foo
  three: $[2].amount
```

```yaml
flow:compose:
  sum: $[0].value + $[1].value
```

Be careful.
