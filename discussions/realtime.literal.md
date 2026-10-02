# Literal realtime keys

## Design concept

A key may be a literal: written with a leading `~`, it is the key itself rather than a property of
the event or a variable of the route. A component routes every event of a kind to one stream, and
serves that stream at a route that has no variable for it.

### Guarantees

**Declaring**

1. A route's `key` is a property, a literal, or a list that mixes them. A literal is `~` followed by
   at least one character.
2. `realtime:stream` names a route variable _(today)_ or a literal. A literal is served at any route,
   with or without variables.

**Routing**

3. An event routed to a literal goes to the stream of that literal, whatever its payload.
4. A literal is the key with its `~`: it is never an identity's id, so `/realtime/:id` never serves
   it, and it is never a value an ordinary property holds.
5. A property whose value begins with `~` does not route the event to that value: a value someone
   writes — a room's name — cannot reach a literal's stream.
6. A route variable whose value begins with `~` serves no stream: the route is answered with
   `404`, so a literal's stream is read only at a route that names it.
7. A literal is a key of the context, as every key is: two components that route to `~room` write
   to one stream.

**What is not promised**

8. A literal is not tied to the component that declares it. Who may read its stream is what the route
   serving it says, as for any key.

### What a component author does differently

```yaml
# messages/manifest.toa.yaml
realtime:
  created:
    key: ~room
    expose: [id, sender, text]

exposition:
  /rooms/stream:
    auth:role: moderator
    GET:
      realtime:stream: ~room
```

## The changes, by area

1. **The declaration.** The schema of routes takes a literal among the keys; `parse` gives a route
   its `literals` beside its `properties`.
2. **The destination.** An event is written to its route's literals and to the values of its
   properties, a value that begins with `~` left out.
3. **`realtime:stream`.** A literal names the key; anything else names a route variable, as today,
   whose value is never taken for a literal.
4. **Documentation.** _Routes_ and _Serving a stream_ of exposition's realtime documentation.

## Decisions

1. **`~`, not a keyword.** A property name and a route variable cannot begin with `~`, so one string
   says which it is, in `key` and in `realtime:stream` alike, and a list of keys mixes them.
2. **The `~` is kept in the key.** A literal stripped of it would be the same key as a property's
   value — a room named `room` — and anyone who names a room would write to the literal's stream.
3. **A value that begins with `~` is not a key.** Kept as one, it would be the same key as a literal
   for the same reason — written by an event, or read through a route variable. Refusing such a
   value is left to the application; the route ignores it, and a stream's route answers `404`.
4. **Context-wide, not per component.** Every key is; a literal scoped to its component would be the
   only key that is not, and two components could not share one.

## What happens today

A key is the value of a property of the event, and `realtime:stream` reads it from a route variable.
A stream every event of a kind goes to needs a property that holds the same value on every event.

## Verification

`extensions/exposition/features/realtime.feature`:

- a stream of a literal, served at a route without variables, receives every event routed to it;
- an event whose property holds a value that begins with `~` does not reach the literal's stream;
- a literal's stream is not served by a route variable that holds it.

A `realtime:stream` naming neither a route variable nor a literal is refused, by unit tests.

## Compatibility

Additive, except that a value beginning with `~` no longer routes an event, nor is served by a route
variable.
