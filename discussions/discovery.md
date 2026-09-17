# Discovery asks for a named version

## Design concept

A lookup names the version of the component it asks, and only replicas of that version answer it.

A component serves `.lookup` under its own version beside the shared name, and a lookup names the
version it is for. Where the asker knows which version is serving what it is about to use, it names
that one; otherwise it names what the map says. `toa map` reads a context and writes every
component of it with its version, and every `toa compose`, `toa serve` and `toa mono` is given one,
the way each is already given an environment.

The exposition gateway is the asker that knows: it forwards a request to the routes a tenant
announced, so the contract it reads is that tenant's version, carried on the branch beside them.

A version is the content hash `manifest.version` already holds — the one an image is tagged with —
so a component whose sources did not change keeps it, and a process of a new release asks the
replicas already running and is answered by them.

### Guarantees

**What answers**

1. A lookup is answered by the version it names, or it is not answered.
2. A lookup for a version that is not up yet waits on its queue and is answered when it comes up.
   The queue is durable and the caller asserts it, so the request outlives the gap: there is no
   retry, no interval and no attempt limit in this path.
3. A component whose sources did not change keeps its version, so nothing has to be deployed in an
   order for a new process to be answered.
4. Every component of the context is in the map, including one it evicts. A component deployed
   from other sources than the context was is not reachable by a lookup until it is, and the wait
   names it.
5. A lookup of a component composed in the same process is answered in memory and reaches no
   broker, as it is today, and so are the calls built from it.
6. The exposition gateway reads the contract of the version that announced the route it matched,
   whatever the map says, so what it forwards and what it validates against are one version's.

**What is said**

7. A wait names the component and the version it waits for, every five seconds, as it already names
   the component *(today)*.
8. An event the named version does not declare fails the boot, naming the component, the event and
   the version. Today it is a `TypeError`.
9. A `compose`, a `serve` or a `mono` that finds no map where a context is there is refused, and
   says what makes one. A component run outside a context has no peers a map could name and needs
   none, and neither does a composition staged by a test or reached by `toa call`: a lookup with
   no version goes to the name every version answers on.

**What is read**

10. The map is read when a lookup is made, not once at a boot, so a process that outlives another
    component's deployment asks for what is running rather than for what was.
11. The map is found the way `.env` is: walked up to from where the command runs, or named with
    `--map`.

**What is not promised**

12. That a call reaches the version whose contract was read. A call goes to the endpoint's queue,
    which every version serves. The caller validates against the contract it discovered and sets
    `authentic`, so the callee does not validate again, and an endpoint two versions both declare
    with different input schemas is the author's to keep compatible — the rule a rolling update
    already holds them to for the State.
13. That a caller's view of a peer is refreshed when that peer is redeployed. A remote is built at
    the first call to a component and held for the life of the process, so what a caller reads is
    the contract of the version it first met, and it reads the map once per peer rather than once
    per call. It cannot be wrong for that caller: its own sources only ever make the calls that
    release knew how to make, and a contract that changes while two versions serve is additive by
    the rule above. The gateway is the exception — it forwards what a client sends rather than
    what its own sources knew — which is why it, and only it, follows the version that announced
    a route.
14. That an evicted component is running the version the context states. Something else deploys
    it, and the map says what the context holds, which is the only version anything here could
    mean.

### What a component author does differently

Nothing in a component: no declaration changes, no call changes, no manifest key.

What changes is how a process is started.

```shell
$ toa map -p application                 # writes application/components.json
$ toa compose ./application/components/* --env application/.env --map application/components.json
```

A run from a context root finds the map by itself and needs neither flag, exactly as it needs no
`--env`.

## The changes, by area

1. **Documentation, first.** There is no page for this area: `documentation/communication/ucp.md`
   has a `## Discovery` heading with nothing under it, and `documentation/component/receiver.md`
   links the word "discovered" to `href="#"`. `documentation/discovery.md` is the area as it
   stands and the version rule on top, and both dangling references point at it. `toa map` and
   `--map` go into the CLI readme, and the map into `documentation/deployment.md`.
