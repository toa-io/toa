# Realtime as an outbox destination

## Design concept

Realtime stops consuming events. A component that declares realtime routes writes each routed event
itself, as an [outbox](/documentation/outbox.md) destination. The Redis stream of the key gets it
once, and the channel of the key gets it once, in one round trip. The realtime service no longer
receives anything from the broker. It holds connections, subscribes to the channels of the keys it
holds, keeps their streams alive and replays from a token.

Today every replica of the service receives every event, and every one of them writes it to the
stream of its key. An event is stored as many times as there are replicas, and a reconnect with a
token replays it as many times. This design removes that: an event has one writer, the process
that committed the change.

### Guarantees

**Delivery**

1. An event routed to a key reaches every connection of that key, whichever replica holds it.
2. An event routed to a key that nobody consumes is written nowhere. Its cost is one round trip to
   Redis, off the operation's path.
3. A key is consumed while it has a connection and for `expire` seconds after the last one left:
   the window a client reconnects with its token in. The window starts again at every connection.
4. What was written to a key while its client was away is replayed when it reconnects with a token
   inside that window, once per event, whichever replica it reconnects to.

**What is not promised**

5. **At-least-once.** An event is written again where the process that wrote it failed before its
   outbox row was marked, and the pump publishes the row again. A client gets it twice. Every
   consumer of an event is idempotent already; a client of realtime is one of them _(today, for
   events)_.
6. **Order.** Events reach a key in the order they were written, and they are written in no
   promised order: the outbox gives none. A client reconciles by `VERSION`, as it has to already
   _(today)_.
7. **An event written while its key was not consumed is lost to it.** A client opens its stream
   and then reads what it needs, not the other way round.

### What a component author does differently

Nothing in the manifest. Routes are declared as they are:

```yaml
# manifest.toa.yaml
realtime:
  created: [sender, recipient]
```

The deployment provisions a Redis for the realtime extension, as it already does for its stash.

## The changes, by area

1. **The destination.** The realtime extension contributes a
   [destination](/runtime/core/source/types/outbox.ts) to every component with realtime routes. Its
   `emit(row)` renders each routed event through the component's own event bridges — condition
   and payload, as the emission does — works out the keys of each route, applies its `expose`, and
   runs one script for the row:

   ```lua
   -- KEYS: the streams of the event's keys; ARGV: event, data, maxlen
   for _, key in ipairs(KEYS) do
     if redis.call('EXISTS', key) == 1 then
       local id = redis.call('XADD', key, 'MAXLEN', '~', ARGV[3], '*', 'type', ARGV[1], 'data', ARGV[2])
       redis.call('SPUBLISH', key, cjson.encode({ id, ARGV[1], ARGV[2] }))
     end
   end
   ```

   A stream that exists is a key that is consumed; the destination learns nothing else of who is
   connected.

2. **Boot.** The destination renders what the emission renders, so boot hands it the component's
   event bridges. A destination is made from the locator, the declaration and the manifest today,
   which carry no bridge.
3. **The service.** It consumes no event, and `Routes` and `Receiver` go. For every key it holds a
   connection of, one replica:
   - subscribes to the key's channel (`SSUBSCRIBE`) with its first connection, and unsubscribes
     with its last;
   - then writes the `connect` marker, which creates the stream if it was gone and answers the
     first token — subscribed first, so nothing written after the marker misses the connection;
   - pushes what the channel brings to the key's connections, the entry id as the token after it;
   - renews the stream's `EXPIRE` to `expire` once per key every `min(heartbeat, expire / 3)`,
     and once more when the last connection of the key leaves;
   - reads the stream (`XREAD`) from the last id it delivered to the key, on every subscribe and
     every reconnect of its subscriber, since a channel keeps nothing for a subscriber that was
     away. What arrives twice is told by its id and pushed once.
4. **Replay.** As today: `XREAD` from the token, on the key's stream.
5. **The deployment.**
   - Routes declared in the context annotation reach the components they route, not only the
     service.
   - An event consumed by realtime alone is no longer published to the broker: `TOA_EVENTS_*`
     stops counting realtime among its consumers, and the service gets no queue.
