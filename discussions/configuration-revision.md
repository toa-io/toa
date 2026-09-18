# A component takes the defaults of its own deployment

## Design concept

A component is deployed with the **revision** of its configuration: a hash of the defaults the
deployment gives the values service for it. The values service answers the defaults it serves
with the revision of what it holds, and a component takes deployed defaults only when the two are
the same. An answer from a values service of another deployment is refused and asked again, and
the refusal is logged as what it is.

The epoch follows the schema and says what a configuration object must look like. The revision
follows the deployed defaults and says which deployment they came from. Within one epoch there are
as many revisions as deployments that changed the defaults.

The revision is in the component's own environment, so a deployment that changes a component's
defaults and nothing else replaces its processes as well.

### Guarantees

**What a component takes**

1. A configuration created for the component's epoch is taken from whichever values service
   answers, whatever its revision _(today)_.
2. Deployed defaults are taken only from a values service that holds the revision the component
   was deployed with.
3. An answer of another revision is refused, and the component asks again, the way it asks while
   nothing is there _(today, for none)_. A values service older than this change answers no
   revision, which is another one.
4. A refusal is logged as `Configuration of another revision refused`, naming the component, the
   epoch, the revision expected and the revision received — the first and every fifth, as waiting
   is reported. A component that was refused is not also reported as waiting.

**What a deployment does**

5. Every component the deployment manages that declares configuration is given the revision of
   its defaults: the Context's values over the manifest's `defaults`, as the values service is
   given them.
6. A deployment that changes a component's defaults replaces its processes, as a change to its
   sources does.

**What is not promised**

7. That a component deployed by other means — an evicted one, a process started by `toa compose`
   or `toa run` — refuses anything. It is given no revision, and takes what it is served, as it
   does today.
8. That a process of the previous release, started once its values service is gone, boots. It
   waits, and says what it refused, until it is replaced or the deployment is rolled back.
9. That a component already running follows a change of defaults. It is replaced instead
   (guarantee 6), and takes the new defaults when its replacement starts.

### What a component author does differently

Nothing. The revision is written by `toa deploy` and read by the extension. What they see is a
log entry during a rollout, where a process started before the values service was replaced:

```
warn  Configuration of another revision refused
      component=default.ops epoch=3f2a… expected=9c41… received=51d0…
```

## The changes, by area

1. **The revision.** `@toa.io/definitions/extensions.configuration` exports `revision(defaults)`:
   the SHA-256 of the defaults as canonical JSON, with no defaults hashed as `{}`, which is what the
   values service serves for them. It is computed the way the epoch is.
2. **The deployment.** `deployment()` gives every managed instance that declares configuration
   `TOA_CONFIGURATION_REVISION_<NAMESPACE>_<NAME>`, beside its secrets. A name and a namespace are
   alphanumeric, so the variable is three segments past the prefix where the local override is
   two, and secrets begin with `__`.
3. **The values service.** `fetch` answers `revision` beside `configuration` and `created`: the
   revision of the defaults it served, or `null` for a created object. `resolve` computes it from
   the entry it was deployed with.
4. **The aspect.** An `Aspect` reads the variable for its component and hands the revision to the
   `Client` with its epoch. The `Client` settles an answer that is a created object, one asked
   without a revision, or one of the revision asked; it keeps any other pending, and reports it as
   refused.
5. **Documentation.** `extensions/configuration/readme.md`: the revision beside the epoch, the
   `fetch` output, what a component does with an answer of another revision, and that a change of
   deployed values replaces the component.

## Decisions

1. **A revision per component, rather than one per deployment.** A hash has no order, so a
   component cannot tell an older deployment from a newer one, only another one. With one hash for
   the whole Context every process of the previous release would refuse every values service of
   the next, whether its defaults changed or not, and a restart of one of them during a rollout
   would wait for a service that is gone. Per component, only a component whose defaults changed
   refuses anything, and a rollback makes the revisions match again.
2. **Refused by the component, rather than by the service.** The request could name the revision
   and the service decline to answer another. But a values service of the previous release knows
   nothing of revisions, and answers what it holds whatever it is asked; the stale answer this is
   about is that one. Only the component can refuse it.
3. **Hashed from the defaults, rather than from the deployment's map.** The map states the
   components' contracts and versions, and changes when any source changes. What makes an answer
   stale is its defaults, and a change of defaults moves no version the map states.
4. **A variable of the component, rather than a value read from the map.** The map is a mounted
   file, refreshed out of band. A variable is part of the pod spec, so changing it replaces the
   processes, which is guarantee 6.
5. **Refusing, rather than ordering the rollout.** `toa deploy` could replace the values service
   before everything else. That would rest on the platform's rollout order, which the runtime does
   not require, and a values service draining its last requests would still answer.
6. **The revision is not the epoch.** Configuration objects are stored under the epoch. An epoch
   that followed the defaults would leave every created object behind on every change of the
   Context's values.
7. **A log entry of its own.** A refusal is a component telling a deployment from another, which
   is not what waiting for a configuration that is not there says, and it is what the author will
   search for.

## Context

The contract map ([contracts](./contracts.md)) made a component refuse a peer of another version at
boot. The values service is not a component of the Context: what it serves is not a contract but
what the deployment told it, and nothing a component could compare told it which deployment that
was.

An application saw a component of the new release take a default of the previous one: a value in
its Context's configuration annotation had changed, the schema had not, and the process that
answered was a values service of the previous deployment, still serving during the rollout.

## What happens today

A component asks for its configuration for its epoch once, when it starts. The values service
answers the latest object created for that component and epoch, else the defaults it was deployed
with, if the epoch is the one it was deployed with. The answer is valid against the schema and of
the same epoch, whichever deployment the service belongs to.

A component's processes are given only the variables of its secrets. A deployment that changes a
component's defaults and not its sources leaves its processes running with the defaults they took.

## Stages

1. `revision()`, and `deployment()` giving it to every managed instance.
2. The values service answering `revision`.
3. The aspect and the client refusing an answer of another revision, and logging it.

They ship in one release.

## Verification

1. `features/extensions/configuration.feature`, against the broker and the database:
   - a component deployed with the Context's values, served by a values service still holding the
     previous values, does not boot, and logs the refusal with both revisions; once the values
     service holds the values of its deployment, the component boots with them;
   - a component served a created object boots with it, whatever the values service's revision;
   - a component given no revision boots with the defaults it is served.
2. `features/deployment/configuration.feature`: every managed component that declares configuration
   is given its revision, an evicted one is not, and the revision changes with the Context's values.

## Compatibility

- **On the wire.** `fetch` answers one field more. A component of the previous release reads what
  it read.
- **In behaviour.** Across the release that brings this, a component of the new release refuses a
  values service of the previous one, which answers no revision, until the new one is up — which
  it is by the time the rollout finishes. A change of a Context's configuration values alone now
  replaces the components whose defaults it changes.
