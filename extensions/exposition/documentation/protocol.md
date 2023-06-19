# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/json`
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)

The response media type is determined by content negotiation
using [negotiator](https://github.com/jshttp/negotiator).

> If no `accept` header is provided and the response contains a body,
> the media type specified in the `content-type` of the request is used.
> If the `content-type` was not specified, then `application/yaml` is used.
