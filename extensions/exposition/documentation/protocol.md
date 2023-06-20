# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/json`
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)

The response format is determined by content negotiation
using [negotiator](https://github.com/jshttp/negotiator).

> Server errors are sent as `text/plain`. See [debug mode](../readme.md#context-annotation).
