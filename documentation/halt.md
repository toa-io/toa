# Halt

Every process of a deployment stops what it is doing, closes every connection it holds to the
infrastructure, and comes back on its own when the interval it was given is over. The processes
are not replaced, and the ports they listen on stay bound.

For the length of the interval the broker, the database and the cache have no client left — which
is the window to restart, upgrade or fail over the things the deployment runs on.

**A halt is only as complete as your components make it.** The runtime stops what it built. An
interval, a watcher or a connection a component started itself it did not build and cannot stop —
and a deployment that does not go quiet is not stopped, so what your components hold is what
decides whether yours can be halted at all.

## Asking for it

```yaml
# context.toa.yaml
introspection:
  halt: true
```

Off by default: with it off there is nothing deployed to post to and nothing listening.

With it on, every application component has to be on the map: one declaring
`introspection: false` fails the build, because the map is what a halt is decided by. The
narrower opt-out, `introspection.samples: false`, is untouched — it suppresses the payload of a
call, not the record that one was made.

```http
POST /introspection/signals/ HTTP/1.1
content-type: application/yaml

type: halt
seconds: 300
quiescence: 60
```

- `seconds` — how long every process stays down. Between `30` and `3600`.
- `quiescence` — how long the deployment is given to go quiet before it is checked. Between `5`
  and `600`, `60` by default.
- `grace` — how long a process that found the deployment working waits for another process to
  call the stop before it leaves the halt. Between `2` and `120`, `10` by default.

The route takes the `system:halt` role.

## What happens

1. Every process goes quiet: the gateway answers `503`, pulses stop firing, delayed calls stop
   being dispatched, and each component's
   [`pause`](/connectors/bridges.node/readme.md#run-commands) run command runs. Nothing closes.
2. For `quiescence` seconds the deployment finishes what it already had. Nothing is adding to
   the queues, so what is in them is finite and drains.
3. Every process then reads the map, which answers one question: was anything, anywhere in this
   deployment, called since the signal. **Whichever process sees that nothing was calls the
   stop, and the rest obey it** — the evidence is what the whole fleet wrote, so one process
   reading it reads for all of them.
4. Every connection closes — the broker, the database, the cache, and any stream still outbound.
   A halted process holds no socket, no channel and no session against anything it runs on.
5. When the interval is up, each process builds itself again and carries on.

**Where anything was still working, the halt is called off.** Nothing had been closed, so every
process simply starts working again and each component's
[`resume`](/connectors/bridges.node/readme.md#run-commands) runs. So it goes where the map could
not be read: a deployment is not stopped on a guess.

## What it gives

**Nothing is running when the deployment goes down.** Every source of work is off, what was in
flight has finished, and the map says nothing was called. That is what a stop rests on, and why
a halt of a busy deployment is refused rather than half-performed.

**A halted process stays up.** It is not restarted, evicted or replaced, and it stays a member of
its service.

**It answers on every port it was listening on.** The readiness probe answers `200` and carries
`x-toa-halted` with the seconds left, so nothing watching it replaces it. The gateway answers
`503`, and carries `retry-after` once the deployment is down and there are seconds to state.

**Nothing is left connected.** No process holds a socket against the broker, the database or the
cache, so they can be stopped, replaced or failed over while the deployment is down.

**It ends by itself.** Nothing has to reach the deployment for it to come back.

**Nothing in flight is interrupted.** A request being served is served, an event being handled is
handled, and only then does anything close.

## What it does not give

**There is no undoing a halt from outside.** Nothing reaches a process that holds no connection,
so the interval is what brings the deployment back. Ask for one you can afford to wait out.

**A deployment that does not go quiet is not stopped.** A component that keeps its own time, a
queue that never empties, work that outlasts the window — any of them and the halt is called off.
Ask for a longer `quiescence`, or find what did not stop.

**It holds only over the processes that were there when it began.** One that starts during a halt
comes up running, because nothing is there to tell it otherwise. During the quiet it is what calls
the halt off, since it starts working and the map shows it; once the deployment is down, starting a
process is the way to end a halt early — and the runtime starts nothing itself, so whether you have
that depends on what supervises your processes.

**It reaches one deployment**, the one the signal was written in. Regions are separate deployments
with brokers of their own, so halting another means posting to its address.

**A call to a halted component waits** on the broker and is served when the component comes back,
up to whatever the caller's own timeout is. A request to the gateway does not wait: it is answered
`503`.

**Nothing is made up afterwards.** A pulse whose interval fell inside the window is not called
late. A delayed call due inside it is dispatched when the deployment is back, subject to its own
`overdue` — so one that cannot wait out the window is skipped in this region.

**A reply that was streaming is cut** along with everything else that closes. Whoever was reading
it sees it end early and has to ask again — a stream's tail is not guaranteed in any case, but a
halt is a moment you choose.

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
release what the runtime cannot see. `context.state` is where a component keeps what outlives a
call, and a component has it by declaring [`state: ~`](/extensions/state/readme.md).

**What you had to do in `pause` you have to undo in one of two places**, because there are two ways
a process comes back. Where it was taken down for the interval, the component that comes back is a
**new** one and `preflight` runs on it. Where the halt was cancelled before anything closed, it is
the **same** component — the same `context.state`, everything it opened still open — and
[`resume`](/connectors/bridges.node/readme.md#run-commands) is the only thing that runs. So a
component that exports `pause` and no `resume` does not start: it would come back from a cancelled
halt without what it paused, and go on answering as if it had not.

**A halt rebuilds what the runtime built, and only that.** A module stays loaded, so anything kept
at module scope is the same object afterwards — and a connection opened there was neither closed by
the halt nor reopened after it. That is yours to release in `pause` and take again, by the rule
above.

**A call made through a context whose component is gone is refused.** That is what a forgotten
interval produces. While the process is halted it is reported; once the process is working again
it ends the process, because a stale context in a live process is a defect.

## Operating

**The window is for work on what the deployment runs on** — upgrading the broker, failing the
database over, moving a cluster, taking a backup with nothing writing across it. Ask for the
interval the work needs, and one you can afford to be down for: the deployment comes back when it
is up, whether or not the work is finished.

**What a halt did is in the records.** A `stop` record names the halt it answers, so a halt with
no stop beside it is one that was called off. Nothing is written back to a halt: the write that
would say what became of it is the one thing a halted deployment cannot do.

**A second halt posted while one is under way is ignored.** A process is deaf to everything but
the halt it is quiesced for, so pressing twice changes nothing.

**A halt reaches what is connected when it is posted.** The signal travels over the broker, and a
process that is not there to receive it is never told afterwards. One that is idle is silent in
exactly the way one that obeyed is, so the deployment is stopped around it and it is left working
alone; one that is doing anything writes to the map, and the halt is called off. Either way, a
halt is for a deployment that is healthy, and not a way to bring a broken one to rest.

**If this is your big red button, press it on a schedule.** One nobody has pressed is one nobody
knows works, and the day you need it is the wrong day to learn otherwise.
