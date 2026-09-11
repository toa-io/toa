# Status codes

The gateway may answer with any of these. They mean what
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes)
defines.

- `200 OK`
- `201 Created`
- `202 Accepted`
- `204 No Content`
- `206 Partial Content`
- `304 Not Modified`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`<span class="note">No such route, or nothing found behind it.</span>
- `405 Method Not Allowed`
- `406 Not Acceptable`
- `409 Conflict`
- `412 Precondition Failed`
- `413 Content Too Large`
- `415 Unsupported Media Type`
- `422 Unprocessable Entity`<span class="note">The request is OK, but the application refused it.</span>
- `429 Too Many Requests`
- `500 Internal Server Error`
- `501 Not Implemented`
- `503 Service Unavailable`
- `504 Gateway Timeout`<span class="note">The process a route named did not answer in time.</span>
