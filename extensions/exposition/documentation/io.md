# I/O restrictions

The Exposition comes with `io` directives to control access to the operation's input and output
properties.

## Input

The `io:input` optional directive contains a list of properties that are allowed to be specified in
the request body.

```yaml
POST:
  endpoint: create
  io:input: [name, location]
```

The list must be a valid subset of the operation's input properties.

If `io:input` is specified and the request body is not an object, or contains properties that are
not in the list, the request will be rejected with a `400` status code.

> Therefore, `io:input` is only applicable to operations which input is an object or an
> array of objects.

## Output

The `io:output` mandatory directive contains a list of properties that are allowed to be included in
the response body.

```yaml
GET:
  endpoint: observe
  io:output: [name, location]
```

When an operation does not return an object (e.g., a primitive or a stream), or an object is dynamic
and its properties are not known in advance, `io:output` may have a value of `true` to disable
output restrictions.

```yaml
GET:
  endpoint: proxy
  io:output: true
```

If a method declaration lacks `io:output` directive, it will trigger a warning, and its
response will consistently be empty.
If this behavior is intended, a `false` value can be employed to suppress warnings.

```yaml
GET:
  endpoint: conceal
  io:output: false
```

Output restrictions are not applied to stream responses and errors.

## Throttling

The `io:throttle` directive limits the rate of requests meeting the specified criteria.

```yaml
exposition:
  /:
    io:throttle:
      key:
        - route
        - ip
      condition:
        status: 404
      requests: 500
      interval: 30
      cooldown: 30
```

Requests are counted per `key`. Once `requests` are counted within `interval` seconds, further
requests carrying that key are answered `429 Too Many Requests` until `cooldown` seconds pass.
`interval` and `cooldown` are in seconds.

`requests` is a budget for the **whole group** of gateway instances, not for one of them. Counting
goes through Redis, so the instances converge on one number rather than each enforcing the limit
separately. The number they act on is a lower bound: it never claims more requests than were really
made, and it can lag by up to one interval. Precise per-request enforcement is not what this is for.

The lag is worth knowing about when `requests` is small. An instance sends what it has counted once
an interval, and what the group made of it only comes back an interval later — so between its send
and that reply, an instance is going on what it alone has counted since. A limit of `1` blocks on
the first request whatever happens; a limit of a handful can be overshot in the first interval of a
burst, before any instance has a group number to act on. Set `requests` for the rate you want to
stop, not for an exact ceiling.

An instance that cannot reach Redis keeps throttling on what it has seen itself, and keeps serving.

### Key components

What a request is counted against. Give one, or a list — a list keys on the combination, so
`[route, ip]` counts each address separately on each route.

- `ip` — the client address, read from `X-Forwarded-For` where it is set and not private,
  and from the connection otherwise.
- `path` — the path the request came in on, `/users/1`.
- `route` — the route as declared, `/users/:id`. Every path matching the route shares one budget,
  which `path` cannot do: keyed on `path`, walking ids is a way around the limit.
- `identity` — the authenticated identity. Requests carrying none share a single budget between
  them, so pair it with `ip` if that matters.
- `segment: <name>` — the value bound to a named route segment, `1` for `:id` in `/users/:id`.

### Conditions

What is counted, as opposed to what it is counted against. A request that fails a condition is
served and not counted. Conditions are evaluated against the response, so they cannot decide whether
to block — only whether to count.

- `status: <code>` — count only responses with this status.

```yaml
io:throttle:
  key: ip
  condition:
    status: 404
  requests: 20
  interval: 60
  cooldown: 600
```
