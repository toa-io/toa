# Toa Operations

## Context

### Container Registry

#### Build Options

```yaml
registry:
  build:
    arguments: [NPM_TOKEN]
    run: |
      echo //npm.pkg.github.com/:_authToken=${NPM_TOKEN} > .npmrc
```
