# The map states contracts

## Design concept

A component learns what another one provides from what it was given, rather than by asking it.

What a lookup answers is a function of the asked component's sources: its entity, its operations
and the bindings of its events, as `@toa.io/norm` normalises them. `toa map` reads those same
sources, so it writes them into the map beside the version it already writes there, and a process
reads a contract where it reads a version today. The exposition gateway is answered by the tenant
that announces routes to it, which carries its contract beside them.

A component is asked nothing, and `.lookup` is retired with everything that served and made it.

### Guarantees

**What a contract is read from**

1. A component's own contract, and that of every component composed in the same process, is what
   the process read from its sources *(today, by a lookup answered in memory)*.
2. Every other component's is the map's entry for it, which is the contract of the version the map
   names.
3. The exposition gateway reads the contract a tenant announced beside the routes it merged, so
   what it forwards and what it validates against are one version's *(today, by a lookup for the
   version the branch carries)*.
4. A call to a component that neither the process composes nor the map names is refused, and says
   what writes a map.

**What a boot does**

5. A boot makes no call to another component. A composition is ready when its own bindings are up,
   whatever else is running or is not.
6. An event the contract does not declare fails the boot, naming the component, the event and the
   version *(today)*.
7. A composition whose component's version differs from what the map states for it is refused, and
   names the component.

**What is said**

8. `toa map` writes the contract of every component of the Context, including one it evicts, and
   states nothing of how a component serves a call — its concurrency, its bridge, its storage and
   its migrations are its own.

**What is not promised**

9. That a component is running the version the map names. The map is what whoever deployed the
   Context stated; a component deployed from other sources than the map was written from — an
   evicted one, or one deployed by hand — is described by what the Context holds, which is the only
   version anything here could mean. Guarantee 7 covers every component a process composes itself.
10. That a caller's view of a peer is refreshed when the map is rewritten. A remote is built at the
    first call to a component and held for the life of the process, as it is today. A caller's own
    sources only ever make the calls its release knew how to make, and an endpoint two versions
    declare with different input schemas is the author's to keep compatible — the rule a rolling
    update already holds them to. The gateway is the exception, which is what guarantee 3 is.

### What a component author does differently

Nothing in a component, and nothing in how a process is started: `toa map` writes the same file to
the same place, and `toa compose`, `toa serve` and `toa mono` are given it as they are today.

```shell
$ toa map -p application                 # writes application/components.json
$ toa compose ./application/components/* --env application/.env --map application/components.json
```

What changes is that `toa call` is given one too, and is refused where a Context is there and its
map is not, as the other three are.

## The changes, by area

1. **What `toa map` writes.** `norm.map` writes an object per component instead of a version
   string:

   ```json
   {
     "default.orders": {
       "version": "3f9a1c02",
       "entity": { "properties": {}, "required": [] },
       "operations": {
         "transit": { "type": "transition", "scope": "object", "bindings": [], "input": {} }
       },
       "events": { "created": { "binding": "@toa.io/bindings.amqp" } }
     }
   }
   ```

   The same components as today — its own, the ones its extensions bring, the ones it evicts — and
   of each the part a caller uses: the entity's properties and what of them is required, the
   operations with what they take, answer and refuse with, and the binding of each event. An
   operation's `concurrency`, `bridge` and `forward`, and the entity's `storage` and `migrations`,
   describe how a component serves a call rather than how one is made, and an event's `path` is a
   path in the process that answered.

2. **Reading it.** `boot.map` answers a contract: `contract(id)` reads the file it was given at
   every call, as `version(id)` does today.

3. **Building a remote.** `boot.remote` takes the contract it is given, else the map's, else
   refuses. `boot.receivers.resolveBinding` reads `events[event].binding` from the same contract.

4. **What a process composes.** `boot.composition` states the manifests it boots to `boot.map`, so
   a component composed beside its caller is known without the map naming it, and a test that
   stages a composition states nothing.

