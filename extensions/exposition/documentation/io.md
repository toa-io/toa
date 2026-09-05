# I/O restrictions

The Exposition comes with `io` directives to control access to the operation's input and output
properties, and to let an operation state the status of its reply.

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

Output restrictions are not applied to stream responses, nor to a reply the gateway built out of an
exception — an operation that returns an error is answered with a code and a message of the
gateway's own, and a list of permitted properties has nothing to say about those. A reply the
operation returned is restricted whatever status it carries, see [Status](#status).

## Status

The `io:status` optional directive names a property of the reply that carries the status of the
response. The property is removed from the body.

```yaml
POST:
  endpoint: register
  io:status: status
  io:output: [client_id, client_name, error, error_description]
```

```javascript
return { status: 400, error: 'invalid_redirect_uri' }
```

```http
400 Bad Request

error: invalid_redirect_uri
```

A reply that does not carry the property is answered with the status it would have been. A property
that is not a number is an error.

This is for an outcome the operation knows and the transport does not — a protocol that states its
error as a body rather than as a status of its own, or a request that created where it might have
updated. Such an operation returns no error: both replies are its output, and `io:output` permits
the properties of both. An operation that does return an error is unaffected — that reply is the
gateway's, and is not restricted.

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
```

Requests are metered per `key`. A key may spend `requests` at once, and earns them back at a rate of
`requests` per `interval` seconds. A request carrying a key with nothing left to spend is answered
`429 Too Many Requests`, with a `Retry-After` saying how long until one would be admitted again.
`interval` is in seconds.

So `requests` is the burst, and `requests / interval` the rate it is repaid at. There is no window to
save a budget up in and spend twice across the edge of, and no lockout to sit out: a key that has
overspent is admitted again as soon as it has earned a single request back, and a client that keeps
asking meanwhile is not penalised for it.

`requests` is a budget for the **whole group** of gateway instances, not for one of them. Instances
reconcile through Redis on a timer, so they converge on one number rather than each enforcing the
limit separately. Between two of those, an instance goes on what it alone has spent — so the group
can overshoot by what the other instances admit within that window, and by no more. The window is a
tenth of `interval`, between a quarter of a second and two seconds, whatever `interval` is. Precise
per-request enforcement is not what this is for.

An instance that cannot reach Redis keeps throttling on what it has seen itself and keeps serving,
and reports what it could not the next time it gets through.

### Key components

What a request is metered against. Give one, or a list — a list keys on the combination, so
`[route, ip]` meters each address separately on each route.

- `ip` — the client address, as the request context resolved it. See [Client address](ip.md) for
  where it is read from and why.
- `path` — the path the request came in on, `/users/1`.
- `route` — the route as declared, `/users/:id`. Every path matching the route shares one budget,
  which `path` cannot do: keyed on `path`, walking ids is a way around the limit.
- `identity` — the authenticated identity. Requests carrying none share a single budget between
  them, so pair it with `ip` if that matters.
- `segment: <name>` — the value bound to a named route segment, `1` for `:id` in `/users/:id`.

### Conditions

What is metered, as opposed to what it is metered against. A request that fails a condition is served
and costs nothing. Conditions are evaluated against the response, so they cannot decide whether to
refuse a request — only whether it is charged for, once it has been answered.

- `status: <code>` — charge only for responses with this status.

```yaml
io:throttle:
  key: ip
  condition:
    status: 404
  requests: 20
  interval: 600
```

An address may probe for twenty missing paths at once, and thereafter for one every thirty seconds.
Requests that find something are served and never counted against it.

## Introspection

What these admit is what [`OPTIONS`](introspection.md) states: `io:input` restricts the input
schema, `io:output` the output schema, and a method declaring no `io:output` states no output at
all — nothing of the reply is sent.
