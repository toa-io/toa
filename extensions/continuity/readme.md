# Toa Continuity

An operation that picks up where it failed.

A [task](/documentation/tasks.md), or an event a receiver hands on, is tried again when it raises,
and every attempt runs the operation from the top. An operation this extension continues is given
back, on a later attempt, whatever its context answered on an earlier one: the calls, fetches and
stashes that already answered are not made again, and what is made is the step that failed and
what follows it.

## Declaring it

```yaml
# manifest.toa.yaml
operations:
  onboard:
    type: effect

continuity:
  onboard: 604800 # seconds an unfinished run can still be resumed
```

Each operation named is an `effect` of the component, with how long, in seconds, a run of it that
has not finished can still be picked up. There is no default: how late a parked task can be put
back is yours to know. The window is at least `600`, and a manifest that states less, names an
operation the component does not have, or names one that is not an effect is refused.

The operation is written as any other:

```javascript
async function effect(input, context) {
  const account = await context.remote.identity.accounts.create({ input })
  await context.fetch('crm', { method: 'POST', body: JSON.stringify(account) })
  await context.remote.mail.messages.send({ input: { to: account.email } })
}
```

If `send` raises, the next attempt is given the account `create` answered and the response the
CRM gave, and only `send` is made again.

## Calling it

As a task, or from a receiver — where nobody waits for the answer:

```javascript
await context.call('users.onboarding.onboard', { input, task: true })
```

Any other call is refused, and so is a pulse naming it.

## What you can count on

**What answered is not asked again.** Within one run — a task, or one event — a step that answered
is given back on every later attempt: after an exception, after the process died, after a redeploy,
and after a parked task is put back within the window. A task delivered again after it finished is
given everything back, and makes nothing.

**Concurrent branches are fine.** A step is recognized by what it asks, not by when:

```javascript
await Promise.all([a().then(b), c().then(b)])
```

Each `b` is given its own answer however `a` and `c` complete on the next attempt.

**Two copies of a run agree.** Where a run is delivered twice at once, both copies go on with the
answer the first of them kept. A value taken at once — `context.id()`, `context.now()`,
`context.random()` — is the exception: each copy has its own until it is kept, so a step one copy
builds from it may be made by the other as well.

**A call keeps its identity.** A call made from the operation carries the same identity on every
attempt, so a callee that declares [`once`](/documentation/inbox.md) refuses a repeat of it.

## What that asks of you

**The next attempt may run somewhere else.** A task or an event that is tried again is taken by
whichever replica is free, and after a restart or a redeploy by a process that has never seen the run.
What the context answered is given back wherever that is; what the operation kept in its own process
is not. `context.state`, a variable of the module, a cache in memory, a file on the local disk — on the
next attempt each of them is whatever that process holds, which is not what the earlier attempt left:

```javascript
// counts in whichever process the attempt runs in, and not across attempts
context.state.sent = (context.state.sent ?? 0) + 1

// kept with the run, and given back wherever the next attempt runs
const sent = await context.remote.mail.messages.send({ input })
```

So nothing a later attempt depends on is carried in the process: take it from a step, or from what
the operation writes and reads back.

**Take time, randomness and new ids from the context.** A step is recognized by its arguments, so an
argument that differs between attempts makes a new step, and the step is made again:

```javascript
// a new timestamp every attempt: the call is made again every attempt
await context.remote.billing.invoices.issue({ input: { at: Date.now() } })

// the same timestamp on every attempt: the call is made once
await context.remote.billing.invoices.issue({ input: { at: context.now() } })
```

`context.now()`, `context.random()` and `context.id()` are given back like any other step. The same
holds for the entity an effect reads: it is read again on every attempt, and a step whose arguments
come from it is made again if it moved.

**A step that took effect may still be made again.** Where the process dies after a step took
effect and before its answer was kept, the next attempt makes it again. A call into Toa arrives with
the same identity, so a callee that declares `once` refuses it; a `fetch` to a third party is sent
again, so make it safe to repeat, or pass it a key it deduplicates on.

**Among identical steps, which branch gets which answer is not fixed.** Two concurrent `b(x)` are
the same request, and each is given one of the two answers — possibly the other one than the first
time. A later step built from the answer together with something of the branch's own has new
arguments, and is made again. `context.id()` twice in two branches is the common case.

**What cannot be kept is refused.** A step that answers with a stream raises `Unrecordable`, and
the run is parked. A `fetch` is kept whole — its status, its headers and its body — and given back
as a `Response`. An answer is kept as one MongoDB document, so one past its 16 MB fails to be kept,
and the step raises.

**An answer is given as it is kept, the first time too.** What a step answers is given back as the
broker carries it, on the attempt that made it as on any later one, so the operation reads the same
thing every time.

**A run that used up its attempts is parked**, as any task is. It picks up where it stopped if it is
put back within its window; after that, it starts from the beginning.

## Not steps

`logs`, `span`, `metrics`, `configuration`, `state` and `atom` are what they are on every attempt,
and nothing of them is kept. `state` in particular belongs to one process, and the next attempt may
run in another.

## Deployment

The runs are kept in the extension's own component, `continuity.journal`, in MongoDB. A context
whose components declare `continuity` deploys it as a service of its own. Its database is given as
for any component, so a context whose `mongodb` names one address for everything has nothing to add;
one that names them per namespace names this one too:

```yaml
# context.toa.yaml
mongodb:
  todos: mongodb://todos.mongo.example.com
  continuity: mongodb://mongo.example.com
```

See [deployment](/documentation/deployment.md).