6. **Documentation.** The realtime readme states the delivery guarantees above, the order a client
   connects in, and that the realtime extension needs a Redis.

## Decisions

1. **The destination writes the stream, not the service.** A service replica writing what its
   channel brings writes it once per replica subscribed to the key, which is the problem this
   removes; and a key whose client is away has no replica subscribed, so what it missed would be
   written nowhere and replay would have nothing to replay.
2. **One round trip per routed event, not a copy of who is connected in every process.** Knowing
   locally which keys are consumed would spare the round trip for keys nobody consumes, at the
   price of every process holding every consumed key of the deployment and a window in which a
   new connection is not yet known. The round trip is off the operation's path, and it replaces
   the publication to the broker that realtime needed.
3. **The stream is its own presence.** It exists while its key is consumed and `expire` after,
   because the service renews it and Redis expires it. A separate record of presence would be a
   second thing to keep in step with the first.
4. **Nothing is done about duplicates.** Deduplicating in Redis would keep a record per event for
   as long as a duplicate may come, which is memory proportional to everything routed. A duplicate
   is what at-least-once has always meant for every consumer, and a client of realtime is one.
5. **One stream per key, as now.** A single stream of every event would have every replica read
   every event of the deployment, and its window would be shared by everyone.
6. **Sharded channels.** On a Redis Cluster a channel is broadcast to every node, while a sharded
   one stays on the node that owns its name. On a single node the two behave the same.

## Context

[Dynamic routes](realtime.routes.md) made the cost of every replica receiving every event
visible: each replica writes every routed event, so the stored copy and its replay multiply with
the replicas. The outbox gained [destinations](/documentation/outbox.md#the-pump) — one published
and settled independently of another — which is what this uses.

## What happens today

1. A component publishes an event to the broker.
2. Every replica of the realtime service receives it through a queue of its own, works out its
   keys, and for each key:
   - pushes it to the connections of the key it holds;
   - appends it to the key's stream (`XADD`, `MAXLEN ~ maxlen`, `EXPIRE expire`), and pushes the
     entry id as the token.
3. A stream's `EXPIRE` is set only by a write. A connection that receives nothing for `expire`
   seconds loses its stream while it is open, and its tokens replay nothing after that. The
   heartbeat goes to the connection only.

## Stages

1. The service subscribes, renews and delivers from channels, beside what it does now.
2. The destination, with the bridges boot hands it.
3. The service stops consuming events; the deployment stops publishing what only realtime
   consumed.

Dynamic routes are matched by the service against the events it consumes, so stage 3 is not
released before they are rebuilt on this. That is the next discussion, and roles after it.

## Verification

`extensions/realtime/features`:

- an event reaches a connection held by another replica;
- an event routed to a key nobody consumes creates no stream;
- an event is written once however many replicas hold connections of its key, and a reconnect
  replays it once;
- a stream that receives nothing for longer than `expire` keeps its connection receiving;
- what was written while the client was away is replayed on another replica;
- a replica whose subscriber lost Redis delivers what was written meanwhile once it is back;
- an event of a component whose storage has no durable outbox reaches its connection;
- a Redis that is down leaves the row outstanding for realtime alone, and the event arrives once
  it is back.

## Compatibility

- **Wire:** unchanged for clients — the route, the `token` event, reconnecting with a token.
- **Declarations:** unchanged.
- **Deployment:** a component with realtime routes needs the Redis of the realtime extension, and
  the service needs no queue. A service of before and one of after do not share streams safely:
  both would be writing them during a rollout, so an event may be replayed twice across it.

## Open points

1. **Which Redis the destination writes to.** The service's streams are in its stash, resolved for
   `realtime.streams` and prefixed `<scope>:realtime:streams:`. The destination has to resolve the
   same address from the component's process, and write under the same prefix.
2. **How the context annotation's routes reach a component**: a variable per component, as
   `TOA_EVENTS_*` is.
