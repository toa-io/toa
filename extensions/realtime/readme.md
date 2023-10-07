# Toa Realtime

## Overview

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764566111478378&cot=14">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".readme/overview-dark.jpg">
    <img alt="Realtime" width="700" height="202" src=".readme/overview-light.jpg">
  </picture>
</a>

---

Realtime extension combines application events into streams according to defined routes.
Clients may consume these streams [via Exposition](#exposition).

## Static routes

Static route specifies an event that should be combined into a stream using specified property of
event's payload as a stream key.

Static routes may be defined in Component manifest or the Context annotation.

```yaml
# manifest.toa.yaml
name: users

realtime:
  updated: id
```

```yaml
# context.toa.yaml

realtime:
  users.updated: id
  orders.created: custromer_id
```

In case of conflict, the Context annotation takes precedence.

### Static route examples

Given two rules: `users.updated: id` and `orders.created: customer_id`,
the following events will be combined into a stream with `a4b8e7e8` key:

```yaml
# users.updated
id: a4b8e7e8 # id property is used as a stream key
name: John Doe
```

```yaml
# orders.created
id: 1
customer_id: a4b8e7e8 # customer_id property is used as a stream key
amount: 100
```

## Dynamic routes

Dynamic routes address the cases when a stream key is not a property of an event.

Among with an `event` and a `stream` key, a dynamic route has `property` and `value` properties,
which define a condition that should be met for an event to be combined into a stream with the
specified key.

### Dynamic route examples

For instance, when there are chat rooms with a list of users, and a user joins or leaves the room.
When a message is sent to a room, an event will have a `room_id` property, but not a `user_id`.
In this case, when the user `a4b8e7e8` enters the room with id `general`,
a dynamic route may be created as follows:

```yaml
event: message.sent
property: room_id
value: general
stream: a4b8e7e8
```

Each time the message is sent to the room with id `general`, the event will be combined into a
stream with `a4b8e7e8` key.

### Managing dynamic routes

Dynamic routes are managed by the `realtime.routes` component, running in the Realtime extension.

> Not implemented yet.

## Exposition

Streams are exposed by the `realtime.streams` component, running in the Realtime extension, and are
accessible via the `/realtime/streams/:id` resource with the following declaration:

```yaml
  /:key:
    auth:id: key
    GET: fetch
```

Refer to the [Exposition documentation](/extensions/exposition) for more
details:

- [Access authorization](/extensions/exposition/documentation/access.md)
- [Streams](/extensions/exposition/documentation/protocol.md#streams)
