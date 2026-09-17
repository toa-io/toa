# Deployment

**Kubernetes is not a requirement.** An application runs wherever there is Node.js and the
infrastructure it connects to — a broker, a database, a Redis — and nothing the runtime produces
assumes otherwise. What is described here is the opinionated tooling Toa ships for those who want a
cluster, and reaching for it is the application's choice.

A context is deployed as container images and a Helm release: one image per
[composition](compositions.md), one per extension service no composition runs, and a chart that
names them. One command builds all of it, pushes it and applies it.

```shell
$ toa deploy production --wait
```

## TL;DR

```yaml
# context.toa.yaml

name: todos
version: 1.4.0

registry:
  base: registry.example.com/acme

resources:
  cpu: [200m, 1]
  memory: [256Mi, 1Gi]

compositions:
  - name: edge
    components: [todos.tasks, todos.stats]
    services: [exposition]
    replicas: 3

ingress:
  hosts: [api.example.com]

amqp: amqp://rmq.example.com
mongodb: mongodb://mongo.example.com
```

```shell
$ toa export secrets production                 # what the cluster has to hold
$ toa conceal amqp-context.default username=todos password=...
$ toa deploy production --wait
```

## What has to be installed

`toa deploy`, `toa build`, `toa push`, `toa env`, `toa export` and `toa conceal` need
`@toa.io/operations` beside the CLI; a container that runs a composition cannot deploy one. A
machine that only deploys needs no runtime and no extension:

```shell
$ npm i @toa.io/cli @toa.io/operations
$ npx toa deploy production -p application
```