5. **The announcement.** `Factory.tenant` is handed the manifest already and reads `version` from
   it; the branch carries the contract beside the version, and `Tenant` announces it. `Remotes`
   keeps its key — the component and the version — and builds with the contract the branch carries.
   `host.remote`'s third argument becomes the contract, which is what the extension-facing shape
   `(locator, source, contract)` says.

6. **`toa call`.** Given the map the way `compose`, `serve` and `mono` are, with `--map` beside
   `--env`.

7. **The boot's reading of the map.** A composition compares the version of each manifest it boots
   with what the map states for it, and refuses where they differ.

8. **What is removed.** `core.Discovery`, `core.Exposition`, `boot.discovery`, the `.lookup` and
   `.lookup..<version>` endpoints and the queues that carried them, and the loop binding's
   registration of both.

9. **The chart.** The ConfigMap renders the map as JSON rather than as indented JSON.

10. **Documentation.** `documentation/discovery.md` becomes `documentation/contracts.md`, and the
    page states what a contract is read from. Its section on the queues a retired version leaves
    behind, and the policy that cleared them, goes with them. `runtime/cli/readme.md` for `toa call`
    and for what `toa map` writes, and a migration note.

## Decisions

1. **The map, rather than an announcement everyone hears.** A map is a fact stated by whoever
   deployed the Context, where an announcement is a claim by whoever is running, chosen between by
   how recently a replica started. The gateway takes the announcement because it is answering for
   routes that came the same way, and the two arrive together or not at all.
2. **The same file, a richer shape.** One artifact, one flag, one mount, and one command to run
   again when sources change. Nothing outside the runtime reads the map's shape.
3. **A contract, rather than a manifest.** What a caller needs to make a call is a fifth of what a
   manifest holds, and one field of the rest — an event's `path` — means nothing outside the
   process it was normalised in. Sending it was harmless while a lookup answered from memory;
   writing it into a ConfigMap is not.
4. **The gateway reads the announcement, rather than the map.** A remote is built once and held for
   the life of the process. Every other caller may hold the contract it first read, because its own
   sources make only the calls its release knew how to make; the gateway forwards what a client
   sends to the routes a tenant announced, so its contract is replaced when those routes are. The
   announcement is what replaces them, and the only thing that holds the announcing version's
   contract at that moment: the map may still name the version before it, and reading the map again
   later is a poll.
5. **`.lookup` goes, rather than staying for a caller with no map.** A caller that asks the shared
   name is answered by whichever replica takes the message, which is what the version in the map
   was introduced to fix; keeping it would keep the queues, the wait and the code that makes them,
   as a second way to find a peer beside the one the map is.
6. **Compact JSON in the ConfigMap.** A ConfigMap is capped at 1 MiB. A Context of 39 components,
   its extensions' components included, writes 110 KB compact and 248 KB indented; the deployed
   copy is read by a program, and the one `toa map` writes is read by whoever is debugging.
7. **The version stays in the map.** It is what the contract belongs to, what the boot compares
   against what it composes, and what an image is tagged with.
8. **A request carries no contract version.** The callee trusts `authentic` as it does today. A
   caller already validates against a contract a differently versioned replica may serve — a call
   is addressed to an endpoint's queue, which every version consumes — and holding the callee to
   check would change the request envelope and the request path. It is its own change.

## Context

