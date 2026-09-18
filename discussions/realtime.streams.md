# Realtime streams in exposition

## Design concept

A realtime stream is a resource. A route of the application's own tree declares that it serves
the stream of a key, and whatever authorises the route authorises the stream:

```yaml
# rooms/manifest.toa.yaml
exposition:
  /:id:
    auth:role: moderator
    /stream:
      GET:
        realtime:stream: id
```

A key is a value of a property of an event, as it has always been. What changes is what a key may
be: not only an identity, whose stream `auth:id` protects, but any value — a room, a record, a group
the application makes up — behind whatever directives the route that serves it declares.

The realtime extension is no more. Its two halves go to exposition, which was its only reader:

- the **destination**: a component with realtime routes writes each routed event itself, as an
  [outbox](/documentation/outbox.md) destination — to the stream of each of its keys and to the
  channel of each, in one round trip, and only where the key is consumed;
- the **stream**: the gateway serves `realtime:stream`, reading the stream and the channel of the
  key from Redis.

Nothing consumes events from the broker for realtime any more, and every routed event is written
once, by the process that committed the change.

### Guarantees

**Delivery**

1. An event routed to a key reaches every open stream of that key, whichever gateway replica holds
   it.
2. An event routed to a key that nobody consumes is written nowhere. It costs one round trip to
   Redis, off the operation's path.
3. A key is consumed while a stream of it is open, and for `expire` seconds after the last one
   closed — the window a client reconnects with its token in.
4. What was written to a key while its client was away is replayed when it reconnects with a token
   inside that window, once per event, whichever replica it reconnects to.
5. A stream is authorised when it is opened, by the directives of the route that serves it.

**What is not promised**

6. **At-least-once.** An event is written again where the process that wrote it failed before its
   outbox row was marked. A client may receive it twice, as every consumer of an event may _(today,
   for events)_.
7. **Order.** Events reach a key in the order they were written, and the outbox writes in no
   promised order. A client reconciles by `VERSION` _(today)_.
8. **What was written before a key was consumed.** A client opens the stream first and then reads
   the state it needs; the other way round, an event in between is lost to it.
9. **Revocation while open.** An identity that loses access keeps an open stream until it closes.

### What a component author does differently

Routes are declared as they are — `key` and `expose`, in the manifest or in the context
annotation:

```yaml
# messages/manifest.toa.yaml
realtime:
  created:
    key: [sender, recipient, room]
    expose: [id, room, text, sender]
```

A key that is not an identity is served by a route of the application's that says who may read it.
A client opens one stream per key it is interested in, so where it would be interested in many, the
application routes them to one key: an event carries the group it belongs to — a board, a project,
a watch list — and the group is the key.

## The changes, by area

1. **Exposition: the destination.** Exposition contributes an outbox destination to every
   component with realtime routes. Its `emit(row)` renders each routed event through the component's
   own event bridges — its condition and payload, as the emission does — works out the keys of each
   route, applies its `expose`, and runs one script for the row:

   ```lua
   for _, key in ipairs(KEYS) do
     if redis.call('EXISTS', key) == 1 then
       local id = redis.call('XADD', key, 'MAXLEN', '~', maxlen, '*', 'type', event, 'data', data)
       redis.call('SPUBLISH', key, id .. ' ' .. event .. ' ' .. data)
     end
   end
   ```

2. **Boot.** The destination renders what the emission renders, so boot hands a destination the
   component's event bridges beside its locator, declaration and manifest.
3. **Exposition: `realtime:stream`.** A directive naming the route variable that is the key. For
   a stream of a key, one gateway replica:
   - subscribes to the key's channel (`SSUBSCRIBE`) with the first stream of it, and unsubscribes
     with the last;
   - then writes the `connect` marker, which creates the stream where it was gone and answers the
     first token — subscribed first, so nothing written after the marker misses the stream;
   - replays from the token the client brought, if it brought one;
   - pushes what the channel brings to the streams of the key, and the entry id as the next token;
   - renews the stream's `EXPIRE` once per key every `min(heartbeat, expire / 3)`, and once more
     when the last stream of the key closes;
   - reads the stream from the last id it delivered on every subscribe and every reconnect to
     Redis, since a channel keeps nothing for a subscriber that was away, and pushes what it has not
     delivered.
4. **Exposition: `/realtime/streams/:key`.** Declared by exposition itself with `auth:id: key` and
   `realtime:stream: key`, so a client of today is served as it is.
5. **The realtime extension** is removed: its service, `realtime.streams`, its deployment, its
   package, and dynamic routes with them. The `realtime` manifest key and the `realtime` context
   annotation stay, and declare routes as they did.
