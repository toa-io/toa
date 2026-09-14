# Discovery asks for a named version

## Design concept

A lookup names the version of the component it asks, and only replicas of that version answer it.

Which version of each component is running is known to whoever starts the processes, and is written
down: `toa map` reads a context and writes every component of it with its version, and every
`toa compose`, `toa serve` and `toa mono` is given one, the way each is already given an
environment. A component serves `.lookup` under its own version beside the shared name; a caller
asks the name the map gives.

A version is the content hash `manifest.version` already holds — the one an image is tagged with —
so a component whose sources did not change keeps it, and a process of a new release asks the
replicas already running and is answered by them.

### Guarantees

**What answers**

1. A lookup is answered by the version the map names, or it is not answered.
2. A lookup for a version that is not up yet waits on its queue and is answered when it comes up.
   The queue is durable and the caller asserts it, so the request outlives the gap: there is no
   retry, no interval and no attempt limit in this path.
3. A component whose sources did not change keeps its version, so nothing has to be deployed in an
   order for a new process to be answered.
4. A component the context evicts is not in the map, and a lookup of one is answered by whatever
   is running — as every lookup is today.
5. A lookup of a component composed in the same process is answered in memory and reaches no
   broker, as it is today, and so are the calls built from it.

**What is said**

6. A wait names the component and the version it waits for, every five seconds, as it already names
   the component *(today)*.
7. An event the named version does not declare fails the boot, naming the component, the event and
   the version. Today it is a `TypeError`.
8. A `compose`, a `serve` or a `mono` that finds no map is refused, and says what makes one.

**What is read**

9. The map is read when a lookup is made, not once at a boot, so a process that outlives another
   component's deployment asks for what is running rather than for what was.
10. The map is found the way `.env` is: walked up to from where the command runs, or named with
    `--map`.

**What is not promised**

11. That a call reaches the version whose contract was read. A call goes to the endpoint's queue,
    which every version serves. The caller validates against the contract it discovered and sets
    `authentic`, so the callee does not validate again, and an endpoint two versions both declare
    with different input schemas is the author's to keep compatible — the rule a rolling update
    already holds them to for the State.
12. Nothing about a component deployed outside this context. Its version is not the context's to
    know, which is why an evicted one is left out rather than guessed at.

### What a component author does differently

Nothing in a component: no declaration changes, no call changes, no manifest key.

What changes is how a process is started.

```shell
$ toa map -p application                 # writes application/.map.json
$ toa compose ./application/components/* --env application/.env --map application/.map.json
```

A run from a context root finds the map by itself and needs neither flag, exactly as it needs no
`--env`.

## The changes, by area

1. **Documentation, first.** There is no page for this area: `documentation/communication/ucp.md`
   has a `## Discovery` heading with nothing under it, and `documentation/component/receiver.md`
   links the word "discovered" to `href="#"`. `documentation/discovery.md` is the area as it
   stands and the version rule on top, and both dangling references point at it.
2. **`toa map`.** A command beside `toa env`: `-p` for the context, `--as` for the output,
   `[environment]` positional. It reads the context with `@toa.io/norm`, which the CLI already
   depends on, and writes `{ "<namespace>.<name>": "<version>" }` for every component the context
   has — its own and the ones its extensions bring — leaving out what it evicts.
3. **Finding it.** `runtime/cli/src/program.js` walks up for `.map.json` as it already walks up for
   `.env`, with a `--map` option beside `--env`, and `compose`, `serve` and `mono` demand one. It
   is an option rather than a positional because all three are `<cmd> [paths...]`, and nothing
   follows a variadic positional.
4. **The queue.** `connectors/bindings.amqp/source/queues.js` gains the versioned lookup name,
   `<namespace>.<name>..lookup..<version>`, beside the `..tasks` and `..instances` it already
   composes.
5. **Serving.** `boot.discovery.expose` produces `.lookup` and `.lookup..<version>`, always both.
   One extra queue and one extra consumer per component.
6. **Asking.** `boot.discovery.lookup` reads the map and asks the name it gives; `core.Discovery`
   keys its cache by component and version rather than by component; the warning carries the
   version.
7. **The receiver.** `boot.receivers.resolveBinding` asserts where the answer declares no such
   event, rather than reading a property of `undefined`.
8. **The stage.** `@toa.io/userland/stage` derives the map from the context it already loads, so a
   scenario — this repository's or an application's — carries no file.
9. **The image and the chart.** The `CMD` of each image names the map, at a path
   `@toa.io/definitions` holds beside the ports table. The chart renders a ConfigMap and mounts it
   there on every composition, service and mono workload, and `toa compose --dock` mounts the same
   file into the container it runs.

