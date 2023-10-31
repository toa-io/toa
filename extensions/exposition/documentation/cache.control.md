I've made some improvements to the markdown text to enhance clarity and readability:

# Cache-Control

Cache-Control is implemented as an [RTD Directive](tree.md#directives).

> The Cache-Control directive provider is named `cache`, so the full name of the directive is `cache:control`.

## Description

The Cache-Control directive adds the [`Cache-Control` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) to responses.

It is applied exclusively to [safe HTTP methods](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) such as `GET`, `HEAD`, or `OPTIONS`.

By default, this directive is applied only to `2xx` responses, but it can also be applied to `404` responses if necessary.

## Request Flow

The Cache-Control directive is applied as post-processing, occurring after the main request processing.

### Example

#### Default behaviour
```yaml
# context.toa.yaml

/:
  cache:control: max-age=0, must-revalidate
  GET: {}
  /pots:
    GET: {}
    POST: {}
```

Directives are applied to the node where they are attached as well as their nested nodes. Consequently, the `Cache-Control` header will be added to all safe methods in the exposition with `2xx` responses:

```bash
# Request
GET / HTTP/1.1
accept: application/json

# Response
200 OK
Content-Type: application/json
Cache-Control: max-age=0, must-revalidate
``` 

```bash
# Request
GET /pots HTTP/1.1
accept: application/json

# Response
200 OK
Content-Type: application/json
Cache-Control: max-age=0, must-revalidate
``` 

#### Apply to 404 responses

```yaml
# context.toa.yaml

/:
  GET: {}
  /pots:
    cache:control:
      ok: public, no-cache, max-age=60000
      404: public, no-cache, max-age=5000
    GET: {}
    POST: {}
```

The `Cache-Control` header will be added to the `GET /pots` request with both 2xx and 404 responses: 

```bash
# Request
GET /pots HTTP/1.1
accept: application/json

# Response (2xx)
200 OK
Content-Type: application/json
Cache-Control: public, no-cache, max-age=60000
``` 

```bash
# Request
GET /pots HTTP/1.1
accept: application/json

# Response (404)
404 NotFound
Content-Type: application/json
Cache-Control: public, no-cache, max-age=5000
```