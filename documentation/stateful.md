# Stateful operations

Some state lives in the memory of one process: a connection, a stream someone is producing, a
session. A call about it has to reach that process, where every other call reaches whichever replica
of a component takes it first.

**An addressed call is unreliable.** Every other call reaches a component, and a component comes
back: a call waits for it, a message is kept until it is taken, and a failure is tried again. An
addressed call reaches one process, and what it is about lives in that process's memory and nowhere
else. When the process is gone — it crashed, it was stopped, it lost its broker connection — the
state is gone with it, and there is no other replica to carry the call and no later moment at which
it could succeed. So an addressed call can end without an answer, and a call that ended without one
may have run.

Write for it: keep in a stateful operation only what can be rebuilt, treat a refused or abandoned call
as a state to recover from, and keep whatever must survive in the component's state rather than in
a process.

## TL;DR

```yaml
# manifest.toa.yaml
operations:
  open:
    type: computation
  watch:
    type: computation
    stateful: true
```

```typescript
// open: hand out the name of the process that holds the state
return { instance: context.instance, id }

// elsewhere: call that process
const stream = await context.remote.media.streams.watch({ input: { id }, instance })
```

## Declaring

An operation declared `stateful: true` is served by each process under that process's own name, and
takes calls that name a process. A process reads its name as `context.instance`: generated when the
process starts, or given by `TOA_INSTANCE`.

Hand the name out with whatever the state belongs to — in the reply of the call that created it, or
as part of a URL. A process serves its name before it answers anything, so a name it has handed out
is reachable by the time it arrives.

## Calling

A call to a stateful operation names the process in `instance`. These are refused with
`RequestContract` before anything is sent:

- a call to a stateful operation that names no process;
- a call to an ordinary operation that names one;
- a task, or a delayed call, that names one — both are made later, by whichever process takes them.

A receiver may be bound to a stateful operation. Its adaptation names the process in the request it
returns, and the call reaches that process from whichever replica took the event.

## Waiting

An addressed call waits 5 seconds for its reply, and a call may set its own wait in a second argument:

```typescript
await context.remote.media.streams.watch({ input: { id }, instance }, { timeout: 60_000 })
```

- `timeout` is in milliseconds.
- `signal`, an `AbortSignal`, ends the wait when it aborts, within the timeout — also while the
  component is still being looked up, in which case the call is made nowhere.

Every remote call and local call takes both. An ordinary call given neither waits for as long as its
reply takes. For a streamed reply, the wait covers the start of the stream.

The default for addressed calls is set per context:

```yaml
# context.toa.yaml
addressed:
  timeout: 5000
```

## What a call ends in

| outcome     | what it means for the caller                                                   |
| ----------- | ------------------------------------------------------------------------------ |
| the reply   | the process answered                                                           |
| `Addressee` | nothing held the name, and the call did not run                                |
| `Abandoned` | the timeout passed or the signal aborted; the call may have run, and may still |

Both are exceptions, thrown where the call is made, and both are worth another attempt: a process
that lost its broker connection holds its name again once it is back, so an event whose call was
refused in that gap goes through when it is tried again.

A call still waiting in a queue when its timeout passes is dropped, and never runs. A call its signal
ended earlier stays queued until its timeout. Where an abandoned call must change state once, declare
[`once: true`](/documentation/inbox.md) on the operation.

## Over HTTP

A route reaches a stateful operation with the name in a route parameter:

```yaml
/streams/:instance/:id:
  GET:
    map:instance: instance
    endpoint: watch
```

`Addressee` answers `404`, and `Abandoned` answers `504`. See
[`map:instance`](/extensions/exposition/documentation/map.md#instance).

## Limits

- **A name lasts as long as its process's broker connection.** While the process reconnects — a lost
  connection, a broker restart — calls to it are refused and calls queued for it are abandoned, while
  its memory is intact.
- **A name given by `TOA_INSTANCE` passes to the next process started with it**, which then answers
  calls meant for the one before, with none of its memory.
- **Two live processes given one name can both hold it**, on different brokers, and both answer
  calls. Each logs `Instance name taken` for the broker where the other holds it, and holds the name
  there once the other is gone. A process whose name is taken on its only broker serves nothing
  until then.
- **The first call to a component looks the component up**, and the lookup waits for as long as the
  component takes to appear. The timeout counts from when it is found.
- **Declaring `stateful` on an operation that was ordinary** stops its shared queue being consumed, so
  every caller runs a runtime that knows the flag before it is declared.
