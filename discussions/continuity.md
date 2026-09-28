# Continuity

## Design concept

A task is guaranteed to run, not to run once. An exception has it tried again, and every attempt
starts the operation from the top: each call, fetch and stash the operation made before the failure
is made again. An event a receiver handles is in the same position. `once` does not reach this — it
is about what a hop writes to its own state, and says outright that what an operation does through
its context happens once per run, not once per call.

An operation that asks for it continues instead. **Within one run, whatever the operation got back
from its context is remembered, and a later attempt of the same run is given it back rather than
asking again.** The operation still runs from the top on every attempt — JavaScript has no execution
point to save — but everything that already answered answers at once from the record, and what is
made again is the step that failed and whatever follows it. To the author, the operation resumes
where it failed.

A **run** is one task or one event, known by the identity it carries: the same on every attempt, on
a redelivery, and when an operator puts a parked message back.

A **step** is anything the operation asks of its context that answers with a value — a call, an
aspect (`fetch`, `stash`, `storages`, `amqp`, `delay`, whatever an extension adds), and the three
values that differ between attempts by nature: `context.id()`, `context.now()`, `context.random()`.
Its answer is recorded as it arrives, before the operation sees it. An exception is not an answer: a
step that raised is made again on the next attempt.

A step is recognized on a later attempt by **what it asks**, not by when it asks: the member, a
fingerprint of its arguments, and how many times the run has asked that member exactly that. Order is
not relied upon, because it is not deterministic:

```javascript
await Promise.all([a().then(b), c().then(b)])
```

`b` is made in whichever order `a` and `c` complete. `b(x)` and `b(y)` are told apart however they
interleave; two identical `b(x)` are told apart by their count, and which of the two recorded answers
each gets may swap between attempts — which nothing can observe, the callee included, since the two
requests were the same request.

A step whose key is not in the record is new, and is made. Changed code, or arguments that were
built from time or randomness taken outside the context, cost a real step rather than a refusal.

The record is kept by an extension, in a component it ships — the pattern cadence keeps its delayed
calls in. Core writes nothing for it, and knows nothing of it beyond the three values it now puts on
every context.

### Guarantees

**A run**

1. A step that answered is not made again in the same run, whether the next attempt follows an
   exception, a crash of the process, a redeploy, or a parked message being put back within the
   window.
2. Steps are recognized by what they ask, so concurrent branches replay correctly whatever order
   they complete in.
3. A run delivered again after it finished, within the window, makes no step.
4. Two copies of one run in flight at once share their answers: the one recorded first is the one
   both go on with.
5. A call made as a step carries the same identity on every attempt, so a callee that declares
   `once` refuses a repeat of it.

**What is refused**

6. A declared operation runs where nobody waits for it: as a task, or from a receiver. Any other
   request — a call, a route, a pulse — is refused where it arrives. So is a request that carries no
   identity, which is a caller from before identities: there is nothing to know its run by.
7. A step whose answer cannot be recorded — a stream — is refused. A `fetch` is recorded as its
   status, its headers and its whole body, and given back as a `Response`.
8. A component whose `continuity` names what is not one of its effects, or states a window that is
   not a whole number of seconds of at least `600`, does not boot.

**What is not promised**

9. A step that took effect, and whose answer was not recorded before the process died, is made
   again — with the same identity, so a callee in the system that declares `once` refuses it. An
   effect outside the system, such as a `fetch`, is repeated.
10. Time and randomness taken anywhere but the context, and the entity an effect reads (read again
    on every attempt), can change a step's arguments. Such a step is made again, not replayed.
11. Among identical steps made from concurrent branches, which branch gets which answer is not
    fixed. A later step built from a swapped answer has new arguments, and is made again.
12. A run that has used up its attempts is parked, as any task is. It resumes where it stopped only
    if it is put back within its window.
13. `context.now()` and `context.random()` outside a declared operation are `Date.now()` and
    `Math.random()`, and nothing is recorded.

