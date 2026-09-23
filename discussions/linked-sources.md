# Sources behind a link

## Design concept

A component is a directory, and everything it runs from is under it. Code two components share has
nowhere to live: a package of the application is in no registry the image installs from, and what
one component reaches for in another's directory is outside what a build copies.

A symbolic link is the one thing that puts a file in two directories at once without a package, and
it already works where nothing copies: a process composed from a checkout resolves it like any other
path. What does not work is everything a build does with a component — it hashes what it sees and
copies what it sees, and a link is neither.

So a link is read as what it points to: the files under it are the component's own.

### Guarantees

**The version**

1. A component's version is the hash of its files, with a link read as the file it points to — so
   changing linked sources changes the version, and a map that no longer states it refuses the
   composition at boot, as it does for any other source.
2. `files` and `ignore` select linked paths as they select any other: a link stands where it is
   written, and what is under it is under that path.

**The image**

3. An image carries linked sources as files. Nothing in one points out of the component it belongs
   to.
4. A link the build cannot read fails the build, naming the path. An image that carried it would
   be a container that cannot start, and far from what made it so.

**What is unchanged**

5. A component with no link hashes what it hashed before and carries what it carried before.

**Not promised**

6. Nothing keeps two components' links pointing at one directory in step: they are two components,
   each with a version of its own, and each is deployed when its own sources change.
7. A link is followed wherever it points. What it reaches is the build machine's to have — a
   checkout has it, and an image build that runs from a copy of one part of it does not.
8. A link pointing at a directory the component itself is under is not recognised as one: the copy
   follows it into itself until the path is too long, and fails the build there.

### What a component author does differently

Shared sources live once, and each component that runs them links them in:

```
shared/format.js
components/one/shared -> ../../shared
components/two/shared -> ../../shared
```

```javascript
// components/one/operations/transit.js
import { format } from '../shared/format.js'
```

What is linked is source and nothing else: an image installs a component's dependencies from its
own `package.json`, in its own directory, so a dependency of shared code is declared by every
component that links it.

## The changes, by area

1. **`@toa.io/norm`.** The glob that lists a component's files follows links, so what is under one
   is hashed into its version.
2. **`@toa.io/operations`.** The copy that lays a component's sources into an image resolves links,
   so what arrives is files.
3. **Documentation.** What a version is made of (`documentation/contracts.md`), and what the
   sources image holds (`documentation/deployment.md`).

## Decisions

- **A link, not a package.** An image installs each component's dependencies in that component's
  own directory, from the registry it is configured with. A package private to an application is
  in none, so the install fails — and a directory behind a link needs no install at all.
- **The target is hashed, not the link.** A hash of the link's text changes when the path changes
  and not when the code does, which is the opposite of what a version is for.
- **A build that cannot read a link fails.** The alternative is what happens today: the link is
  copied as a link, rewritten to an absolute path of the machine that built it, and the container
  starts without the module.

## What happens today

Neither half of a build sees anything behind a link:

- the file list that makes a version is globbed with `followSymbolicLinks: false`, so a link
  contributes nothing to it, and a change to shared code leaves the version — and the image tag —
  as they were;
- the sources are copied with `fs.cp` and no `dereference`, which copies a link as a link, with its
  target resolved to an absolute path of the build machine.

So shared code is in no version and in no image, and the deploy that should have carried it reports
nothing.

## Verification

- A component's version follows what it links: a map written before a linked file changed no longer
  states the version the composition boots at, and the composition is refused.
- The sources image holds what a component links, as files.

## Compatibility

A component with no link is unaffected: the same files are hashed and the same files are copied. A
component that has one is a component whose sources the build never carried, so there is nothing
deployed that this changes the meaning of.
