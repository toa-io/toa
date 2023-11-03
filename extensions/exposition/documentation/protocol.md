# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/json`
- `text/plain`

The response format is determined by content negotiation
using [negotiator](https://github.com/jshttp/negotiator).

### Multipart types

Multipart responses are endoded using content negotiation, and the content type of the response is set to one of the
following:

- `multipart/msgpack` - each part is a MessagePack document
- `multipart/yaml` - each part is a YAML document
- `multipart/json` - each part is a JSON document
- `multipart/text` - each part is a plain text document

```
GET /stream/ HTTP/1.1
accept: application/yaml
```

```
200 OK
content-type: multipart/yaml; boundary=-

---
foo: bar
---
baz: qux
-----
```

See also:

- [Multipart Content-Type](https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html) at W3C
- [Content-Type: multipart](https://learn.microsoft.com/en-us/previous-versions/office/developer/exchange-server-2010/aa493937(v=exchg.140))
  at Microsoft
