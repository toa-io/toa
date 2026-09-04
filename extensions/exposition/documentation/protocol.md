# Protocol Support

## Media types

The following media types are supported for both requests and responses:

- `application/json`
- `application/yaml` using [js-yaml](https://github.com/nodeca/js-yaml)
- `application/msgpack` using [msgpackr](https://github.com/kriszyp/msgpackr)
- `text/plain`

A request may also be sent as `application/x-www-form-urlencoded`. A form is read and never
written, so it is not a format a response is negotiated to. A name repeated in a form is read as
the list it is.

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

Multipart responses are encoded using content negotiation,
and the `content-type` of the response is set to one of the custom `multipart/` subtypes,
corresponding to the type of
the parts:

| Response type       | Part type             |
|---------------------|-----------------------|
| `multipart/msgpack` | `application/msgpack` |
| `multipart/yaml`    | `application/yaml`    |
| `multipart/json`    | `application/json`    |
| `multipart/text`    | `text/plain`          |

Multipart responses are started with a text chunk `ACK`, and finished with a text
chunk `FIN`.

Example:

```
GET /stream/ HTTP/1.1
accept: application/yaml
```

```
200 OK
content-type: multipart/yaml; boundary=cut

--cut
ACK
--cut
foo: bar
--cut
baz: qux
--cut
FIN
--cut--
```

See also:

- [Multipart Content-Type](https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html) at W3C
- [Content-Type: multipart](https://learn.microsoft.com/en-us/previous-versions/office/developer/exchange-server-2010/aa493937(v=exchg.140))
  at Microsoft

## HTTP version

The gateway serves HTTP/1.1 by default. `protocol: h2c` serves cleartext HTTP/2 instead.

```yaml
exposition:
  protocol: h2c
  service:
    annotations:
      projectcontour.io/upstream-protocol.h2c: "8000"
```

`h2c` requires an ingress controller that proxies cleartext HTTP/2 upstream, and the
annotation that controller reads to do so. Contour, Traefik and Envoy-based controllers
proxy it; ingress-nginx does not. A cleartext HTTP/2 server answers nothing else on the
same port: there is no ALPN to negotiate with, so a controller that speaks HTTP/1.1 upstream
reaches nothing.

Under `h2c` a request refused before its body is read is answered and then cancelled with
`RST_STREAM(NO_ERROR)`. The reply arrives; the upload stops where it is. A client streaming
a request body sees that body cancelled — in Node, `ERR_STREAM_PREMATURE_CLOSE` on the stream
it passed, which throws if nothing handles it. A real failure shows in the reply, or in the
request rejecting because no reply came. A buffered body is unaffected.

## CORS

[CORS](https://www.w3.org/TR/2020/SPSD-cors-20200602/) is supported,
credentials, any `origin`, and any request header fields are allowed.

The following request headers are allowed:

- `accept`
- `authorization`
- `content-type`
- `etag`
- `if-match`
- `if-none-match`
- headers used by the [`map` directive family](map.md)

The following response headers are exposed:

- `authorization`
- `content-type`
- `content-length`
- `etag`
