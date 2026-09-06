# Toa Operations

## Compositions

A composition is deployed as one pod. Beside its components it may run extension services,
which are otherwise each deployed on their own:

```yaml
# context.toa.yaml

compositions:
  - name: edge
    components:
      - todos.tasks
    services:
      - exposition
```

See [compositions](../documentation/compositions.md).

## Context

### Container Registry

Deploy images default to `FROM ghcr.io/toa-io/runtime:<runtime.version>`
(published with each Toa release). The base image already has `@toa.io/runtime`
installed; composition/service Dockerfiles only install component dependencies.

To use a custom base image, set `registry.build.image` (or `composition.image`).
That image must provide the `toa` CLI, or install it via `registry.build.run`:

```yaml
# context.toa.yaml

registry:
  build:
    image: node:24.14.0-alpine3.22
    run: npm i -g @toa.io/runtime --omit=dev
```

#### Extension Service Images

`registry.services` says where an extension service's image comes from.

`build`, the default, builds one per service into `registry.base`. Its tag carries the
runtime version, so every Toa release rebuilds them all.

`published` deploys the image the extension ships and builds nothing:

```yaml
# context.toa.yaml

registry:
  services: published
```

The images are tagged with the runtime version:

```
ghcr.io/toa-io/extension-exposition-gateway:1.0.0-alpha.285
ghcr.io/toa-io/extension-realtime-streams:1.0.0-alpha.285
ghcr.io/toa-io/extension-introspection-explorer:1.0.0-alpha.285
ghcr.io/toa-io/extension-configuration-values:1.0.0-alpha.285
```

The cluster pulls them from `ghcr.io` rather than from `registry.base`. They are public and
`registry.credentials` does not apply; a cluster that cannot reach `ghcr.io` needs `build`.

The field is environment-scoped like the rest:

```yaml
# context.toa.yaml

registry:
  base@local: localhost:5000
  base@production: registry.digitalocean.com/acme
  services: published
  services@local: build
```

An extension that states no image is built whatever this says, as is a service a
composition runs in its own pod.

#### Build Options

```yaml
# context.toa.yaml

registry:
  build:
    arguments: [GITHUB_TOKEN]
    run: npm config set //npm.pkg.github.com/:_authToken ${GITHUB_TOKEN}
```

`arguments` is a list of environemt varialbes to be passed to `docker build`.

`run` is a command(s) to be executed during build. Multiline is supported.

```yaml
# context.toa.yaml

registry:
  build:
    run: |
      echo test > .test
      rm .test
```

#### Registry Credentials

When using private container registry,
a secret containing required credentials can be specified using `registry.credentials` option.

```yaml
# context.toa.yaml

registry:
  credentials: docker-credentials-secret-name
```
