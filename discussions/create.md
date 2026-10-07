# `toa create`

## Design concept

An application starts from one command. `toa create <name>` writes, into the directory it is run
in, the least an application is: a Context, two components, the infrastructure a local run
connects to, and a scenario that tests what was written. What it writes runs as it is.

### Guarantees

**What is written**

1. `toa create <name>` writes the template `@toa.io/userland` carries into the working directory,
   naming the application `<name>` wherever the template names one: the Context, the package, the
   registry, the compose project.
2. The packages of Toa are listed at the versions of the Toa that created the application.
3. What is written is complete: after `npm install` and the services of its
   `docker-compose.yaml`, the application starts and its scenarios pass, with no file edited.
   Installing it installs what its declarations require as well.

**Where it is written**

4. The working directory is empty, or holds nothing but `.git`. Anything else in it is refused,
   and nothing is written.
5. A name a Context cannot have is refused, and nothing is written.

**What it needs**

6. Without `@toa.io/userland` installed beside the CLI the command is refused, and says what to
   install.

**What is not promised**

7. Nothing is installed and nothing is started: the command writes files, and says what to run.
8. An application that exists is not updated by running the command again.
9. Nothing of a deployment beyond what a Context requires: no registry that exists, no cluster,
   no CI.

### What a component author does differently

Starts with the command instead of writing the first files by hand:

```shell
$ mkdir store && cd store
$ npx -p @toa.io/cli -p @toa.io/userland toa create store
$ npm install
$ npm run dock
$ npm run env
$ npm run features
```

## The changes, by area

1. **Template** (`userland/template`). The files of the application, with `{{name}}`,
   `{{version}}` and `{{agent}}` where the command writes a value.
2. **Userland** (`userland`). Depends on `@toa.io/agent`, whose version the template lists.
3. **CLI** (`runtime/cli`). The `create` command; `@toa.io/userland` is a peer it may be
   installed without.
4. **Documentation.** The CLI readme, and the readme of userland, which says what the template
   holds.

## Decisions

1. **The template is files, not a generator.** What an application starts from is read by
   whoever starts one, so it is kept as the files themselves, which run and are tested as they
   are. Three values are written into them, by name.
2. **In `@toa.io/userland`, which the CLI does not depend on.** The development kit is where
   what an application is developed with lives, and a process that runs an application has no
   use for it. So it is a peer the command looks for, installed beside the CLI by whoever
   creates an application, and the command says so where it is not there.
3. **The working directory, and no other.** A path to create is one more thing to get wrong, and
   `mkdir` is not what the command saves.
4. **`.git` is not something in the directory.** A repository cloned before its first commit is
   the usual place to start, and the command writes nothing a repository holds.
5. **The versions of the Toa that runs.** A template that named versions would name those of the
   day it was written.
6. **Two components.** One with code and no state, one with state and no code: between them
   every kind of file an application has appears once — a manifest, an operation, an entity, an
   exposition — and neither is more than a reader takes in at a glance.
7. **Conventional ports.** The application is developed on a machine of its own, where `5672`,
   `27017` and `6379` say what they are.
8. **`toa npm` runs after `npm install`, as the package's `postinstall`.** What the declarations
   require is known to Toa and not to npm, and a second command is one a newcomer does not run
   before the gateway fails to start. The command finds nothing to install the second time, so
   the install it starts ends there.

## What happens today

The first files of an application are written by hand, from documentation.

## Verification

1. `toa create store` in an empty directory writes a Context and a package named `store`.
2. The packages of Toa are listed at a version, with nothing left to fill.
3. A directory that holds a file is refused, and nothing is written.
4. A directory that holds `.git` alone is taken.
5. A name a Context cannot have is refused.
6. What is created is read by `toa types`, `toa env` and `toa map`, and both components are in
   the map.
7. What is created composes.
