# Realtime streams

A realtime stream carries the events routed to one key, to whoever reads it. A route of a
component's tree says which key it serves, and whatever authorises the route authorises the
stream.

## Routes

A route says which events go to which keys: a property of the event is the key, or a list of them.

```yaml
# manifest.toa.yaml
name: messages

realtime:
  created: [sender, recipient]
  updated:
    key: room
    expose: [id, room, text]
```

The event is what the component publishes for its entity — its payload, or `state` for an event
that declares none. A key is any value: an identity, a record, a group the application makes up.
Where the property holds a list, the event goes to every key in it.

`expose` is what the event is streamed with. Without it, the whole payload goes to every stream it
is routed to.

> :warning:<br/>
> `expose` is the only thing standing between an event and whoever reads the streams it is routed
> to. State it wherever the payload holds anything a reader of the key may not see.

Routes may also be declared in the context, by the full name of the event. A route of the context
takes precedence over the component's own for the same event.

```yaml
# context.toa.yaml
realtime:
  users.profiles.updated: id
  orders.orders.created:
    key: customer
    expose: [id, status]
```

## Serving a stream

`realtime:stream` names the route variable that is the key:

```yaml
# rooms/manifest.toa.yaml
exposition:
  /:room/stream:
    auth:role: moderator
    GET:
      realtime:stream: room
```

```http
GET /rooms/general/stream/ HTTP/1.1
authorization: Token ...
accept: application/json
```

Who may read the stream is decided by the route's directives, as for anything else it serves: an
identity without the `moderator` role is refused, and nothing is opened.

### After an operation

On a method that calls an endpoint, the operation runs first. Where it succeeds, the reply is the
stream instead of what the operation answered; where it fails, the failure is the reply, and no
stream is opened.

```yaml
# presence/manifest.toa.yaml
exposition:
  /:identity:
    auth:id: identity
    POST:
      endpoint: connect
      realtime:stream: identity
```

The operation is where the application decides what a reader follows. Recording the rooms an
identity joined, and routing the events of those rooms to their watchers (`key: watchers`), brings
all of them to the one stream the identity reads.

### An identity's own stream

Every identity reads its own stream, whatever the application declares:

```http
GET /realtime/streams/{identity}/ HTTP/1.1
authorization: Token ...
accept: application/json
```

It is the route below, which the gateway declares itself:

```yaml
/realtime/streams/:key:
  auth:id: key
  GET:
    realtime:stream: key
```

## Reading a stream

A stream is a [multipart response](protocol.md#multipart-types). After `ACK`, each part is one of:

| part               | what it is                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| `{ event, data }`  | an event routed to the key: its full name, and what it was exposed with    |
| `{ event: token }` | where the reader is: after each event, and once when it connects           |
| `heartbeat <time>` | sent every 16 seconds, so a reader can tell a quiet stream from a lost one |

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
watch list — and the group is the key. An [operation](#after-an-operation) that opens the stream is
where a reader's groups are decided.

## Deployment

Realtime streams are kept in Redis: the address the [`stash`](/extensions/stash) annotation gives
`realtime.streams`. A context whose components route events has to name one.

```yaml
# context.toa.yaml
stash: redis://redis.example.com
exposition:
  realtime:
    expire: 300 # seconds a key's events are kept after its last reader left
```

The components that route events write them to the streams themselves, and the gateway reads them;
nothing is deployed for realtime of its own. See [metrics](/documentation/metrics.md#realtime) for
what is measured.
