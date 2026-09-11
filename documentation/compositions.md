# Compositions

A composition is a set of components deployed as one pod, and the unit `toa build` builds an
image for.

```yaml
# context.toa.yaml

compositions:
  - name: edge
    components:
      - todos.tasks
      - todos.stats
```

A component is referenced as `namespace.name`. A composition name is 1 to 32 letters and
digits, starting with a letter.

A component no composition lists gets one of its own, named after the component's label:
`todos.lists` becomes the composition `todos-lists`. A derived name always carries the hyphen a
declared one cannot, so the two never collide.

A component this context has none of is refused by name:

```
Composition 'edge' lists an unknown component 'todos.three'.
```

An unknown key in a composition is refused.

## Deployed

|                          |                                                      |
| ------------------------ | ---------------------------------------------------- |
| Deployment               | `composition-<name>`                                 |
| image                    | `<registry.base>/<context>/composition-<name>:<tag>` |
| pod label                | `toa/composition: <name>`                            |
| pod label, per component | `toa/component-<namespace>-<name>: "1"`              |

The image tag is a hash of the runtime version and of every member component's id and version,
so it changes when the members change and not otherwise.

The pods are spread across nodes, counting only those of the current revision: a rollout spreads
the new pods whatever nodes the old ones are on, and where one node is all that fits, they are
scheduled there all the same. Counting by revision needs Kubernetes 1.27 or later.

## Services

A composition may run extension services in its own pod, rather than let each be deployed on
its own:

```yaml
compositions:
  - name: edge
    components:
      - todos.tasks
    services:
      - exposition
```

A service is named by shortcut (`exposition`) or by package reference
(`@toa.io/extensions.exposition`).

One a composition lists gets no Deployment of its own. Its `Service` and its `Ingress` stay,
under the same names, and select the pods of the composition running it — so
`extension-exposition-gateway` resolves the same whether the gateway is deployed on its own or
inside a composition. The composition's pods carry `toa/service-<group>-<name>: "1"`, which is
what that `Service` selects.

A service no composition lists is deployed on its own.

Several compositions may run one service. Every pod running it carries the label, the one
`Service` selects them all, and there is one `Ingress`.

An extension that is listed but runs no service is refused:

```
Composition 'edge' lists '@toa.io/extensions.telemetry', which contributes no service.
```

An extension no component references is pulled in by being listed.

### Ports

A port is claimed once within a pod. Two compositions may each bind the same port — see
[reserved ports](ports.md).

### Running one locally

`toa compose` takes `--service`, repeated:

```shell
$ toa compose ./components/* --service exposition --service configuration
```

Absent the option, the list is read from `TOA_SERVICES`, whitespace-separated, which is what
the deployment sets from `services`.

The list is exact — unlike [`toa mono`](../runtime/cli/readme.md#mono), nothing is discovered.
A service the named ones talk to answers over the network in a deployment; in one process it is
named too, or nothing answers it.

## Evicted

`evicted` names what Toa does not deploy for this context, whatever else names it. What it names
is still part of the context — it is called, `toa types` writes its types, `toa npm` installs its
packages, and what it receives is published — and is deployed by other means:

```yaml
# context.toa.yaml

compositions:
  - name: edge
    components:
      - todos.tasks
      - todos.stats
    services:
      - exposition

evicted:
  components:
    - todos.stats
  services:
    - exposition
```

An evicted **component** is in no pod, gets no `Service`, is in no image, and its migrations do
not run. Nothing only evicted components require is deployed either: a storage nothing else
stores in, an extension nothing else declares.

A composition every component of which is evicted is not deployed, and the name it held is free
again. A service it listed falls back to a `Deployment` of its own, unless another composition
runs it.

An evicted **service** is deployed nowhere: no `Deployment`, no `Service`, no `Ingress`, in a
composition's pod or on its own — including a service an annotation alone would have deployed.
The extension is otherwise untouched: the components that declare it still carry it, and what it
contributes besides a service still applies.

Eviction only ever subtracts, so naming a service nothing here would have deployed changes
nothing. A component this context has none of is refused by name:

```
'evicted' names an unknown component 'todos.three'.
```

Every key of a context is read for the environment it is deployed to, so this is where an
environment deploys less than another:

```yaml
evicted@production:
  components:
    - todos.stats
```

A call to an evicted component is answered by whatever deploys it, and waits while nothing does.
`toa env` writes the variables of what Toa deploys, so run it again after changing this, or an
environment file still carries variables for what Toa no longer deploys.

## Base image

Every member of a composition builds `FROM` the same image. Where they disagree, the
composition states which:

```yaml
compositions:
  - name: edge
    image: node:24.14.0-alpine3.22
    components:
      - todos.tasks
      - todos.stats
```

```
Composition 'edge' requires different base images for its components. Specify base image for
the composition in the context.
```

## Resources

Every composition states what it may take, on itself or as the context's default. A derived
composition has nowhere to state its own, so it takes the context's.

```yaml
resources:
  cpu: [200m, 1]
  memory: [200Mi, 500Mi]

compositions:
  - name: edge
    resources:
      cpu: [500m, 2]
      memory: [500Mi, 1Gi]
    components:
      - todos.tasks
```

`resources: null`, at either place, deploys without any.

The memory limit also sizes the heap: the container runs with `--max-old-space-size` at three
quarters of it. A deployment that states `NODE_OPTIONS` in its variables keeps its own.

```
Composition 'edge' declares no resources. Declare them on it or as the context's 'resources',
or 'resources: null' to deploy it without any.
```
