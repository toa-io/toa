# Multipart responses

Object streams are returned as multipart responses with non-standard media
types. The media type of the parts is chosen by the same content negotiation as
any other request, once for the whole stream, not per part. The response media
type determines the media type of every part, so part headers are omitted.

```http
GET /stream/
accept: application/json
```

```http
200 OK
content-type: multipart/json; boundary=cut

--cut

"ACK"
--cut

{"foo":"bar"}
--cut

{"baz":"qux"}
--cut

"FIN"
--cut--
```

- `multipart/json` → `application/json`
- `multipart/yaml` → `application/yaml`
- `multipart/msgpack` → `application/msgpack`
- `multipart/text` → `text/plain`

A streamed response starts with `ACK` and ends with `FIN`. The boundary is
always `cut`.
