# A deploy the cluster is not ready for is refused

## Design concept

A value a workload must not carry in the chart is rendered as a reference to a Kubernetes secret,
and that secret is the application's to deploy. Nothing checks that it was. A deploy whose secret
is absent builds every image, pushes it, moves the environment tag onto it and applies the release;
Kubernetes then creates no container, and what the developer is left with is a rollout stalled on
`CreateContainerConfigError` and a registry that has moved on. The name of what is missing is in a
pod's events, two `kubectl` calls away from the command they ran.

The cluster holds the answer before any of that happens, and reading it costs one call. So a deploy
reads it first, and refuses:

```
$ toa deploy production
Secrets are not deployed: toa-mongodb.default/username, toa-mongodb.default/password
```

What it requires is what `toa export secrets` already prints — the same set, from the same context.
One command says what the cluster has to hold, the other refuses to deploy until it does.

### Guarantees

**What is required**

1. Every secret key a workload would read is required to be in the cluster: the name of the secret
   and the key in it, as `name/key`.
2. The set is what `toa export secrets` lists for the same environment — read from the same
   context, by the same rules, so what one names the other refuses.
3. A key marked `(optional)` is not required. The workload starts without it, which is what the
   mark means.
4. The image pull secret a context names under `registry.credentials` is required as well, by name:
   a pod that cannot pull starts no more than a pod that cannot read a secret. Only its presence is
   required, since what it must hold is the registry's affair.
5. Nothing is required of a value. An empty or a wrong one is a value, and the cluster is asked for
   keys, not for what is under them.

**The refusal**

6. A refused deploy has built, pushed, tagged and applied nothing. The registry and the cluster are
   as they were.
7. Every missing key is named, in one message, in the order the chart reads them:
   `Secrets are not deployed: <name>/<key>, <name>/<key>`. A secret that is absent altogether is
   named by each of the keys it owes, which is also what `toa conceal` takes.
8. A secret that is there but lacks a key is reported by the key it lacks, not by its name.

**What is read**

9. The cluster read is the one the deploy applies to: the current `kubectl` context, and the
   namespace `--namespace` names where one is given.
10. `--dry` reads nothing. It applies nothing, so nothing has to be there.
11. A `kubectl` that cannot reach the cluster, or may not list secrets, fails the deploy as the
    error it is, and not as a cluster that holds no secret.

**Not promised**

12. A secret that is there when the deploy starts and gone when the pods start is not caught. This
    is a preflight, not a guarantee held over a rollout.
13. Nothing else the cluster has to hold is checked: not a storage class, not an ingress class, not
    a namespace, not a volume claim.

### What a developer does differently

Nothing, where the secrets are in place. Where they are not, the deploy says so in the first second
instead of the tenth minute, and names what to run:

```shell
$ toa deploy production
Secrets are not deployed: toa-mongodb.default/username, toa-mongodb.default/password

$ toa conceal mongodb.default username=todos password=secret
$ toa deploy production
```

## The changes, by area

1. **The preflight.** A module of `@toa.io/operations` that turns the deployment's variables and
   its pull secret into the references the cluster has to hold, reads what the namespace holds in
   one `kubectl` call, and raises naming the difference.
2. **The deploy.** `Operator.install` runs it before anything else it does. `export`, `template`,
   `variables` and the registry are untouched, so `toa env`, `toa conceal`, `toa export` and
   `toa push` read the cluster no more than they do today.
3. **Documentation.** The deployment guide states the refusal in the order a deploy does things and
   in the section on secrets; the CLI readme states it under `toa deploy`.

## Decisions

**One `kubectl get secrets`, rather than one call per secret.** A namespace is read whole, and the
keys of every secret in it come with it. Per-secret calls would be one process per key group, and
the wrapper Toa already has for a single secret answers `null` for a secret that is absent and for a
cluster that cannot be reached alike — a preflight that cannot tell those apart reports the wrong
thing at the worst time. Listing needs no permission a deploy does not already have: Helm keeps its
own release state in secrets of the same namespace and lists them on every upgrade.

**Keys, not secrets.** A pod is held back by a key it cannot read, not by an object that is
missing, and a secret that was created with one of two keys is the case a name-only check passes and
the rollout does not. Naming keys also names what to conceal.

**The pull secret is in.** It is not Toa's to create — the documentation says so — but it is named
by the context, read by every pod, and its absence fails a deploy exactly as visibly. What is
declared is what is checked.

**No way to skip it.** A flag that waives the check is a flag that ends up in the script that
deploys, and then the check protects the one deploy that was run by hand. Where a secret is put in
place by something other than `toa conceal`, the check is satisfied by that something having run
first, which is the order the cluster needs anyway.

**No new dependency on the cluster.** The runtime is unchanged; this is the deployment tooling
reading the cluster it was already told to deploy into, which is where a Kubernetes assumption
belongs.

## What happens today

`toa deploy` builds and pushes every image, writes the chart, moves the environment tag, and runs
`helm upgrade -i`. Helm reports a successful release: every object it applied was accepted, and a
Deployment whose pods cannot be created is accepted. With `--wait` the command sits until the
timeout and fails without naming a cause; without it, it succeeds and the rollout never completes.
The missing secret is named nowhere in the output — it is in the events of a pod that was never
created.

`toa export secrets` prints what the cluster has to hold, and reads no cluster: it is a list to
compare by eye against `toa reveal`, one secret at a time.

## Stages

1. The preflight: what is required, what the cluster holds, and the message naming the difference.
2. The deploy: the call, before anything is built.
3. The scenarios and the documentation.

## Verification

1. **A deploy whose secrets are absent is refused.** A context that declares infrastructure with
   credentials, a cluster with none of them: `toa deploy` exits non-zero naming every key, and the
   local Docker daemon was never asked to build.
2. **A deploy whose secrets are in place is not refused.** The same context after `toa conceal`:
   the deploy proceeds past the check.
3. **A secret missing one key is refused by that key.** Only the key that is absent is named.
4. **An optional key is not required.** A context whose only secret key is optional deploys with
   the cluster holding nothing.
5. **The namespace is the one deployed into.** The secrets of another namespace do not satisfy a
   deploy into `--namespace`.
6. **A pull secret that is absent is named.** A context declaring `registry.credentials` with the
   secret absent is refused by its name.
7. **A dry run reads no cluster.** `toa deploy --dry` renders with the cluster holding nothing.
8. **What reads a context reads no cluster.** `toa env`, `toa export secrets` and `toa export
   deployment` ask one for nothing, as they do today.

1, 2, 3, 5, 6 and 7 run `toa deploy` against a cluster, which no compose file stands up, so they
are `@manual`. 4 and 8 hold by where the read is made rather than by what it answers, and the unit
suite is where that is held: the deploy reads the cluster before it exports or pushes, and nothing
else reads it at all.

## Compatibility

A deploy that was going to work works. A deploy that was going to stall now fails instead, at the
start and with the reason — which is the change, and the only behavioural difference an application
can observe.

Two cases are worth stating. A context whose secrets are deployed by something that runs after the
`toa deploy` command starts now has to run before it. And a deploy run where `kubectl` cannot list
the secrets of the target namespace now fails at the preflight; every Helm upgrade already lists
secrets there, so a credential that could deploy could already read them.
