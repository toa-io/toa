# Toa Operations

## Context

### Container Registry

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