Versioned discovery (`discussions/discovery.md`, merged as #1172) made a lookup name the version it
is for, and gave every process a map that says which version of each component it asks. It left the
asking: a process still spends an RPC per peer to learn what the file it was given was made from.

That discussion's decision 11 weighed asking against announcing and kept asking, because an
announcement is chosen between by which replica started later. A map is neither: it is stated
before anything runs.

`TOA_EVENTS_<COMPONENT>` is the older precedent for a deployment telling a component something
about the Context it cannot see.

## What happens today

A component learns what a peer provides by an RPC to `<namespace>.<name>..lookup..<version>`, where
the version is the map's or, for the exposition gateway, the one the branch it merged carries. Both
that queue and the unversioned one are declared and consumed by every replica of every component.

A lookup has no deadline. It waits for the version it names and says so every five seconds, which
is what a component whose peer has yet to start does, and what a process with a stale map does
forever: a mounted ConfigMap is refreshed by kubelet out of band, so a pod a deployment does not
replace reads the previous map until that refresh reaches it. Where the peer's earlier replicas are
gone by then, the lookup asks a queue nobody consumes, and ends when the process is restarted.
Nothing orders the projection of a file into a running pod against the rest of a release: naming a
per-version ConfigMap in the pod spec, or annotating the pod template with the map's checksum,
would order it by replacing every pod of the Context on every deployment, which is what a mounted
file was chosen to avoid.

Each version of each component leaves two queues behind when it is retired, and the documentation
recommends an `expires` policy to clear them.

## Stages

1. The map holds contracts, `boot.map.contract` answers them, and `boot.remote` and `resolveBinding`
   read them where the map has an entry and ask where it has none.
2. A composition states what it composes.
3. The branch carries the contract, and the gateway builds a remote from it.
4. `toa call` is given the map.
5. What is left of asking is removed, and a contract nothing states is a refusal.
6. The boot's comparison of the map with what it composes.
7. The ConfigMap's rendering, and the documentation of what is gone.

They ship in one release.

## Verification

1. `features/runtime/contracts.feature`, staged as a rollout is — two compositions of one locator,
   from directories whose sources differ, with the loop binding off:
   - a caller is held to the contract the map states, and reaches an operation only that version
     declares;
   - a receiver is bound at the version the map states, with both versions serving;
   - a receiver on an event the stated version does not declare fails the boot, naming the
     component, the event and the version;
   - a composition boots and reports ready with no peer running;
   - a component composed beside its caller is called where the map names neither;
   - a call to a component the map does not name is refused, naming what writes a map;
   - a composition whose component's version the map states otherwise is refused.
2. `features/cli/map.feature`: the contract of every component of a Context is written, an evicted
   component's with them, and a path of the machine it was written on is in none of them.
3. `extensions/exposition/features/versions.feature`: an operation's input changes while its routes
   do not, and the gateway holds a caller to the contract of the version that announced them —
   with nothing serving a lookup, and with the map naming another version.
4. `features/deployment/map.feature`: the ConfigMap carries the contracts, and every workload
   mounts it where its command names it.
5. `runtime/boot`: the contract read from a map and the refusal where there is none.
   `extensions/exposition/source/{Factory,Remotes}.test.ts`: what a tenant announces, and what a
   remote is built from. `runtime/core/test/discovery.test.js` is removed with what it covered.
6. `npm run features`, `npm run test:unit`, `npm run typecheck`, `npm run lint`, and `npm run bench`
   for the verdict the pull request carries.

## Compatibility

**On the wire.** A branch carries a field a gateway of an earlier release ignores. The lookup
queues stop being consumed, and a process of an earlier release that asks one waits.

**In types.** `host.remote`'s third argument becomes a contract. Nothing a component declares
changes, and nothing generated does.

**In behaviour.** `toa call` reads a map and is refused without one where a Context is there. A
composition that calls a component neither it composes nor its map names is refused, where it
asked the shared queue before — which is what an application running a component outside its
Context, in a container of its own, has to be given a map for.

The release is taken in one: every pod of a Context is upgraded before a process of it calls a
peer that no longer answers a lookup.

## References

- [Mounted ConfigMaps are updated](https://kubernetes.io/docs/concepts/configuration/configmap/#mounted-configmaps-are-updated-automatically),
  on the kubelet's own schedule, which is what a contract read from one is correct under.
- [ConfigMap size](https://kubernetes.io/docs/concepts/configuration/configmap/#motivation), capped
  at 1 MiB by what stores it.
