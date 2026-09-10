# Halt

Every process of a deployment stops, holds nothing open, and comes back on its own when the
interval it was given is over.

## Asking for it

```yaml
# context.toa.yaml
introspection:
  halt: true
```

Off by default. A stop button for a whole deployment, reachable over HTTP, is a thing an
application asks for rather than inherits — with it off there is no endpoint to post to and
nothing listening for one.

## Halting

```http
POST /introspection/signals/ HTTP/1.1
content-type: application/yaml

type: halt
seconds: 300
```

`seconds` is between `30` and `3600`. Requires the `system:halt` role.

The reply is the signal, and it is a record like any other:

```http
GET /introspection/signals/
```

`CREATED` says when it was asked for and `seconds` how long it was for, so whether a halt is on
is read off the record. Nothing has to retract one, which matters, because retracting it is the
one thing a halted deployment could not do.

## What a halted deployment does

**It holds no connection.** No database, no cache, no broker, no outbound stream. Anything it was
in the middle of drains first, exactly as it does on a rollout.

**It answers.** Every port it was listening on stays bound. The readiness probe answers `200`,
because the process is well, and carries `x-toa-halted` with the seconds left. The gateway answers
`503` with `retry-after`, so a client is told to come back rather than left with a refused
connection.

**It comes back by itself**, with connections it has never used before, and carries on. Nothing has
to reach it.

## What to expect

**A halt cannot be called off.** Nothing can reach a halted process, which is the point of it, so
the interval is what ends it. Ask for one you can afford to wait out.

**A process that starts during a halt runs.** Nothing is there to tell it otherwise, so a rollout
restart is what ends a halt early — at the cost of replacing the pods, which a halt otherwise does
not do.

**A halt reaches one deployment**, the one the signal was written in. Regions are separate
deployments with brokers of their own, so halting another means posting to its address.

**A call made to a halted component waits** on the broker and is served when it comes back, up to
whatever the caller's own timeout is. A request to the gateway does not wait: it is answered `503`.

**Nothing is made up afterwards.** A pulse whose interval fell inside the window is not called
late, and a delayed call due inside it is made when the deployment is back, subject to its own
`overdue`.

## What a component author does differently

Nothing. A halt runs `unmount` on the way down and `mount` on the way back, which is the pairing
those hooks already promise, and `preflight`, `settle` and `dispose` run once per halt rather than
once per process.

What does not run again is a module. Anything held at module scope — a memoised token, a compiled
pattern, a counter — survives a halt, because a halt replaces what the runtime built and not what
Node loaded.