2. **`toa map`.** A command beside `toa env`: `-p` for the context, `--as` for the output,
   `[environment]` positional. It reads the context with `@toa.io/norm`, which the CLI already
   depends on, and writes `{ "<namespace>.<name>": "<version>" }` for every component the context
   has — its own, the ones its extensions bring, and the ones it evicts.
3. **Finding it.** `runtime/cli/src/program.js` walks up for `components.json` as it already walks
   up for `.env`, with a `--map` option beside `--env`, and `compose`, `serve` and `mono` demand
   one. It is an option rather than a positional because all three are `<cmd> [paths...]`, and
   nothing follows a variadic positional.
4. **The queue.** `connectors/bindings.amqp/source/queues.js` gains the versioned lookup name,
   `<namespace>.<name>..lookup..<version>`, beside the `..tasks` and `..instances` it already
   composes.
5. **Serving.** `boot.discovery.expose` produces `.lookup` and `.lookup..<version>`, always both.
   One extra queue and one extra consumer per component.
6. **Asking.** `core.Discovery.lookup` takes the version it is for, keys its cache by component and
   version rather than by component, and names the version in its warning. `boot.remote` takes one
   too, and falls back to what the map says — so nothing but the gateway has to know a map exists.
   `boot.remote`'s third argument becomes `{ manifest, version }`; `host.remote` keeps the shape an
   extension sees, `(locator, source, version)`, which is what `host.js` is for.
7. **The gateway's branch carries the version.** `Factory.tenant` is already handed the manifest, so
   the branch a tenant announces carries `manifest.version` beside its routes, and
   `Remotes.discover` takes it as both the cache key it already is and the version to ask for. The
   hash of the route tree keeps its own name, `routes`, and goes on deciding refresh from merge;
   `version` becomes the component's, which is what the remote cache meant by it all along. A
   directive that calls a component on its own behalf has no branch, and falls back to the map
   like everything else.
8. **The receiver.** `boot.receivers.resolveBinding` asserts where the answer declares no such
   event, rather than reading a property of `undefined`.
9. **The stage.** `@toa.io/userland/stage` states one where a test needs one, and none otherwise —
   the refusal is the command's, not the boot's, so the suite of this repository and of an
   application goes on composing what it composes.
10. **The image and the chart.** The `CMD` of each image names the map, at a path
    `@toa.io/definitions` holds beside the ports table. The chart renders a ConfigMap and mounts it
    there on every composition, service and mono workload, and `toa compose --dock` mounts the same
    file into the container it runs.

## Decisions

1. **A file, not a variable.** The runtime reads a path it is given, which is Node.js and nothing
   else, so *Kubernetes is not a requirement* holds. A variable rendered into every workload's
   environment would change whenever any component does, so every pod of a context would be
   replaced by every deployment; one read from a `configMapKeyRef` instead would not, but it is
   resolved when a container starts and frozen after that, so a composition a deployment does not
   replace would keep a map naming the version of a peer it did. A mounted file is the one form
   that neither churns nor goes stale, and it is what decision 5 rests on.

   Handing one to a process that something else starts — a container an application runs of its
   own — is that application's, like the environment it already hands over. `--map` names it
   wherever it is put.
2. **Found like `.env`, required unlike it.** An absent `.env` is a run with no variables, which is
   a thing someone may mean. An absent map is a run that asks whichever replica answers first,
   which is the defect this removes, so it is refused and says what makes one — where a context is
   there. Outside one there are no peers a map could name, and a component composed on its own is
   a thing someone means too.
3. **Uniform across `compose`, `serve` and `mono`**, though `mono` is given a context and could
   read the versions out of it. One rule, and the map is then the same artifact in every run.
4. **Both queues served, always.** A process of an older runtime asks the shared name and is
   answered, and so is anything else built against it, without a component having to know which
   is asking. The cost is one queue and one consumer per component.
5. **Read at the lookup, not at the boot.** A process may first call a peer long after that peer
   was redeployed; a map read once at a boot would name a version that is gone, and the lookup for
   it would wait for something that is never coming. A lookup happens once per peer per process —
   `Context` holds one remote per component for the life of the composition — so this is a read per
   peer, not a read per call, and nothing on a hot path does it.
