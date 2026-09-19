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

Routes are declared in the component's manifest, and only there — `key` and `expose`, as they
were:

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

1. **Exposition: the destination.** `realtime` in a manifest resolves to
   `@toa.io/extensions.exposition#realtime`: a declaration the exposition package claims beside
   `exposition`, answered by `keys.realtime` of its factory. A component that declares routes has
   it, and it contributes that component's outbox destination.
2. **Core and boot.** A destination may name the events it renders (`renders`). Once the
   component's context exists, boot gives it a `Rendering` of them: each event's condition and
   payload, by the component's own bridges — what `Event` does before it publishes, now a method of
   its own. An event nothing consumes is rendered all the same: it is not published, and a
   destination writes somewhere of its own.
3. **Exposition: `realtime:stream`.** A directive naming the route variable that is the key. The
   gateway reads the streams itself, with connections of its own; there is no component to call.
   For a key that has readers, one gateway replica:
   - subscribes to the key's channel (`SSUBSCRIBE`) with the first stream of it, and unsubscribes
     with the last;
   - then writes the `connect` marker, on every connection, which creates the stream where it was
     gone and answers the first token — subscribed first, so nothing written after the marker misses
     the stream, and on a reconnect too, so a stream that expired while its reader was away is
     written to again;
   - replays from the token the client brought, if it brought one;
   - pushes what the channel brings to the streams of the key, and the entry id as the next token;
   - renews the stream's `EXPIRE` once per key every `min(heartbeat, expire / 3)`, and once more
     when the last stream of the key closes;
   - reads the stream from the last id it delivered on every reconnect of its subscriber, since a
     channel keeps nothing for a subscriber that was away, and pushes what it has not delivered.

   Where `streams` names several Redis, a key is kept by the one `fnv1a(key) % n` falls to — the
   same function for the components that write and the gateway that reads — and its stream, its
   channel and its replay are all there. A key is stored and published under
   `${scope}:realtime:`, the scope being the context and its suffix, as for any other key a
   process keeps on shared infrastructure.

4. **Exposition: `/realtime/:id`.** Declared by the gateway itself, as `/identity` is, with
   `auth:id: id` and `realtime:stream: id`: an identity's own stream, which no application has to
   declare. It was `/realtime/streams/:key`.
5. **The realtime extension** is removed: its service, `realtime.streams`, its deployment, its
   package, and dynamic routes with them. The `realtime` manifest key stays, and declares routes as
   it did. The `realtime` context annotation declares no routes any more.
6. **The deployment.** The `realtime` annotation is realtime's infrastructure, and nothing else:

   ```yaml
   # context.toa.yaml
   realtime:
     streams: redis://realtime.example.com # or a list of them
     expire: 300 # seconds a stream outlives its last reader: the window it reconnects in
   ```

   Its schema requires `streams`: an address, or a list of addresses, not a pointer. It is asked
   for as any annotation is — where the dependency is declared, which is where a component declares
   routes. The `#realtime` deployment gives it to every process, since both the components that
   write and the gateway that reads reach it. A component reads its routes from its own manifest.
   An event consumed by realtime alone is no longer published to the broker.

7. **`CONTRIBUTING.md`.** _Zero per-request I/O_ allows the interaction that produces the requested
   response, of which an operation call is one kind and a stream another.
8. **Metrics.** `toa.realtime.routed`, where a component writes an event, and
   `toa.realtime.delivered`, where a gateway pushes one, replace what the service counted.
9. **Documentation.** `realtime:stream` in exposition's documentation, with routes, keys, grouping,
   and the guarantees above; the realtime readme goes, and the
   migration note says what a deployment changes.
