# Scope

## Design concept

A process names what it keeps on shared infrastructure after its scope: the name of its context,
followed by `TOA_SUFFIX` where one is given. Processes of one context with different suffixes share
a MongoDB, a pair of brokers on one virtual host and a Redis without meeting on any of them, and
contexts sharing a Redis no longer share its keys.

### Guarantees

**The scope**

1. A process's scope is `TOA_CONTEXT` followed by `TOA_SUFFIX`, with nothing between them:
   `app` and `-agent-0a1b2c3d4e5f` are `app-agent-0a1b2c3d4e5f`. Without a suffix the scope is the
   context.
2. A suffix is letters, digits and hyphens. Anything else, the empty string included, fails the
   boot and names the variable.
3. The suffix is read once, as the process boots, from its environment or its `.env`. A process
   that sets `process.env.TOA_SUFFIX` afterwards — for the processes it starts — keeps its own
   names.

**MongoDB**

4. The database is the scope. Without a suffix it is the context, as it is *(today)*.
5. A scope longer than MongoDB takes for a database name — 63 bytes — fails the boot, naming it.

**Redis**

6. A stash key is `<scope>:<namespace>:<component>:<key>`.
7. An atomicity key is `<scope>:atom:<group>:<kind>:<key>`, and the slots a group registers are
   under `<scope>:atom:<group>:slots:`.

**AMQP**

8. With a suffix, every exchange and queue a process declares begins with `<scope>.` — those of its
   requests, tasks, events, receivers, broadcasts and channels, and the queues derived from them —
   but the queue its replies arrive on.
9. Two processes with different suffixes on one virtual host send each other nothing: a request, a
   task or an event of one is not delivered to the other.
10. Without a suffix every name is what it is *(today)*.

**What is not promised**

11. `comq.retry.*` and `comq.parked` are shared by every process on a broker. A parked message says
    which queue it came from, and that name carries the scope. The queue a process's replies arrive
    on is `comq.reply..<id>`, its own by a random id and gone with it, and it carries no scope: a
    permission granted by prefix grants `comq.` too.
12. A suffix is not a separator. `app` with `1a` and `app1` with `a` are one scope, and share
    everything.
13. Two processes with one scope share everything, as two replicas of a deployment do *(today)*.
14. A receiver declaring a `source` consumes its exchange under the scope, while the system whose
    events they are names it without one, so a process under a suffix receives no foreign event.
15. What an extension keeps elsewhere — the files `storages` writes, what a federation upstream
    names — is not scoped. An operator federating a channel under a suffix names the suffixed
    exchange.

### What a component author does differently

Nothing. A process is given a suffix by whoever starts it:

```shell
$ TOA_SUFFIX=-agent-0a1b2c3d4e5f toa compose ./components/*
```

## The changes, by area

1. **`@toa.io/generic`.** `environment.scope()` answers the scope, and `environment.suffix()` the
   suffix or `undefined`. The suffix is validated and kept on first read, in the store every copy
   of the package shares; `set` and `delete` of `TOA_SUFFIX` forget it, and so does a `.env` that
   gives one. Without `TOA_CONTEXT` the scope is `toa-dev` under `TOA_DEV=1`, as the database is
   *(today)*, and a boot failure otherwise.
2. **`@toa.io/boot`.** `composition` and `component` read the suffix right after absorbing the
   environment, which is after `.env` is loaded and before anything is named.
3. **`storages.mongodb`.** `resolveDB` answers the scope, and asserts its length.
4. **`extensions.stash`.** The connection's `keyPrefix` begins with the scope.
5. **`atomicity`.** The keys an atom makes and the prefix it hands n-and-i begin with the scope,
   taken when the atom opens with a Redis to write to — an atom is one per group for the life of a
   process, and one without a Redis has no keys to name. n-and-i puts `{group}` after the prefix
   it is given and needs no change.
6. **`bindings.amqp`.** `queues.js` puts `<scope>.` in front of every name it makes where a suffix
   is given, and `Receiver` does the same for the label it consumes, which arrives as it was
   declared rather than through `queues.js`. The labels a component's receivers declare and the
   ones an extension receives (`configuration.values.created`, the introspection signal, a
   realtime route) all reach the broker through `Receiver`, so none of them changes.
7. **Documentation.** `documentation/deployment.md` says what `TOA_SUFFIX` scopes and its limit;
   the stash and atomicity readmes the keys; `migrations/310.md` what the keys change costs.