`docker`, `helm` and `kubectl` have to be on the `PATH`, and the current `docker` and `kubectl`
contexts are the ones used. `registry.services: build` is the one thing that needs the runtime
installed as well — see [extension service images](#extension-service-images).

## The commands

| command                        | what it does                                    |
| ------------------------------ | ----------------------------------------------- |
| `toa deploy [environment]`     | builds, pushes, renders and applies             |
| `toa build`                    | builds every image on the local daemon          |
| `toa push [environment]`       | builds every image and pushes it                |
| `toa export deployment`        | writes the chart without applying it            |
| `toa export images`            | writes the build contexts without building them |
| `toa export secrets`           | lists the secrets the cluster has to hold       |
| `toa export tags`              | prints the image reference of every workload    |
| `toa conceal`, `toa reveal`    | writes and reads a secret                       |
| `toa env [environment]`        | writes what a workload is given to a `.env` file |

Every option each of them takes is in the [CLI readme](/runtime/cli/readme.md#operations).

`toa deploy` does, in order:

1. **Builds and pushes** every image the registry does not already have. An image it has is
   skipped, so deploying sources that were pushed builds nothing.
2. **Writes the chart** — `Chart.yaml`, `values.yaml` and the templates — into a temporary
   directory.
3. **Moves `<image>:<environment>`** onto what it pushed, so a reader of the registry can see what
   an environment is running.
4. **Applies it**: `helm upgrade -i <context name>`, into `--namespace` where one is given.

`--dry` stops after rendering and prints what would be applied. `--wait` waits for the rollout and
then for the replicas it replaced to finish terminating — Helm answers once the replacements are
ready, while the old ones are still draining, and a request made in that window lands on either.
`--timeout` is how long both are given, Helm's `5m` by default; a rollout that has made no progress
for 15 minutes is failed whatever it says.

## Environments

A deploy names an environment, and every key of the context is read for it:

```yaml
# context.toa.yaml

registry:
  base@local: localhost:5000
  base@production: registry.digitalocean.com/acme
  services: published
  services@local: build

evicted@production:
  components:
    - todos.stats
```

The name may be a chain, `primary:fallback:…`. Each key takes the first of those that has an `@`
suffix, and the unsuffixed key if none of them does; the running environment is the first name, and
the chain itself is not stored. `toa env staging:production` writes `TOA_ENV=staging`.

`toa deploy` defaults to `default`, and `toa env` to `local`. An environment is named the same way
to every command, so the one a deploy read is the one `toa export secrets` reads.

**An image tag carries no environment.** It is a hash of the sources, so the same revision deployed
to two environments is one image, built once; what an environment moves is a tag of its own, beside
the hash. Do not name an environment eight hex digits, or `deps-` and eight: a retention job reads
such a tag as content and deletes it.

## What a context declares

| key               | what it sets                                                  |
| ----------------- | ------------------------------------------------------------- |
| `name`            | the release, the image repository, and the infrastructure scope |
| `version`         | the chart's version; a chart without one is refused by Helm    |
| `description`     | the chart's description                                        |
| `runtime`         | the version deployed, and the npm registry a build reads       |
| `registry`        | where images go, and how they are built                        |
| `compositions`    | what is deployed as one pod, and how much of it                |
| `evicted`         | what this context does not deploy, whatever else names it      |
| `resources`       | what a workload may take, where it states nothing of its own   |
| `mono`            | the replicas and resources of a `--mono` deployment            |
| `ingress`         | where the services that declare an ingress land                |
| `annotations`     | what the extensions and connectors are given, or a shortcut of one |
| `atomicity`, `outbox`, `inbox`, `addressed`, `events` | runtime settings, carried as variables |

`name` and `registry` are required, and an unknown key is refused.

### Compositions

A composition is a set of components deployed as one pod, and the unit an image is built for. It
states how many pods it runs, what it may take, which extension services run in its pod, and the
image its members are built on:

```yaml
compositions:
  - name: edge
    replicas: 3
    components: [todos.tasks, todos.stats]
    services: [exposition]
```

A component no composition lists gets one of its own, named after the component's label. Absent
`replicas`, a composition deploys two pods. See [compositions](compositions.md) for the whole of
it, including what [`evicted`](compositions.md#evicted) leaves out.

### Resources

Every deployment states what it may take, on itself or as the context's default. One that states
nothing is refused:

```
Composition 'edge' declares no resources. Declare them on it or as the context's 'resources',
or 'resources: null' to deploy it without any.
```

```yaml
resources:
  cpu: [200m, 1]
  memory: [256Mi, 1Gi]

compositions:
  - name: edge
    resources:
      cpu: [500m, 2]
      memory: [500Mi, 1Gi]
    components: [todos.tasks]
```

Each pair is `[request, limit]`. `resources: null`, at either place, deploys without any — a
decision rather than an omission, which is why there is no default.

**The memory limit sizes the heap.** Node reads the machine's memory rather than the container's,
so a workload with a memory limit is given `NODE_OPTIONS=--max-old-space-size` at three quarters of
it, and what is left is the process itself — its code, its buffers, its threads. A deployment that
states `NODE_OPTIONS` of its own keeps it.

A derived composition has nowhere to state its own, so it takes the context's.

### Services and ingress

An extension that runs a service is deployed as a workload of its own, unless a composition lists
it and runs it in its pod. Either way it keeps its `Service` and its `Ingress`, under the same
names; what changes is the pods they select. See [services](compositions.md#services).

A service declares the port and the path it claims. Where that lands is the context's business, and
it is said once for every service:

```yaml
# context.toa.yaml

ingress:
  hosts:
    - api.example.com
  class: alb
  annotations:
    alb.ingress.kubernetes.io/group.name: example
  default: true
```

What a service declares for itself wins, and this fills in the rest. `default: true` adds a rule
with no host, which is how a controller is given a fallback. A service that declares an ingress
where nothing names a host is refused:

```
Service 'introspection-explorer' declares an ingress, but no hosts are defined. Declare them in
the context's 'ingress' section.
```

`hosts` must be the hostnames the [exposition](/extensions/exposition) serves: a page published on
a host the gateway does not answer on cannot reach the API beside it.

A port is claimed once within a pod — see [reserved ports](ports.md).

## Images

### The base image

Every image is built `FROM ghcr.io/toa-io/runtime:<runtime.version>`, published with each Toa
release and carrying `@toa.io/runtime` already installed; a workload's own build installs what its
components depend on and nothing else. `runtime.version` absent, the release the CLI belongs to is
the one deployed.

A base image of your own is named for the whole context, for one composition, or for one component:

```yaml
# context.toa.yaml

registry:
  build:
    image: node:24.14.0-alpine3.22
    run: |
      npm i --prefix /toa @toa.io/runtime --omit=dev
      ln -s /toa/node_modules/.bin/toa /usr/local/bin/toa
```

```yaml
# manifest.toa.yaml

build:
  image: node:20.10.0-buster-slim
```

**A base image has to provide the `toa` binary**, which is `@toa.io/cli`'s and which the runtime
depends on, so installing the runtime into `/toa` puts it there. `/toa` is where it goes: what an
extension installs for what a component declares is installed beside the extension that reads the
declaration.

Every member of a composition builds on the same image. Where the components disagree, the
composition says which:

```yaml
compositions:
  - name: edge
    image: node:24.14.0-alpine3.22
    components: [todos.tasks, todos.stats]
```

```
Composition 'edge' requires different base images for its components. Specify base image for
the composition in the context.
```

### Run commands and build arguments

`run` is added to the build as `RUN`, one instruction per line. The context's and each component's
are both applied, the context's first:

```yaml
# context.toa.yaml

registry:
  build:
    arguments: [GITHUB_TOKEN]
    run: |
      npm config set //npm.pkg.github.com/:_authToken ${GITHUB_TOKEN}
      apk add --no-cache ffmpeg
```

`arguments` names environment variables of the machine that builds. Each becomes an `ARG` and an
`ENV`, so it is readable by the `run` commands and by whatever the install runs.

> A build argument becomes an `ENV`, so it stays in the image and in the environment of every
> container that runs it. A token passed this way is readable by whoever can pull the image.

A build behind a private npm registry is told about it once, for every image:

```yaml
runtime:
  registry: https://npm.example.com
  proxy: http://proxy.example.com:3128
```

What a workload runs is fixed: `toa compose` for a composition, `toa serve` for an extension
service, `toa mono` for a single-image deployment. A container is not the place to change it —
what a component does on its way up is a
[run command](/connectors/bridges.node/readme.md#run-commands) of its own.

### Two images per workload

A composition is two images in one repository:

| tag           | what it holds                                              |
| ------------- | ---------------------------------------------------------- |
| `deps-<hash>` | what its components depend on, installed on the base image |
| `<hash>`      | the sources, laid over that as a single linked layer       |

`deps-<hash>` is tagged by everything the install reads — the runtime version, the base image, the
build options, each component's `package.json` and `package-lock.json`, and what the extensions
install for what the components declare — so it is rebuilt only when one of those changes. A
deploy that changes code alone builds and pushes the sources layer, and neither downloads nor
uploads the dependencies again.

A dependency named by a moving git ref is installed when the dependencies image is built and not
again until that image's inputs change. Pin it to a commit and bump it there.

An extension's heavy dependency is not installed with the extension: what a component declares is
what a deploy installs, so a composition whose components declare no `s3` storage carries no AWS
SDK, whatever another composition declares.

### Where images go

```yaml
# context.toa.yaml

registry:
  base: registry.example.com/acme
  platforms: [linux/amd64, linux/arm64]
  credentials: docker-credentials-secret-name
  services: published
```

- **`base`** is prepended to `<context>/<workload>:<tag>`. `registry: <string>` is shorthand for
  it.
- **`platforms`** is what an image is built for, `linux/amd64`, `linux/arm/v7` and `linux/arm64`
  by default. `platforms: ~` builds for the machine that builds, which is faster and is what a
  local registry usually wants.
- **`credentials`** is the name of a Kubernetes secret holding registry credentials; it is
  rendered as the pods' `imagePullSecrets`. The secret itself is not Toa's to create.

`toa deploy` writes two tags on every workload image: `<name>:<hash>`, which the chart pins, and
`<name>:<environment>`, moved onto it. `toa push` writes the content tag alone. `deps-<hash>`
carries no environment tag.

### Extension service images

`registry.services` says where an extension service's image comes from.

`build`, the default, builds one per service into `registry.base`, from the installed extension —
so it needs the runtime installed beside `@toa.io/operations`. Its tag carries the runtime version,
so every Toa release rebuilds them all.

`published` takes the image the extension ships and builds nothing:

```
ghcr.io/toa-io/extension-exposition-gateway:1.0.0-alpha.311
ghcr.io/toa-io/extension-realtime-streams:1.0.0-alpha.311
ghcr.io/toa-io/extension-introspection-explorer:1.0.0-alpha.311
ghcr.io/toa-io/extension-configuration-values:1.0.0-alpha.311
```

They are pulled from `ghcr.io` rather than from `registry.base`, are public, and `credentials` does
not apply to them. A cluster that cannot reach `ghcr.io` needs `build`. A service a composition
runs is in that composition's image either way, and neither setting applies to it.

## What a deploy renders

| object                                | for                                           |
| ------------------------------------- | --------------------------------------------- |
| `Deployment composition-<name>`       | a composition                                 |
| `Deployment extension-<group>-<name>` | an extension service no composition runs      |
| `Service extension-<group>-<name>`    | an extension service that binds a port        |
| `Ingress extension-<group>-<name>`    | an extension service that declares an ingress |
| `ConfigMap components`                | the [component map](contracts.md#the-map)     |

The pods carry `toa/composition: <name>`, `toa/component-<namespace>-<name>: "1"` for each member,
and `toa/service-<group>-<name>: "1"` for each service they run — which is what that service's own
`Service` selects, so `extension-exposition-gateway` resolves the same whether the gateway is
deployed on its own or inside a composition.

What a workload is given beyond that is the same for all of them:

- **A rollout replaces nothing until the replacement is ready**, and starts every replacement at
  once: `maxUnavailable: 0`, `maxSurge: 100%`. A rollout takes one start-up rather than one per
  replica.
- **A readiness probe and a startup probe**, where the workload has something to answer them: the
  telemetry probe on `8001`, or the exposition gateway's own on `8004`. Both are polled every two
  seconds, so a replica is ready when it says so.
- **A pod is given 45 seconds to stop**, and waits 5 of them before it begins, so the endpoints it
  serves are withdrawn before it stops answering.
- **The pods are spread across nodes**, counting only the current revision — a rollout spreads the
  new pods whatever nodes the old ones are on, and where one node is all that fits, they are
  scheduled there. Counting by revision needs Kubernetes 1.27 or later.

## Variables and secrets

A workload is given `TOA_CONTEXT`, `TOA_ENV`, and whatever the extensions and connectors it
carries contribute for its components. What a deploy resolved is in the pod's own environment — a
container reads no `.env`.

A value that must not be in the chart is rendered as a reference to a Kubernetes secret instead,
and the secret is yours to deploy. What a context needs is printed:

```shell
$ toa export secrets production
toa-amqp-context.default:
  username
  password
toa-mongodb.default:
  username
  password
```

```shell
$ toa conceal amqp-context.default username=todos password=secret
```

`toa conceal` prefixes `toa-`; a secret made by other means carries the prefix itself. A key marked
`(optional)` may be absent, and the workload starts without it. See
[pointer](/libraries/pointer/readme.md#credentials) for how a name follows from what the context
declares.

The same set of variables is what a local run needs, and `toa env` writes it:

```shell
$ toa env local --dev                     # writes .env, secrets filled with dev defaults
$ toa env production --interactive        # prompts for each secret
$ toa env -c todos.tasks                  # only what this component needs
```

Run it again after changing what the context deploys — an [evicted](compositions.md#evicted)
component still needs its variables, and `-c` writes them whether or not Toa deploys it.

## Infrastructure and extensions

What a deployment connects to is declared once, per context, by the package that reads it — by
shortcut or by package reference:

```yaml
# context.toa.yaml

amqp: amqp://rmq.example.com
mongodb:
  .: mongodb://mongo.example.com
  todos.stats: mongodb://analytics.example.com
stash: redis://redis.example.com
storages:
  uploads:
    provider: s3
    bucket: todos-uploads
    region: eu-west-1
exposition:
  authorities:
    example: api.example.com
```

| shortcut         | what it configures                                         |
| ---------------- | ---------------------------------------------------------- |
| `amqp`           | [the broker](/connectors/bindings.amqp)                    |
| `mongodb`        | [the database](/connectors/storages.mongodb)               |
| `stash`          | [transient state](/extensions/stash)                       |
| `storages`       | [BLOB storage](/extensions/storages)                       |
| `exposition`     | [the API gateway](/extensions/exposition)                  |
| `realtime`       | [realtime events](/extensions/realtime)                    |
| `configuration`  | [configuration](/extensions/configuration)                 |
| `telemetry`      | [logs, traces, metrics](/extensions/telemetry)             |
| `introspection`  | [the topology map and halt](/extensions/introspection)     |
| `cadence`        | [calls on their own time](/extensions/cadence)             |
| `convergence`    | [regions converging on one state](/extensions/convergence) |

An address is written without credentials, and resolves by the deepest match — a component, then
its namespace, then the default `.` key. A storage that mounts a volume names the claim, and the
pods of the components that declare that storage mount it.

Beside them the context sets what the runtime itself does, all of it carried to every workload as
variables: [`atomicity`](/connectors/atomicity), [`outbox`](outbox.md), [`inbox`](inbox.md),
[`addressed`](stateful.md#waiting) and [`events`](component/declaration.md#events).

## One image for the whole context

`--mono` builds one image that runs every component and every extension service in one process, and
deploys it as a single `Deployment`, `Service` and `Ingress`, all named `mono`:

```shell
$ toa build --mono
$ toa deploy staging --mono
```

```yaml
# context.toa.yaml

mono:
  replicas: 2
  resources:
    cpu: [200m, 2]
    memory: [256Mi, 2Gi]
```

Without `mono:` it deploys two replicas and takes the context's `resources`. One `Ingress` serves
every service's path, longest prefix first, and one `Service` fronts every port they bind. An
evicted component is run nowhere, as everywhere else.

## Several processes of one context on shared infrastructure

Every process of a context names what it keeps after its scope: the context's name, followed by
`TOA_SUFFIX` where one is given. Processes given different suffixes run beside each other against one
MongoDB, one pair of brokers on one virtual host and one Redis, and see nothing of each other — a
local copy of an application started next to another one, say.

```shell
$ TOA_SUFFIX=-agent-0a1b2c3d4e5f toa compose ./components/*
```

| where    | without a suffix                         | with one                                          |
| -------- | ---------------------------------------- | ------------------------------------------------- |
| MongoDB  | the database `app`                       | the database `app-agent-0a1b2c3d4e5f`             |
| AMQP     | `<namespace>.<component>.<endpoint>`, …  | `app-agent-0a1b2c3d4e5f.<namespace>.<component>.<endpoint>`, … |
| Redis    | `app:<namespace>:<component>:<key>`, …   | `app-agent-0a1b2c3d4e5f:<namespace>:<component>:<key>`, … |

- **Nothing is put between the context and the suffix**, so a suffix begins with whatever separator
  you want. `app` with `1a` and `app1` with `a` are one scope and share everything.
- **Letters, digits and hyphens.** A suffix holding anything else, or nothing, fails the boot.
- **63 bytes in all.** A MongoDB database name is no longer than that, so a context and suffix that
  add up to more fail the boot of a component with storage.
- **Read as the process boots**, from its environment or its `.env`. Setting `process.env.TOA_SUFFIX`
  afterwards changes what the processes it starts are given, and nothing of its own.
- **Not everything is scoped.** `comq.retry.*` and `comq.parked` are shared by every process on a
  broker, the queue a process's replies arrive on is `comq.reply..<random id>`, and what an extension
  keeps elsewhere — the files of `storages`, a federation upstream of
  `convergence` — is named as it is configured.
- **A copy starts empty.** Its database, its queues and its keys are its own, so it has none of the
  data of the processes it runs beside.
- **No foreign events arrive.** A receiver declaring a `source` consumes an exchange under the
  scope, and whoever publishes those events names it without one, so a process under a suffix
  receives none of them. A flow that depends on them is exercised by a process without a suffix.