6. **The deployment.** A component with realtime routes gets the routes the context annotation
   declares for it, and the Redis exposition reads. An event consumed by realtime alone is no longer
   published to the broker.
7. **`CONTRIBUTING.md`.** _Zero per-request I/O_ allows the interaction that produces the requested
   response, of which an operation call is one kind and a stream another.
8. **Documentation.** `realtime:stream` in exposition's documentation, with routes, keys, grouping
   and the guarantees above; the realtime readme goes.

## Decisions

1. **A stream is a resource.** Access to a stream is access to a resource, and exposition already
   has every way of saying who has it: `auth:id`, `auth:role` with placeholders, `auth:rule`. A
   stream of a room is read by whoever may read the room. What role-based and dynamic routing would
   have added — a second way of saying who receives what — is a route and a directive.
2. **Realtime belongs to exposition.** A stream has no reader but a gateway, and the realtime
   extension carried a copy of exposition's access in `auth:id: key`. Where the stream is served
   and where it is authorised are one place.
3. **The gateway reads the stream.** A stream is the response the request is for, as an operation's
   reply is. Reading it through a component would add a leg per event and a process to scale for
   nothing a component decides.
4. **The destination writes, once.** A reader that wrote what it received would write it once per
   replica that received it, and a key whose client is away has no reader, so nothing would be kept
   for its replay.
5. **One round trip per routed event.** Knowing in every process which keys are consumed would
   spare the trip for keys nobody consumes, at the cost of every process holding every consumed key
   of the deployment and missing the ones consumed a moment ago. The trip is off the operation's
   path, and replaces the publication to the broker that realtime needed.
6. **The stream is its own presence.** It exists while its key is consumed and for `expire` after,
   because the gateway renews it and Redis expires it. A separate record of presence would be a
   second thing to keep in step with the first.
7. **Nothing is done about duplicates.** Deduplicating would keep a record per event for as long as a
   duplicate may come — memory in proportion to everything routed. At-least-once is what every
   consumer of an event already handles.
8. **One stream per key.** A stream of every event would have every replica read every event of the
   deployment, and would share one window between everyone.
9. **Sharded channels.** On a cluster a channel is broadcast to every node, and a sharded one stays
   on the node that owns its name. On a single node they are the same.
10. **Groups, not subscriptions.** A client that would open many streams is served by a key the
    application groups them under, which costs nothing new and keeps what a stream carries decided
    by the application rather than by the client.

## What happens today

1. A component publishes an event to the broker.
2. Every replica of the realtime service receives it through a queue of its own, works out its keys
   from its static routes and its dynamic ones, and for each key:
   - pushes it to the streams of the key it holds;
   - appends it to the key's stream (`XADD`, `MAXLEN ~ maxlen`, `EXPIRE expire`), and pushes the
     entry id as the token.
3. A stream is served by `realtime.streams` at `/realtime/streams/:key` with `auth:id: key`, so a key
   is an identity, and an identity reads nothing it is not named in unless the application creates a
   dynamic route for it.
4. An event is stored once per replica of the service, and a reconnect replays it as many times.
5. A stream's `EXPIRE` is set only by a write: one that receives nothing for `expire` loses its stored
   events while it is open.

## Stages

1. Boot hands a destination the component's event bridges.
2. The destination, with the deployment giving a component its routes and its Redis.
3. `realtime:stream`, and `/realtime/streams/:key` declared by exposition.
4. The realtime extension removed; events consumed by realtime alone no longer published.
5. Documentation, and `CONTRIBUTING.md`.

## Verification

Exposition's features, through HTTP:

- an event reaches a stream served by the application's own route, and a caller the route does not
  authorise is refused the stream;
- an event reaches a stream held by another gateway replica;
- `/realtime/streams/:key` serves an identity's stream as before;
- an event routed to a key nobody consumes creates no stream;
- an event is written once however many replicas hold streams of its key, and a reconnect replays it
  once, on another replica too;
- a stream that receives nothing for longer than `expire` keeps receiving;
- a gateway whose subscriber lost Redis delivers what was written meanwhile once it is back;
- a Redis that is down leaves the row outstanding for realtime alone, and the event arrives once it
  is back;
- an event of a component whose storage has no durable outbox reaches its stream.

## Compatibility

- **Clients:** unchanged — `/realtime/streams/:key`, the `token` event, reconnecting with a token.
- **Declarations:** unchanged — the `realtime` manifest key and context annotation.
- **Deployment:** the realtime service and its queues go, and the `realtime.resources` annotation
  with them. A component with realtime routes reaches the Redis exposition reads.
- **Dynamic routes** go before they were released.
- **Rollout:** a service of before and a gateway of after both write streams during a rollout, so an
  event may be replayed twice across it.