## Decisions

1. **A suffix, not a namespace or a prefix.** A namespace is a component's already, and what comes
   in front of a name is the context. The operator chooses what the suffix begins with, a hyphen
   included, so there is no separator to agree on.
2. **Concatenated.** A scope is a name of the same shape as a context, fit for a database name, and
   a suffix like the one above reads as one. The collisions this allows are between suffixes an
   operator chose, and are accepted.
3. **Redis is always scoped.** A stash key and a lock were named by component and by group alone,
   so two contexts on one Redis — the common case — shared a cache and took each other's locks.
   Putting the context in front fixes that for every deployment and makes a suffix nothing more;
   the cost is a cache that starts empty and a deploy in which old and new replicas lock apart.
4. **AMQP is scoped only under a suffix.** A deployment is kept apart on a broker by its virtual
   host already. Renaming every exchange and queue of a running deployment would strand what its
   durable queues hold, to buy nothing it does not have.
5. **The scope comes first.** comq appends to the names it is given — `..<group>`, `.<instance>` —
   and so does this binding — `..tasks`, `..instances` — so what one process holds on a broker is
   everything that begins with `<scope>.`, one prefix for a policy or a clean-up. The reply queue is
   named by comq alone, at random, and is left as it is rather than changing comq for a name no two
   processes can share.
6. **Read once.** Names are taken at different moments — when a connector is made, when it opens,
   when a message is broadcast — so a suffix that changed while a process ran would split it across
   two scopes. A process that starts others sets what they are given, and that must not move it.
7. **Receivers are scoped in the binding.** Every label a receiver consumes reaches the broker
   through `Receiver`, whoever declared it. Scoping it there covers what a manifest declares and
   what an extension asks for, and leaves the label a component reads as it wrote it.
8. **A foreign source is scoped like everything else.** Its exchange is named by whoever publishes
   to it, so nothing a suffixed process declares can meet it. Consuming it unscoped, under a group
   of its own per copy, would put a durable queue per copy on a broker this deployment does not
   own, and a copy that goes away leaves it there. So a suffix is for what a context holds itself,
   and a flow fed from outside is exercised without one.
9. **Convergence is left alone.** Its channels are named through `queues.js`, so they are scoped
   like everything else; what crosses between regions is the operator's federation, which names
   exchanges and is written by hand.

## Context

AI agents working on an application each run a copy of it locally, and each copy is one more set of
processes of the same context. Giving every copy a database, a pair of brokers and a Redis of its own
is what a suffix makes unnecessary.

The Redis half of it was a defect already: applications deployed side by side are commonly given one
Redis address, and their stash and atomicity keys carried nothing of the context they belonged to.

## What happens today

The database is `TOA_CONTEXT`, or `toa-dev` under `TOA_DEV=1`. Exchanges and queues are named by
namespace, component and endpoint or label, and a deployment is separated from another by virtual
host. Stash keys are `<namespace>:<component>:<key>`; atomicity keys `atom:<group>:<kind>:<key>`.

## Stages

1. The discussion and the documentation.
2. The scenarios, failing.
3. The environment: the suffix, the scope, and reading it at boot.
4. MongoDB, Redis and AMQP, one at a time.

## Verification

1. `features/runtime/environment.feature`:
   - _The suffix is read as the process boots_: a composition under a suffix writes to the database
     of its scope, and a suffix set in `process.env` after the boot is not what the next composition
     in the process writes to.
   - _A suffix that is not a name is refused_.
2. `features/storages/mongodb.scope.feature`: the database is `<context><suffix>`, and the context
   without one.
3. `features/bindings/scope.feature`:
   - _A request is not answered across scopes_, until a composition of its own scope is up, which
     answers it.
   - _An event is not received across scopes_, likewise.
   - _Names begin with the scope_: the broker holds the component's queues under it.
4. `features/extensions/stash.feature` and `features/aspects/atom.feature`: keys begin with the
   scope, with a suffix and without.
5. The exposition, realtime, configuration and introspection suites.

## Compatibility

On the wire, nothing without a suffix. In behaviour, every stash and atomicity key moves under the
context: a stash is empty after the deploy that brings it, and during that deploy a replica of the
old release and one of the new lock and register apart. A process given a suffix is a new set of
names wherever it is used.