10. **A package may claim several keys.** A reference is a package, or `package#key`: a declaration
    of its own, with its own definition (`keys` of the package's) and its own factory (`keys` of the
    package's factory). norm and boot read a keyed reference as the package where they load it, and
    as the key where they ask it anything; a key runs no service.

## Decisions

1. **A stream is a resource.** Access to a stream is access to a resource, and exposition already
   has every way of saying who has it: `auth:id`, `auth:role` with placeholders, `auth:rule`. A
   stream of a room is read by whoever may read the room. What role-based and dynamic routing would
   have added — a second way of saying who receives what — is a route and a directive.
2. **Realtime belongs to exposition.** A stream has no reader but a gateway, and the realtime
   extension carried a copy of exposition's access in `auth:id: key`. Where the stream is served
   and where it is authorised are one place.
3. **The gateway reads the stream, and nothing else does.** A stream is the response the request
   is for, as an operation's reply is, and reading it through a component would add a leg per event
   and a process to scale. No component serves streams: nothing inside the system reads a client's
   stream. What a component used to call `realtime.streams.create` for — answering its caller with
   a stream — is not replaced here: whether a route that calls an operation should answer with a
   stream is a question of its own.
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
11. **Routes are the component's.** A route is a statement about the component's own events and
    who reads them, as its exposition is about its operations, so it is declared beside them and
    nowhere else. The context states where the streams are kept, not what goes into them — which is
    also what lets the annotation be asked for only where realtime is declared, by the mechanism
    that asks for any other.
12. **A key of exposition, not a package of its own.** `realtime` is a declaration that belongs to
    exposition, and two manifest keys naming one package would overwrite each other: a reference
    names the key within the package instead.
13. **An annotation of its own, not a pointer.** The streams are realtime's infrastructure, written
    by the components that route events and read by the gateway, and no extension of a component
    owns them. Their Redis is stated where realtime is declared, as addresses, and is given to the
    processes that reach it by the deployment of realtime itself; no deployment reads another's
    annotation.
14. **Several Redis, sharded by the client.** Where `streams` is a list of `n` addresses, every
    process that reaches the streams holds `n` connections, and a key is kept by the one its
    number falls to: `hash(key) % n === i`. The components that write and the gateway that reads
    shard alike, so a key's stream, its channel and its replay are on one Redis. Changing `n` moves
    keys: a stream a reader is on is found anew when it reconnects, and what it was sent before is
    not replayed.
15. **No Redis Cluster.** Scale is `n` independent Redis, and availability is each of them —
    a replicated primary behind one address. A script writes to one key at a time, so nothing
    depends on keys being together.

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
2. `package#key` references, and `realtime` as a key of exposition.
3. The destination, and the `realtime` annotation given to every process.
4. `realtime:stream`, and `/realtime/:id` declared by the gateway.
5. The realtime extension removed; events consumed by realtime alone no longer published.
6. Documentation, and `CONTRIBUTING.md`.

## Verification

`extensions/exposition/features/realtime.feature`, through HTTP:

- an identity reads its own stream at `/realtime/:id`;
- a stream served by the application's own route carries what its route exposes, and one the route
  does not authorise is refused without a stream being created;
- an event of another key does not reach a stream, and creates none;
- an event is written once however many streams of its key are open;
- what was written while the reader was away is replayed on a gateway started since;
- streams kept in two Redis are each on the one their key falls to, and each reaches its reader;
- a stream that receives nothing for longer than `expire` keeps receiving, and one nobody reads is
  let go after it (`@timing`);
- a reader that reconnects after its stream expired receives what is written next (`@timing`);
- a gateway whose Redis restarted delivers what is written after, and what was routed while it was
  down arrives once it is back (`@containers`).

`features/extensions/realtime.feature` and `features/deployment`: the Redis every process is given,
one or several, the annotation refused where it is missing or declares routes, and an event
realtime alone routes not being published.

## Compatibility

- **Clients:** an identity's stream moves to `/realtime/:id`; the `token` event and reconnecting
  with a token are unchanged.
- **Declarations:** the `realtime` manifest key is unchanged. A route declared in the context
  annotation moves into the manifest of its component.
- **Deployment:** the realtime service and its queues go. The `realtime` annotation states
  `streams`, which is not the `stash` annotation, and `expire`; `resources` and routes are refused
  by its schema. See `migrations/313.md`.
- **Userspace:** `realtime.streams.create` is gone, with no replacement in this change.
- **Dynamic routes** go before they were released.
- **Rollout:** a service of before and a gateway of after both write streams during a rollout, so an
  event may be replayed twice across it.
