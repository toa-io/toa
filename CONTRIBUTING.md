# Contributing

> Please note that this project is released with a [Contributor Code of Conduct](./CONDUCT.md).
> By participating in this project, you agree to abide by its terms.

## What you'll need

1. Approved [Bug or Feature](https://github.com/toa-io/toa/issues)
2. [Node LTS](https://nodejs.org/)
3. [Docker Desktop](https://www.docker.com/get-started)

To work with [operations](operations):

1. [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installing-with-a-package-manager)
2. [Helm](https://helm.sh/docs/intro/install/#from-homebrew-macos)

## Setup

```shell
$ npm run env
$ npm run ci
$ npm run transpile
$ docker compose up -d
```

If you want to run components using CLI with local environment (from docker-compose),
set `TAO_DEV` environment variable to `1`.

```shell
$ export TOA_DEV=1
```

## Discipline

Please follow the [Cycle](documentation/contributing/cycle.md).

## Code style

Project uses JavaScript and TypeScript [standard style](https://standardjs.com) with
some [additional rules](/.eslintrc.yaml).
Please make sure your IDE respects [`.editorconfig`](/.editorconfig).

## Branching model

Please
follow [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow). Name
feature branches as `feat/feature-name`.

### Versioning

Feature branches **must not** change versions. Version is updated when PR is merged to the `dev`
branch.
