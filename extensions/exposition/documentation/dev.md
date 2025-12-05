# Development tools

## `dev:stub`

Returns a successful response with the given body.

```yaml
/foo:
  dev:sub: Hello!
/bar:
  dev:sub:
    hello: world
```

## `dev:sleep`

Enables random delay before processing the request, up to given maximum time in milliseconds.

Desired delay range can be set in the `sleep` request header as a JSON array of two numbers, the minimum
and maximum delay in milliseconds.

```yaml
/foo:
  dev:sleep: 1000
```

```http
GET /foo/ HTTP/1.1
sleep: [500, 1000]
```