6. **Evicted components are in the map.** `toa env` leaves them out because variables are rendered
   into a workload, and a deployment creates none for one it does not deploy. A map is not per
   workload: it is one table everyone reads, and an evicted component is called like any other, by
   callers with the same exposure — several instances on two images answer one queue with two
   manifests. What it obliges is that an evicted component is deployed from the sources the context
   was, which evicting already implies: the context declares it, writes its types and publishes
   what it receives. Where it is not, its callers wait and the wait names the version.
7. **The gateway asks by the branch, not by the map.** Its route discovery is there so that a
   component's routes reach it without it being deployed again, and reading a map would put its
   answer back under the context's deployment. It is also the only asker that can be more exact
   than a map: it forwards to the routes a tenant announced, so the version that announced them is
   the one whose contract those routes are. A map would let it read one version's contract while
   serving another's routes, which is the defect this change is about, one layer up.
8. **The content hash, not a release identity.** `manifest.version` is already computed, already
   the image tag, and already changes exactly when the sources do. Nothing new is derived and
   nothing new has to agree on it. It is opaque and unordered, which is all this asks of it.
9. **No `x-expires`, in comq or here.** Declaring every RPC queue with one is not
   available: an existing durable queue cannot be redeclared with new arguments, so the assert
   would answer `PRECONDITION_FAILED` against every queue of every running deployment and the
   upgrade would mean emptying the broker. It is also the wrong semantics for an endpoint queue,
   where expiry would discard requests waiting while every replica is down, and tasks waiting to be
   run. The versioned lookup queues are new names and could carry it safely, but it would buy a few
   hundred empty queues a year and cost a way to discard a lookup waiting on a version that is
   still starting.

   *This said an `expires` policy was recommended instead, and named documentation that was never
   written. No policy is recommended: see [what removes a queue](./queues.md#what-removes-a-queue).*
10. **The version is not in the endpoint queue's name.** Routing calls by version would end
    load balancing across a rollout and make a deployment an ordering problem. Both versions serving
    one queue is what a rolling update is; what was wrong is only that a caller could not tell which
    one described itself to it.
11. **Asked, rather than announced.** A component could broadcast what it provides — the exposition
    gateway already does this for routes, with a knock, a periodic re-announcement and a
    supersession rule over the announcer's start time. It would answer the same question and one
    more, telling a component that is running without an endpoint from one that is not running. It
    is not taken: it chooses between two announcements by which replica started later, which is a
    guess, where the map is a fact stated by whoever deployed them — and it costs a channel, a
    registry in every process and traffic that never stops. Asking also keeps a lookup a call like
    any other, so the loop binding answers one for a component composed in the same process without
    the broker hearing of it; a registry would be a second way to find a peer, beside the one every
    call already takes.

## Context

The `.lookup` endpoint and the shape around it were written in October 2021 (`45e472531`) and have
not been designed since; everything after is lifecycle and leak fixing — who owns the discovery
instance, when it is torn down, and making the unbounded wait visible in the logs. This is the
first discussion of it.

`TOA_EVENTS_<COMPONENT>` is the precedent for a deployment telling a component something about the
context it cannot see: the events of its own that something consumes. It is the same shape and is
rendered by the same machinery a map is written from.

The exposition gateway's route discovery is the other half of the problem, solved the other way:
tenants announce, the gateway merges, and `Branch.decide` chooses between two versions of one
component by which tenant started later. Its comment on `timestamp` states the rollout problem this
discussion is about.

## What happens today

A component learns what a peer provides by an RPC to `<namespace>.<name>..lookup`, and every
replica of every version consumes that one queue. The answer comes from whichever replica took the
message. The chart deploys with `maxUnavailable: 0, maxSurge: 100%`, so old replicas serve until
new ones are ready and both are on the queue throughout — about even odds per ask.

A process handed the older manifest fails one of two ways:

- **A receiver.** `resolveBinding` reads `events[event].binding` of an answer that has no such
  event. That is an unguarded `TypeError`: it leaves `boot.receivers`, `boot.composition` rethrows
  it, the process exits 1 and the pod restarts into the same odds. No old replica is removed,
  because no new one becomes ready, so the rollout does not finish.
- **A call.** `boot.remote` builds a `Remote` from the answer and `Context` holds it for the life
  of the process. Every call to an endpoint the answer did not carry raises `EndpointException`,
  which is classified permanent and is never retried, until the process restarts.

Two components upgraded together, each declaring something the other now uses, deadlock on this:
each waits for the other's new replicas to become ready, and neither can.

Where a peer is not running at all, a lookup waits forever and says so every five seconds. That is
by design and is not changed here.

## Stages

1. The versioned queue name, and `expose` serving it beside the shared one. Additive: nothing asks
   for it yet.
2. `toa map`; finding and demanding the map; the stage deriving one.
3. The version as a parameter of a lookup: `toa map`, finding and demanding the map, reading it at
   the lookup, asking the versioned name, keying the cache by version, and the warning that names
   it.
4. The gateway's branch carrying the component version, and asking by it.
5. The receiver's assertion.
6. The image `CMD`, the ConfigMap and its mount, and `--dock`.

They ship in one release. The release changes every workload's command and adds a mount, so every
pod of a context is replaced by the upgrade and none is left running a runtime that asks for a
queue nothing serves.

## Verification

A rollout is staged in one process, with the loop binding off so that a peer composed beside the
caller is still reached over the broker: two compositions of one locator, from two directories whose
sources differ, are two versions of one component serving at once.

1. `features/runtime/discovery.feature`:
   - _A lookup is answered by the version the map names_: both versions serving, and a call reaches
     an operation only the newer one provides.
   - _A version the map does not name does not answer_: the same two, with the map naming the older
     one, and the call refused for an endpoint it does not have.
   - _A version that is not up yet is waited for_: the map names one nothing serves; the call is
     made and is not answered, and is answered once that version is composed.
   - _A receiver is bound at the version the map names_: the component whose receiver is on an event
     only the newer version declares boots, with both versions serving.
   - _A receiver on an event the named version does not declare_: the boot fails, naming the
     component, the event and the version — where it read a property of `undefined` before.
2. `features/cli/map.feature`:
   - _Writing the map of a Context_, and _an evicted component is in it_.
   - _A composition is refused where a Context has no map_, naming `toa map`.
   - _A component outside a Context needs none_.
3. `extensions/exposition/features/versions.feature`: an operation's input changes while its routes
   do not, and the gateway holds a caller to the contract of the version that is running. It fails
   before this change, which is the defect the branch's version fixes.
4. `features/deployment/map.feature`: the map is exported with the directory and the file, the
   ConfigMap is rendered, and every workload mounts it. `features/deployment/build.feature` and
   `services.feature` read the `CMD` that names it.
5. `runtime/core/test/discovery.test.js`: a wait names the version, and one lookup is held per
   version. `extensions/exposition/source/{Branch,Remotes}.test.js`: what is the same thing
   exposed, and the version a remote is asked for and keyed by.
6. `npm run features` whole, `npm run test:unit`, `npm run typecheck` and `npm run lint`.

## Compatibility

**On the wire.** Additive: a queue name nothing used before, and the shared one is still served.

A process of this release always has a map, so it always asks the versioned name — and a peer of an
earlier release does not serve it, so it would wait. Inside a deployment that cannot happen: the
release changes the command and the mounts of every workload, so every pod of a context is replaced
by the upgrade and no peer of the earlier release is left. Outside one it can — a `toa compose` of
this release, run by hand against a context deployed on the previous one, waits on a lookup and says
which version it waits for. Upgrade the context first; the migration note says so.

**In types.** Nothing generated changes. A component's manifest is unchanged.

**In behaviour.** `toa compose`, `toa serve` and `toa mono` stop running without a map. That is
what this breaks, and it breaks every local run and every process supervisor of every application —
one flag, or one file in the directory the command runs from, and `toa map` in whatever already
runs `toa env`.

## References

- [RabbitMQ policies](https://www.rabbitmq.com/docs/parameters#policies), and the `expires`
  argument the documentation recommends setting through one.
- [Kubernetes rolling updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment),
  whose `maxUnavailable` and `maxSurge` are what put two versions on one queue.
- [Mounted ConfigMaps are updated](https://kubernetes.io/docs/concepts/configuration/configmap/#mounted-configmaps-are-updated-automatically),
  except where a file is placed with `subPath` — which is why the map is mounted as a directory and
  named rather than found.
