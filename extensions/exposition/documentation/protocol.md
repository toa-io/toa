# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/json`
- `text/plain`

The response format is determined by content negotiation
using [negotiator](https://github.com/jshttp/negotiator).

```http
GET / HTTP/1.1
accept: application/yaml
```

```
200 OK
content-type: application/yaml

foo: bar
```

### Multipart types

Multipart responses are endoded using content negotiation,
and the `content-type` of the response is set to one of the custom `multipart/` subtypes,
corresponding to the type of
the parts:

| Response type       | Part type             |
|---------------------|-----------------------|
| `multipart/msgpack` | `application/msgpack` |
| `multipart/yaml`    | `application/yaml`    |
| `multipart/json`    | `application/json`    |
| `multipart/text`    | `text/plain`          |

Example:

```
GET /stream/ HTTP/1.1
accept: application/yaml
```

```
200 OK
content-type: multipart/yaml; boundary=cut

--cut
foo: bar
--cut
baz: qux
--cut--
```

See also:

- [Multipart Content-Type](https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html) at W3C
- [Content-Type: multipart](https://learn.microsoft.com/en-us/previous-versions/office/developer/exchange-server-2010/aa493937(v=exchg.140))
  at Microsoft

## CORS

[CORS](https://www.w3.org/TR/2020/SPSD-cors-20200602/) is supported,
credentials, any `origin`, and any request header fields are allowed.

The following response headers are exposed:

- `authorization`
- headers used with the [`vary:embed` directive](vary.md#raw-headers)