## Decisions

1. **A file, not a variable.** The runtime reads a path it is given, which is Node.js and nothing
   else, so *Kubernetes is not a requirement* holds. A variable would have to be rendered into
   every workload's environment, and the map changes whenever any component does — so every pod in
   the context would be replaced on every deployment, and a pod that came up between two of them
   could not be told.
2. **Found like `.env`, required unlike it.** An absent `.env` is a run with no variables, which is
   a thing someone may mean. An absent map is a run that asks whichever replica answers first,
   which is the defect this removes, so it is refused and says what makes one.
3. **Uniform across `compose`, `serve` and `mono`**, though `mono` is given a context and could
   read the versions out of it. One rule, and the map is then the same artifact in every run.
4. **Both queues served, always.** A caller outside the deployment, a service on an older runtime
   and an evicted component are all answered without anything having to know which is which. The
   cost is one queue and one consumer per component.
5. **Read at the lookup, not at the boot.** A process may first call a peer long after that peer
   was redeployed; a map read once at a boot would name a version that is gone, and the lookup for
   it would wait for something that is never coming. A lookup happens once per peer per process,
   so the read is off every hot path.
6. **The content hash, not a release identity.** `manifest.version` is already computed, already
   the image tag, and already changes exactly when the sources do. Nothing new is derived and
   nothing new has to agree on it. It is opaque and unordered, which is all this asks of it.
7. **No `x-expires`, in comq or here; a policy instead.** Declaring every RPC queue with one is not
   available: an existing durable queue cannot be redeclared with new arguments, so the assert
   would answer `PRECONDITION_FAILED` against every queue of every running deployment and the
   upgrade would mean emptying the broker. It is also the wrong semantics for an endpoint queue,
   where expiry would discard requests waiting while every replica is down, and tasks waiting to be
   run. The versioned lookup queues are new names and could carry it safely, but it would buy a few
   hundred empty queues a year and cost a way to discard a lookup waiting on a version that is
   still starting. The documentation recommends an `expires` policy, where the TTL is set by
   someone who can see the broker.
8. **The version is not in the endpoint queue's name.** Routing calls by version would end
   load balancing across a rollout and make a deployment an ordering problem. Both versions serving
   one queue is what a rolling update is; what was wrong is only that a caller could not tell which
   one described itself to it.
9. **Asked, rather than announced.** A component could broadcast what it provides — the exposition
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
3. Reading the map at the lookup, asking the versioned name, keying the cache by version, and the
   warning that names it.
4. The receiver's assertion.
5. The image `CMD`, the ConfigMap and its mount, and `--dock`.

They ship in one release. The release changes every workload's command and adds a mount, so every
pod of a context is replaced by the upgrade and none is left running a runtime that asks for a
queue nothing serves.

## Verification

A rollout cannot be staged in one process: `boot.bindings.produce` and `consume` put
`@toa.io/bindings.loop` first, so a peer in the same process short-circuits the broker and the
queue is never shared. These run `toa compose` as a child process, the way
`features/cli/compose.feature` already does, twice over one broker.

1. `features/runtime/discovery.feature`:
   - _Two versions, and the new one is read_: two components in a workspace, composed; both sources
     changed so that each declares an event the other receives and an operation the other calls;
     `toa map` again; the new pair composed while the old pair still serves. The new composition
     boots, its receiver consumes the event, and its call reaches the new operation.
   - _An unchanged peer answers_: only one of the two changed. The new process asks the other at
     its unchanged version and is answered by the replicas already running.
   - _A version that is not up yet_: the map names a version nothing serves, then it is started.
     The lookup is answered when it comes up, with nothing logged as an error in between.
   - _A map that moved on_: a peer is replaced at a new version and the map rewritten, and the
     first call to it made afterwards reaches the new version — the map was read at the lookup.
   - _An event no version declares_: the boot fails naming the component, the event and the
     version.
2. `features/cli/map.feature`:
   - _What it writes_: every component of the context with its version, its own and what its
     extensions bring, and nothing the context evicts.
   - _It is found_: `toa compose` from a context root, with no `--map`.
   - _It is required_: `toa compose` where none is found and none is named, refused, naming
     `toa map`.
3. `features/deployment`: the ConfigMap is rendered and mounted on every composition, service and
   mono workload, and each `CMD` names the path it is mounted at.
4. `npm run features` whole, including what is tagged slow: every scenario that boots a composition
   goes through the stage's derived map, so the suite is the coverage of that path.

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
