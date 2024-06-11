# Request flow

## `flow:redirect`

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

> Shortcut `redirect` is available.

```yaml
/:
  GET:
    flow:redirect: urls.resolve
```
