# Halt

Every process of a deployment stops what it is doing, closes every connection it holds to the
infrastructure, and comes back on its own when the interval it was given is over. The processes
are not replaced, and the ports they listen on stay bound.

For the length of the interval the broker, the database and the cache have no client left — which
is the window to restart, upgrade or fail over the things the deployment runs on.

**A halt is only as complete as your components make it.** The runtime stops what it built. An
interval, a watcher or a connection a component started itself it did not build and cannot stop,
and a component that goes on working keeps its deployment working. Nothing checks that for you.

## Asking for it

```yaml
# context.toa.yaml
introspection:
  halt: true
```

Off by default: with it off there is nothing deployed to post to and nothing listening.

```http
POST /introspection/signals/ HTTP/1.1
content-type: application/yaml

type: halt
seconds: 300
```

`seconds` is between `30` and `3600`. The route takes the `system:halt` role.

## What happens

1. Every process stops doing anything of its own accord: the gateway answers `503`, pulses stop
   firing, delayed calls stop being dispatched, and each component's
   [`pause`](/connectors/bridges.node/readme.md#run-commands) run command runs.
2. What is already in flight finishes. A halt waits for it.
3. Every connection closes — the broker, the database, the cache, and any stream still outbound.
   A halted process holds no socket, no channel and no session against anything it runs on.
4. When the interval is up, each process builds itself again and carries on.

## What it gives

**A halted process stays up.** It is not restarted, evicted or replaced, and it stays a member of
its service.

**It answers on every port it was listening on.** The readiness probe answers `200` and carries
`x-toa-halted` with the seconds left, so nothing watching it replaces it. The gateway answers
`503` with `retry-after`.

**Nothing is left connected.** The infrastructure sees the whole deployment disconnect, and
connect again when the interval is up. What happens to it in between is nobody's concern.

**It ends by itself.** Nothing has to reach the deployment for it to come back.

**Nothing in flight is interrupted.** A request being served is served, an event being handled is
handled, and only then does anything close.

## What it does not give

**There is no undoing a halt from outside.** Nothing reaches a process that holds no connection,
so the interval is what brings the deployment back. Ask for one you can afford to wait out.

**It holds only over the processes that were there when it began.** One that starts during a halt
comes up running, because nothing is there to tell it otherwise. Starting one is therefore the way
to end a halt early — and the runtime starts nothing itself, so whether you have that depends on
what supervises your processes.

**It reaches one deployment**, the one the signal was written in. Regions are separate deployments
with brokers of their own, so halting another means posting to its address.

**A call to a halted component waits** on the broker and is served when the component comes back,
up to whatever the caller's own timeout is. A request to the gateway does not wait: it is answered
`503`.

**Nothing is made up afterwards.** A pulse whose interval fell inside the window is not called
late. A delayed call due inside it is dispatched when the deployment is back, subject to its own
`overdue` — so one that cannot wait out the window is skipped in this region.

**A reply that was streaming is cut**, where a halt closes everything. A stream's tail is not
guaranteed in any case; what is worth knowing is that a halt is a moment you choose.

## What you write

Nothing, to keep working. What changes is what a component **started itself**:

```javascript
// rc/poller.js

export function preflight(context) {
  context.state.poller = setInterval(() => poll(context), 1000)
}

export function pause(context) {
  clearInterval(context.state.poller)
}

export const resume = preflight
```

`pause` runs while the component is still whole and still serving, which is the one moment it can
release what the runtime cannot see.

**What you had to do in `pause` you have to undo in one of two places**, because there are two ways
a process comes back. Where it was taken down for the interval, the component that comes back is a
**new** one and `preflight` runs on it. Where the halt was cancelled before anything closed, it is
the **same** component — the same `context.state`, everything it opened still open — and
[`resume`](/connectors/bridges.node/readme.md#run-commands) is the only thing that runs. So a
component that exports `pause` and no `resume` does not start: it would come back from a cancelled
halt without what it paused, and go on answering as if it had not.

**A `context` does not survive a halt.** A new one is built with the component, and so is the
algorithm that took it from `mount`. What does survive is a module: anything held at module scope
outlives a halt, because a halt replaces what the runtime built and not what Node loaded.

**A call made through a context whose component is gone is refused.** That is what a forgotten
interval produces. While the process is halted it is reported; once the process is working again
it ends the process, because a stale context in a live process is a defect.

## Operating

**The window is for work on what the deployment runs on** — upgrading the broker, failing the
database over, moving a cluster, taking a backup with nothing writing across it. Ask for the
interval that work needs, and for the one you can afford to be down: the deployment comes back
when it is up, whether or not the work is finished.

A halt is for a deployment that is working. The evidence that it worked is that every process came
back, and the way to have that evidence is to have done it before.

**If this is your big red button, press it on a schedule.** One nobody has pressed is one nobody
knows works, and the day you need it is the wrong day to learn otherwise.
