# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/json`
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)
- `text/plain`

The response format is determined by content negotiation
using [negotiator](https://github.com/jshttp/negotiator).

## Streams

Reply streams are transmitted
using [chunked transfer encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding#directives).
