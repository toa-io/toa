# Realtime streams

A realtime stream carries the events routed to one key, to whoever reads it. A route of a
component's tree says which key it serves, and whatever authorizes the route authorizes the
stream.

## Routes

A route says which events go to which keys, and what of them: `key` is the property of the event
that is the key, or a list of them, and `expose` is what the event is streamed with.

```yaml
# manifest.toa.yaml
name: messages

realtime:
  created:
    key: [sender, recipient]
    expose: [id, sender, text]
  updated:
    key: room
    expose: [id, room, text]
```

The event is what the component publishes for its entity — its payload, or `state` for an event
that declares none. A key is any value: an identity, a record, a group the application makes up.
Where the property holds a list, the event goes to every key in it.

`expose` is required, and a stream is given nothing it does not name: it is what stands between an
event and whoever reads the streams it is routed to. A route without it is refused when the
manifest is read.

Routes are declared by the component, and only there.

## Serving a stream

`realtime:stream` answers with the stream of a key, which a route variable names. Where the key
comes from is the component's route: below, a message is routed to the stream of its room, and a
room's stream is served at the room's route.

```yaml
# manifest.toa.yaml
namespace: chat
name: messages

entity:
  properties:
    room:
      type: string
    sender:
      type: string
    text:
      type: string

# every message, as it is created, goes to the stream of its room
realtime:
  created:
    key: room
    expose: [id, sender, text]

exposition:
  /rooms/:room/stream:
    auth:role: moderator
    GET:
      realtime:stream: room # the value of :room is the key
```

A message created with `room: general` goes to the stream of the key `general`, which a moderator
reads at:

```http
GET /chat/messages/rooms/general/stream/ HTTP/1.1
authorization: Token ...
accept: application/json
```

```
{"event":"chat.messages.created","data":{"id":"…","sender":"…","text":"Hello!"}}
```

Who may read the stream is decided by the route's directives, as for anything else it serves: an
identity without the `moderator` role is refused, and nothing is opened.

### An identity's own stream

An identity's id is a key like any other. An event goes to an identity's stream where a route takes
its key from a property that holds identity ids:

```yaml
# messages/manifest.toa.yaml
realtime:
  created:
    key: [sender, recipient] # both hold identity ids
    expose: [id, sender, recipient, text]
```

A message created with `recipient: 4c4759e6f9c14f3b8b2cc6e6f4c5b3a0` goes to the stream of that
identity, which reads it at:

```http
GET /realtime/4c4759e6f9c14f3b8b2cc6e6f4c5b3a0/ HTTP/1.1
authorization: Token ...
accept: application/json
```

Every event routed to the identity's id comes to this one stream, whichever component routes it.
The application declares nothing to serve it: the gateway declares the route itself.

```yaml
/realtime/:id:
  auth:id: id
  GET:
    realtime:stream: id
```

## Reading a stream

A stream is a [multipart response](protocol.md#multipart-types). After `ACK`, a part is one of
three:

- **An event** routed to the key: an object whose `event` is the event's full name and whose `data`
  is what the route exposes of it.
- **A token**: an object of the same shape, whose `event` is the word `token` and whose `data` is
  the token. It follows every event, and is sent once when the stream opens. Keep the last one: it
  is what a reader [reconnects](#reconnecting) with.
- **A heartbeat**: a string, `heartbeat <time>`, sent every 16 seconds so that a reader can tell a
  quiet stream from a lost one.

```
--cut
ACK
--cut
{"event":"token","data":"MTcyNjY4OTc0MjAwMC0w"}
--cut
{"event":"default.messages.created","data":{"id":"…","sender":"…","recipient":"…","text":"Hi!"}}
--cut
{"event":"token","data":"MTcyNjY4OTc0NTUxMi0w"}
--cut
"heartbeat 1726689758512"
```

### Reconnecting

A reader that lost its connection reconnects with the last token it was given, and is sent what
was routed to the key since:

```http
GET /rooms/general/stream/?token=MTcyNjY4OTc0MjAwMC0w HTTP/1.1
```

A key's events are kept while it has a reader, and for `expire` seconds after its last reader left
— 300 unless the [annotation](#deployment) says otherwise. A token older than that is answered with
what is left, which may be nothing.

## Guarantees

- An event reaches every open stream of its key, whichever gateway replica serves it.
- An event routed to a key nobody reads is written nowhere.
- An event may arrive twice: it is written again where the process that wrote it failed before it
  noted that it had.
- Events arrive in the order they were written, and they are written in no promised order. A reader
  keeps the version it has and drops an older one — every entity carries `VERSION`.
- What was written to a key before its stream was opened is not sent. Open the stream, then read
  the state it updates.
- Access is checked when a stream is opened. A stream that is open stays open when its reader loses
  access.

## A stream per key

A client opens one stream per key it is interested in. Where it would be interested in many, the
application gives them one key: an event carries the group it belongs to — a board, a project, a
watch list — and the group is the key.

## Deployment

The streams are kept in Redis, which the `realtime` annotation names. It is required where a
component declares routes.

```yaml
# context.toa.yaml
realtime:
  streams: redis://realtime.example.com
  expire: 300 # seconds a key's events are kept after its last reader left; 300 by default
```

`streams` may be a list. Each key is then kept by one of them, the same one for every process, so
the streams are spread over them; changing the list moves keys, and a reader whose key moved is not
sent what it missed. Keys are prefixed with the context, so contexts may share a Redis.

```yaml
realtime:
  streams:
    - redis://realtime-0.example.com
    - redis://realtime-1.example.com
```

The components that route events write them to the streams themselves, and the gateway reads them;
nothing is deployed for realtime of its own. See [metrics](/documentation/metrics.md#realtime) for
what is measured.
