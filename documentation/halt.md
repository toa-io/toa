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
application asks for rather than inherits — with it off there is no endpoint to post to, no
component deployed to answer one, and nothing listening.

## Halting

```http
POST /introspection/signals/ HTTP/1.1
content-type: application/yaml

type: halt
seconds: 300
```

`seconds` is between `30` and `3600`. Requires the `system:halt` role, which is not
`system:introspection`: reading the service map and stopping the product are not one authority.

The reply is the signal, and it is a record like any other:

```http
GET /introspection/signals/
```

`CREATED` says when it was asked for and `seconds` how long for, so whether a halt is on is read
off the record. Nothing has to retract one, which matters, because retracting it is the one thing
a halted deployment could not do.

## What a halted deployment does

**It stops doing anything of its own accord first.** The gateway answers `503`, pulses stop
firing, delayed calls stop being dispatched. Nothing new begins.

**It finishes what it had.** A halt never interrupts work in flight: it waits. A request being
served is served, an event being handled is handled, and only then does anything close.

**It holds no connection.** No database, no cache, no broker, no outbound stream.

**It answers.** Every port it was listening on stays bound. The readiness probe answers `200`,
because the process is well, and carries `x-toa-halted` with the seconds left. The gateway answers
`503` with `retry-after`, so a client is told to come back rather than left with a refused
connection.

**It comes back by itself**, with connections it has never used before, and carries on. Nothing
has to reach it.

## What to expect

**A halt cannot be called off.** Nothing can reach a halted process, which is the point of it, so
the interval is what ends it. Ask for one you can afford to wait out.

**A halt holds over the processes that were there when it began.** One that starts during a halt
comes up running and connects to everything, because nothing is there to tell it otherwise. That
is also the only way to end a halt early — and the runtime starts nothing itself, so whether a
deployment has that escape hatch is a property of what supervises it.

**A halt reaches one deployment**, the one the signal was written in. Regions are separate
deployments with brokers of their own, so halting another means posting to its address.

**A call made to a halted component waits** on the broker and is served when it comes back, up to
whatever the caller's own timeout is. A request to the gateway does not wait: it is answered
`503`.

**Nothing is made up afterwards.** A pulse whose interval fell inside the window is not called
late, and a delayed call due inside it is dispatched when the deployment is back, subject to its
own `overdue` — so a delay that cannot survive the window is a delay that is skipped in this
region.

**A reply that was streaming is cut**, at the moment everything closes. A stream's tail is not
guaranteed in any case, and a rollout cuts it in the same place; a halt is worth knowing about
because it is a thing you choose.

## What a component author does differently

Nothing, to keep working. What changes is what a component **started itself** — an interval, a
watcher, something held open outside. The runtime did not build those and cannot take them down,
so a component that has any stops them in `stop` and starts them again in `resume`:

```javascript
// rc/poller.js

export function stop(context) {
  clearInterval(context.state.poller)
}

export function resume(context) {
  context.state.poller = setInterval(() => poll(context), 1000)
}
```

A component that starts nothing needs neither.

Otherwise: `preflight`, `settle`, `dispose` and an algorithm's `mount`/`unmount` run once per
halt rather than once per process, which is the pairing those hooks already promise. What does not
run again is a module — anything held at module scope survives a halt, because a halt replaces
what the runtime built and not what Node loaded.

**A call through a context whose tree has been taken down is refused.** That is what a forgotten
interval produces, and it is reported rather than fatal while the process is halted. Once the
process is working again the same call ends the process, because a stale context in a live process
is a defect.

## What the runtime cannot promise

A halt takes down what the runtime built. What a component started itself the runtime did not
build and cannot take down. A component that goes on working through a halt is refused, and where
that refusal reaches nobody the process exits. Whether anything starts it again is your
deployment's business and not the runtime's — and where something does, it comes back running.

So whether a halt stops your deployment is a property of your components, and nothing checks it
for you. **If this is your big red button, press it on a schedule.** One nobody has pressed is one
nobody knows works, and the day you need it is the wrong day to learn otherwise.
