# Note: Server Sent Events

## TL;DR

1. Doesn't exist.
2. Ridiculous.
3. Redundant.

## There is no SSE

The initial premise of SSE is to deliver real-time events specifically targeted at a particular user. It's evident that
to access these events, user authentication is essential, typically implemented through
an [HTTP Authentication framework](https://datatracker.ietf.org/doc/html/rfc2617).

However, despite this being the most straightforward
scenario, [SSE does not work this way](https://github.com/whatwg/html/issues/2177). The only viable way to use SSE is
to avoid the standard `EventSource` implementation.

## Peculiar event format

### SLAP

[Event stream format](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
defines four fields: `event`, `data`, `id`, `retry`.

In practice, code capable of producing such an object is forced to break the Single Level of Abstraction Principle. This
requires knowledge of both event structures and connection properties. In real-world systems, these may be handled by
different processes, such as an Events microservice and an API Gateway.

### Content negotiation

The `data` property is expected to be an arbitrary string, although real-world event data is often structured as an
object.

Furthermore, since the Event stream format defines its own content type, there is no built-in way to negotiate the
format of the events.

Additionally, the data value is limited to a single line, which hinders the use of
more [human-friendly formats](https://yaml.org) in a straightforward manner.

## HTTP is enough

Rather than resorting to a non-standard client and a predefined content format, a basic HTTP request can provide a
solution:

```http
GET /events HTTP/1.1
accept: application/yaml
```

```
200 OK
content-type: application/yaml
transfer-encoding: chunked

id: 1
event: created
data:
  foo: bar

id: 2
event: deleted
data:
  bar: baz
```

The server-side implementation with flow control and stream termination handling is trivial:

```javascript
eventStream.pipe(response)
```
