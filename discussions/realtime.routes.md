# Dynamic realtime routes

## Design concept

An event reaches a stream today only where the event names it: a static route takes the key from a
property of the payload. A dynamic route is one an application creates at runtime — _this_ event,
where _this_ property has _this_ value, goes to _that_ stream — so an event reaches an identity that
it does not name: a moderator watching a room, an operator watching any record.

Who may create one is the application's to decide, with the directives it already has. The stream
stays readable by its own identity only; what the application authorises is the route onto it.

### Guarantees

**Declaring**

1. An event is routed dynamically only where its component or the context declares it so, with the
   most a dynamic route of it may expose. An event not declared is refused.
2. An event declared dynamic needs no static key, and one that has a static key keeps it as it is.

**Routing**

3. An event that matches a route is pushed to the route's stream, where its property has the route's
   value, or is an array that contains it. A route that names no property matches every event of
   its kind.
4. What is pushed is what the route exposes, within what the declaration allows; a route that states
   nothing exposes what the declaration allows.
5. A route is its event, property, value and stream. Creating it again changes nothing, and an event
   that matches it is pushed once. An event that matches a route and a static route to the same
   stream is pushed once for each.
6. What a dynamic route pushes is replayed after a reconnect with a token, as a static route's is
   _(today, for static routes)_.
7. A route created is served by every replica of the service, and survives the restart of any of
   them.

**Lifetime**

8. A route lives while its stream is consumed, and `expire` seconds after the last consumer left —
   the window a consumer reconnects with a token in. A client that closes without removing its
   routes leaves nothing behind.
9. A route is removed explicitly with `unroute`.

**Failures**

10. A route that cannot be stored is refused with an exception, not accepted and lost. The refusal
    comes when the stash gives up on the command, which is over a minute after it became
    unreachable; a caller that stops waiting sooner may find the route created once the stash is
    back.
11. A route changed while the stash was unreachable reaches every replica once it is back.

**What is not promised**

12. A route is not an authorisation. Whoever calls `route` can route any declared event to any
    stream; the call is to be made behind a route of the application's that authorises it.
13. An event pushed while a replica has not yet learned of a route — the moment after it was
    created elsewhere — may be missed by that replica.

### What a component author does differently

Declares the event dynamic, and exposes an operation that creates the route behind whatever
authorises it:

```yaml
# messages/manifest.toa.yaml
realtime:
  created:
    key: [sender, recipient]
    dynamic:
      expose: [id, room, text, sender]
```

```yaml
# rooms/manifest.toa.yaml
exposition:
  /:room/watchers/:identity:
    auth:rule: { id: identity, role: moderator }
    PUT: watch
    DELETE: unwatch
```

```js
// rooms/operations/watch.js
export async function effect(input, context) {
  await context.remote.realtime.streams.route({
    input: {
      event: 'default.messages.created',
      property: 'room',
      value: input.room,
      stream: input.identity
    }
  })
}
```

The client opens its own stream as it does today, calls `PUT /rooms/general/watchers/:me/`, and
receives the room's messages on it.

## The changes, by area

1. **The declaration.** A route declaration takes `dynamic: true` or `dynamic: { expose }`, and
   `key` becomes optional where `dynamic` is present. `parse` carries it into `TOA_REALTIME`.
2. **The service.** `Routes` consumes every declared event. `Receiver` pushes by the static keys as
   today, and hands an event declared dynamic to `realtime.streams.dispatch`.
3. **`realtime.streams`.** Three operations:
   - `route` stores a route and announces it;
   - `unroute` removes it and announces that;
   - `dispatch` (internal, like `push`) matches an event against the routes and pushes it to each
     matching stream, the way `push` does.
4. **The index.** Every replica holds every route in memory, and matches an event against it with
   no I/O. Routes are stored in the stash, a hash of the route to the moment it expires; a change is
   published on a channel every replica subscribes to. The index is read whole when the component
   mounts, when the stash reconnects, and every `expire / 2` seconds, which drops what expired.
5. **Renewal.** While a key has a consumer, the expiry of the routes to it is pushed `expire`
   seconds on every third of `expire`, and once more when its last consumer leaves.
6. **Documentation.** The _Dynamic routes_ section of the realtime readme.

## Decisions

1. **Authorised by the application, not by the extension.** A route onto a stream is what grants
   access, and an application already has every directive to say who may be granted it: `auth:role`,
   `auth:rule`, a dynamic role. An extension-owned `/realtime/routes` resource would need its own
   rules per event — a second authorisation language that says less.
2. **Routes are the streams' component, not one of their own.** The notes named a `realtime.routes`
   component. A route lives as long as its stream is consumed, and only `realtime.streams` sees its
   consumers; the push a route leads to is the one `push` already makes. A component of its own
   would have to be told of every consumer, over a call, to know when its routes may go.
3. **An index in memory, not a lookup per event.** Every replica receives every event, so a lookup
   in the stash would cost a round trip per event per replica. Routes change as often as someone
   starts or stops watching, which is rarely next to how often events arrive.
4. **Expiry by timestamp, not by key TTL.** A route has to disappear from every replica's index, and
   a key that Redis expires tells nobody. A timestamp is read by the periodic read and by `dispatch`
   itself, which skips what has expired without waiting for it.
5. **Rather than a role-keyed stream.** Pushing every event of a kind to a stream keyed by a role
   would have needed no state, but sends everything to everyone holding the role, and gives the
   application no say in what one of them watches.

## Context

The readme sketched dynamic routes as `event`, `property`, `value` and `stream`, managed by a
component of the extension, and marked them not implemented. This implements that sketch, with a
lifetime and an authorisation it did not state.

## What happens today

An event reaches the streams its payload names, and nobody else. An identity entitled to watch
something it is not named in can only poll.

## Stages

1. The declaration, and the service consuming dynamic events.
2. `route`, `unroute` and `dispatch`, with the index read on mount.
3. The channel, the periodic read and the reconnect.
4. Renewal and expiry.

## Verification

`extensions/realtime/features/dynamic.feature`:

- an event is routed by a dynamic route, and one whose property does not match is not;
- a route without a property routes every event of its kind;
- a route exposes what it asks for, and one asking beyond the declaration is refused;
- a route of an event not declared dynamic is refused;
- a route created twice pushes once;
- a removed route pushes nothing;
- what a route pushed is replayed after a reconnect with a token;
- a route outlives its consumer for `expire` and is gone after it (`@timing`);
- a route created on one replica is served by another;
- a route survives the restart of the service, and one created while the stash restarted reaches
  every replica once it is back.

## Compatibility

Additive. A declaration without `dynamic` means what it meant, and `TOA_REALTIME` of before has no
dynamic routes. A service of before does not have `route`: an application calling it needs the
release that brings it.
