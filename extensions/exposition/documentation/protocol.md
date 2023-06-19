# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/json`
- `application/yaml`[^1]
- `application/msgpack`[^2]

The response media type is determined by content negotiation[^3].

[^1]: [js-yaml](https://github.com/nodeca/js-yaml)

[^2]: [msgpackr](https://github.com/kriszyp/msgpackr)

[^3]: [negotiator](https://github.com/jshttp/negotiator)