### What a component author does differently

Names the operation and how long an unfinished run of it can still be resumed, in seconds:

```yaml
# manifest.toa.yaml
operations:
  onboard:
    type: effect

continuity:
  onboard: 604800 # a week
```

```javascript
async function effect(input, context) {
  const account = await context.remote.identity.accounts.create({ input })
  await context.fetch('crm', { method: 'POST', body: JSON.stringify(account) })
  await context.remote.mail.messages.send({ input: { to: account.email } })
}
```

```javascript
await context.call('users.onboarding.onboard', { input, task: true })
```

`send` throws: the next attempt answers `create` and `fetch` from the record and makes `send` again.

And takes time, randomness and new ids from the context — `context.now()`, `context.random()`,
`context.id()` — wherever they reach a step's arguments.

## The changes, by area

1. **Core** (`runtime/core`). The component context answers `newid()`, `now()` and `random()`: a
   new id as an entity's is made, `Date.now()`, `Math.random()`. A code, `Unrecordable`, permanent, for
   a step whose answer cannot be recorded.
2. **Node bridge** (`connectors/bridges.node`). `context.now()` and `context.random()`, and
   `context.id()` taken from the component context rather than from core's `newid` directly — so a
   decorator of the component context sees all three.
3. **Manifest** (`runtime/norm`). `continuity` is a shortcut for `@toa.io/extensions.continuity`, in
   a manifest and wherever a service is named.
4. **Definitions** (`definitions`). `extensions.continuity`: the declaration's schema, the
   `manifest` hook that refuses what guarantee 8 refuses, the digest of the journal component, and
   the deployment of its service. Registered in `DEFINED` and `DIGESTED`; the runtime depends on the
   package.
5. **The extension** (`extensions/continuity`).
   - `continuity.journal`, the component that holds the record: one entity per recorded step, keyed
     by the run and the step, carrying the answer and when the run expires; `record` writes a step
     get-or-create and answers what is stored, `recall` reads a run. A TTL index on the expiry.
   - `Factory.aspect` notes what a component declared, and puts nothing on its context.
   - `Factory.component` wraps `invoke` of a declaring component: a declared endpoint refuses a
     request that is neither a task nor a delivered event, and one without an identity; one that is
     admitted begins an attempt of its run — the record recalled once — in scope for what the
     operation does.
   - `Factory.context` wraps the declaring component's context — `call`, `apply`, `id`, `now`,
     `random`, and `invoke` of every aspect but those that are no step (`logs`, `span`, `metrics`,
     `configuration`, `state`, `atom`). Inside an attempt, and only for the invocation the run is,
     each is keyed, answered from the record or made and recorded; a call made as a step is given
     the identity derived from its key. Outside one, each passes through untouched.
   - `Factory.service` runs the journal, as cadence runs its metronome.
6. **Documentation.** The extension's readme; `continuity` in the component declaration; the new
   context members in the Node bridge readme; links from tasks, the inbox and exceptions.

## Decisions

1. **Replay rather than resume.** A run is the operation run again from the top with its context
   answering from the record, not a saved point of execution — JavaScript has none, and an
   operation written as ordinary code stays ordinary code. It was chosen over asking the author to
   split an operation into declared steps, which is a second programming model to learn and keep
   consistent with the first.
2. **Keyed by what a step asks.** The member, the fingerprint of its arguments and the count of that
   exact ask, over a sequence of every step or a count per member. Order is what concurrent
   branches do not keep, and a key built on it hands one branch the other's answer. Arguments alone
   would not do either: the same ask made twice — a poll — is two steps, each with its own answer.
3. **A step not in the record is made.** Over refusing the run: a refusal would park every run that
   was in flight across a deploy that changed an operation's code, and a run whose arguments drifted
   has nothing better to be given than a real answer.
