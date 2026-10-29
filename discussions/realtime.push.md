# A client pushes to a realtime stream

## Design concept

A route may push its request body to the stream of a key, which every reader of that key is sent
as it arrives. Nothing is stored and nothing is called: the gateway validates the body against the
schema the route declares, stamps it with the identity that sent it, and publishes it on the key's
channel, from which every gateway serving a reader of the key delivers it.

```yaml
# boards/manifest.toa.yaml
exposition:
  /:id/stream:
    auth:role: editor:{id}
    GET:
      realtime:stream: id
  /:id/cursors:
    auth:role: editor:{id}
    POST:
      realtime:push:
        key: id
        event: cursor
        input:
          type: object
          properties:
            x: { type: number }
            y: { type: number }
            tool: { type: string }
          required: [x, y]
          additionalProperties: false
```

A pushed event is volatile: it is for whoever reads the key at the moment it is pushed. It is not
followed by a token, a reader that reconnects is not sent it, and a reader that cannot keep up
loses it. What has to survive — a shape drawn, a comment — is a change of state an operation
commits, routed to the same key by the component as it is today.

### Guarantees

**Delivery**

1. A pushed event reaches every open stream of its key, whichever gateway replica holds it.
2. A pushed event to a key nobody reads is written nowhere and costs one round trip to Redis.
3. A pushed event carries `sender`: the id of the identity that pushed it, or nothing where the
   route admits an anonymous caller. A client cannot push as another identity.
4. What is pushed is what the route's `input` admits, and nothing else: a body the schema refuses is
   answered `400` and pushed nowhere.
5. Who may push is decided by the route's directives, as for anything else it serves. A request
   they refuse pushes nothing.

**What is not promised**

6. **Replay.** A pushed event is not stored. It is followed by no token, and a reader that
   reconnects with a token is sent what was routed since, never what was pushed.
7. **Delivery to a slow reader.** A reader whose connection does not keep up loses pushed events
   rather than holding them; it never loses a routed one. Nor is a pushed event sent to a stream
   that is still being replayed to.
8. **Order against routed events.** Pushed events of one sender reach a reader in the order they
   were pushed; against routed events, in no promised order _(today, for routed events)_.
9. **Other regions.** A pushed event reaches the readers of its region only.

### What a component author does differently

Declares a route that pushes, with the schema of what may be pushed and the event it is streamed
as. A reader tells pushed events by their `sender`, and keeps the last one per sender.

```
{"event":"cursor","sender":"4c4759e6f9c14f3b8b2cc6e6f4c5b3a0","data":{"x":10.5,"y":3,"tool":"pen"}}
```

## The changes, by area

1. **Documentation.** _Pushing to a stream_ in `extensions/exposition/documentation/realtime.md`:
   the directive, the part a reader is sent, and what is not promised. `toa.realtime.pushed` and
   `toa.realtime.dropped` in `documentation/metrics.md`.
2. **`realtime:push`.** A directive of the `realtime` family, beside `stream`: `key` is a route
   variable or a literal, resolved as `stream` resolves it; `event` is the name a reader is sent;
   `input` is a JSON schema, required. Answered `204` once the event is handed to Redis. A method
   declaring both `realtime:push` and `realtime:stream` is refused when the tree is built.
3. **The channel.** A pushed event is published on a channel of its own per key, beside the channel
   routed events are published on, under `${scope}:realtime~:` rather than `${scope}:realtime:`. A
   gateway subscribes to both channels of a key with its first reader, in one command, and to
   neither after its last.
4. **The reader.** A pushed event is delivered without a token and without moving the position a
   reader reconnects from, and is dropped where the reader's buffer is full.
5. **Metrics.** `toa.realtime.pushed`, where a gateway publishes an event, and
   `toa.realtime.dropped`, where it drops one for a reader that does not keep up.
   `toa.realtime.delivered` counts pushed events as it counts routed ones.

## Decisions

1. **The gateway publishes, not a component.** A pushed event is data the system relays and does
   not read. Through an operation it would cost a call over the broker and a component to scale
   for every update; the gateway publishing it costs one round trip to Redis.
2. **A request per event, not a request stream.** A browser streams a request body only in
   Chromium, over HTTP/2 and half-duplex, so a client of any other browser could not push at all.
   A small request per event over the connection the client already holds works everywhere.
3. **Volatile.** An event pushed many times a second is superseded by the next one. Storing it
   would make every reconnect replay a window of positions nobody wants, and a token after each one
   would double what a reader is sent.
4. **Dropped, not buffered.** A reader that falls behind on volatile events gains nothing from
   receiving them late, and holding them would grow the gateway's memory with the slowest reader.
5. **`input` is required.** Whatever a client pushes is sent to every reader of the key. A route
   names what may be pushed, as `expose` names what a routed event may be streamed with.
6. **`sender` is the gateway's.** A reader needs to know whose update it is, and a client cannot be
   trusted to say. It travels beside `data`, not in it, so no schema has to reserve a property.
7. **A channel of its own.** The channel of routed events carries entries of the stream, each with
   an id a reader reconnects from; a gateway of before would read a pushed event there as one.
   Under a prefix of its own no key's channel can be another key's, whatever a key is.
8. **The name a route declares.** A pushed event is the route's, not a component's event, so it is
   sent under the name the route gives it rather than one qualified by a component.

## Context

A routed event is a change of state an operation committed, and is stored for a reader that
reconnects. State that changes many times a second and is superseded each time — where a cursor
is, where a shape is being dragged — has no operation to commit it and nothing worth replaying.
Related: [realtime streams](/discussions/realtime.streams.md), [literal keys](/discussions/realtime.literal.md).

## What happens today

An event reaches a stream only when an operation commits a change and the component routes the
event it publishes. A client relaying its own state to the readers of a key calls an operation that
writes it to storage, at the cost of a broker round trip, a write, and a replay window.

## Stages

1. The directive, the channel and the reader, in one change.
2. Documentation and metrics.

## Verification

`extensions/exposition/features/realtime.push.feature`, through HTTP:

- a pushed event reaches every open reader of its key, with its `sender`, and no token follows it;
- an anonymous route pushes an event without a `sender`;
- a reader of another key is sent nothing, and no stream is created;
- a reader that reconnects with its token is sent what was routed meanwhile and not what was pushed;
- a body the schema refuses is answered `400`, and a request the route refuses is answered `403`,
  each pushing nothing;
- a literal key is pushed to by name, and a route variable holding a literal is answered `404`.

Published on the channel and delivered from it by the gateway that subscribed, a pushed event takes
the path between replicas even where one gateway runs. Unit tests: a reader drops a pushed event
while its buffer is full and while it is replayed to, and keeps its position.

## Compatibility

- **On the wire, additive.** A reader is sent a part it was not sent before, with `sender` beside
  `event` and `data`. Routed events, tokens and heartbeats are unchanged.
- **Declarations, additive.** `realtime:push` is a new directive.
- **Rollout.** A gateway of before subscribes to no channel of pushed events, so its readers are not
  sent them until it is replaced.
