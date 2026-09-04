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

| | |
|---|---|
| Deployment | `composition-<name>` |
| image | `<registry.base>/<context>/composition-<name>:<tag>` |
| pod label | `toa/composition: <name>` |
| pod label, per component | `toa/component-<namespace>-<name>: "1"` |

The image tag is a hash of the runtime version and of every member component's id and version,
so it changes when the members change and not otherwise.

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

```
Composition 'edge' declares no resources. Declare them on it or as the context's 'resources',
or 'resources: null' to deploy it without any.
```