4. **Recorded before it is seen.** The answer is written before the operation is given it, so what
   the operation acted on is what a later attempt is given. An answer that failed to be written is an
   exception, and the step is made again.
5. **The first answer recorded is the answer.** A write that finds the step already there takes what
   is there, so two copies of a run in flight converge instead of diverging.
6. **A call made as a step takes its identity from its key**, rather than from the per-target count
   an ordinary call derives it from — the same count concurrent branches make unreliable. It is
   given to `Call` as the request's `id`, which a call already prefers to deriving one.
7. **An extension, declared.** The record is written through a component the extension ships, so
   core stays without I/O of its own, and a component that does not declare `continuity` does not
   load the extension at all. Over an operation option in the core schema, which would have core
   refuse calls for a behavior it does not implement.
8. **Only an effect.** A transition or an assignment commits state computed from an entity that
   moves between attempts, and a replayed answer paired with a moved entity is a state nobody
   produced. An observation has nothing a retry repeats.
9. **Tasks and receivers, nothing waited for.** Both are retried with the same identity and have
   nobody waiting on the answer. A caller that waits retries by itself, under an identity of its own
   choosing, and a run of it is not one run.
10. **A window, stated.** How long a run can be resumed is the author's to decide — a parked run is
    put back by a person, and how late that can be is theirs to know — so there is no default.
    `600` as a floor, as for `once`: the broker alone repeats a message for about ten minutes.
11. **`now()` and `random()` on every context.** They are what makes a run's arguments reproducible,
    and an operation that is declared later should not have to be rewritten to use them.

## Context

- [Transactional inbox](./transactional-inbox.md) — the identity a call carries and derives for
  the calls it makes, which a run is keyed by, and `once`, which closes what a step made again after
  a crash leaves open.
- [Tasks](/documentation/tasks.md) and
  [where nobody is waiting](/documentation/exceptions.md#where-nobody-is-waiting) — what is retried,
  how often, and what is parked.
- [Cadence](/extensions/cadence) — an extension that keeps what it records in a component it ships.

## What happens today

Every attempt of a task or of an event runs the operation from the top, and every call, fetch and
stash it makes is made again. The documentation asks the author to make each of them safe to repeat,
or to write down that they were made in the same state change that makes them, and read that first.

## Stages

1. `id()`, `now()`, `random()` on the context.
2. The package, its definitions and the shortcut: a manifest that declares `continuity` boots, and
   one that declares it wrong does not.
3. The journal component and its service.
4. The refusal on arrival.
5. Recording and replaying steps, calls first, then aspects and `fetch`.

## Verification

1. A task whose operation raised after a call answered does not make that call again on the next
   attempt, and finishes.
2. The same, across a restart of the process between the attempts.
3. The same, for a `fetch` against a local server that counts what it is asked.
4. Two branches of a `Promise.all` that complete in the other order on the second attempt are each
   given their own answers.
5. A task delivered again after it finished makes no step.
6. An event a receiver hands to a declared operation is replayed as a task is.
7. A call that waits for a declared operation is refused, and so is a pulse.
8. A step that answers with a stream raises `Unrecordable`, and the run is parked.
9. A step whose answer cannot be recorded because the journal's database is down raises, and the
   run goes on once the database is back, without having made the step twice from what it
   recorded.
10. A manifest naming a transition, an operation that does not exist, or a window under `600` is
    refused.
11. `context.now()`, `context.random()` and `context.id()` answer outside a declared operation.

## Compatibility

- **Manifest.** `continuity` is new.
- **Context.** `now()` and `random()` are new; `id()` answers as before.
- **Exceptions.** `Unrecordable` is a new code.
- **Deployment.** A context whose components declare `continuity` deploys the journal's service, and
  its MongoDB has to be given for `continuity.journal`, as for any component.

## References

- Durable execution by replay of recorded activity results — the model Temporal and Azure Durable
  Functions are built on.
- [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), name-based UUIDs, for identities derived from
  a step's key.
