# Toa Definitions

What a Toa package declares, read without running it.

A package has two faces. What it **runs** — its `Factory` — is what a process needs. What it
**declares** — how a manifest that names it is normalised, the components it contributes, what a
deployment of it needs, whether its binding is asynchronous, how a bridge reads an operation's type
from its source — is what `toa deploy`, `toa types` and a booting process read alike, and none of it
runs. This package is the second face of every extension and connector Toa ships, so that reading a
declaration loads no broker client, no database driver, no HTTP server, and so that a deploy install
is `@toa.io/operations` beside `@toa.io/cli`, with no extension installed at all.

## What is here

| export        | of                     | read by                                  |
| ------------- | ---------------------- | ---------------------------------------- |
| `manifest`    | an extension           | norm, normalising the `extensions` block |
| `components`  | an extension           | norm, for the components it contributes  |
| `annotation`  | an extension           | norm, normalising the context's block    |
| `standalone`  | an extension           | norm, deploying it whether or not named  |
| `deployment`  | an extension, a connector | operations, rendering the chart       |
| `image`       | an extension           | operations, taking a published image     |
| `context`     | an extension           | `toa types`, what a component's context has |
| `properties`  | a binding              | norm and boot, whether it is asynchronous |
| `define`      | a bridge               | norm, what a component's modules declare |

A package is looked up by the reference a manifest or a context names it by:

```javascript
import { definition } from '@toa.io/definitions'

const exposition = await definition('@toa.io/extensions.exposition')
```

and imported directly where a package of Toa's own needs a constant or a schema it shares with its
declaration:

```javascript
import { PORT, schemas } from '@toa.io/definitions/extensions.exposition'
```

The package's version is the version of Toa: it is versioned with every release, so a context that
states no `runtime.version` is deployed on the runtime of the same number.

## A package outside Toa

norm reads a first-party package from here, and any other from its `definition.js` where it ships
one, or from its entry where it does not. An extension of an application's own that exports its
`manifest` and `deployment` beside its `Factory` is read as it always was; one that ships a
`definition.js` is read without loading what it runs.

## The digest

An extension's own components — the identity components of the exposition, the values component
of the configuration — live in the extension's package, which a deploy install does not have. So
this package carries a digest of them: their manifests as norm reads them, generated when the
workspace transpiles and written to `digest/`, which ships and is not committed. A deploy reads the
components from the digest; the process that runs them reads them from the extension, where their
code is.

The digest is generated from the workspace, after every extension it covers has transpiled, so a
change to a shipped component is in the next `npm run transpile`; a release packs it afresh. The
generator reaches the extensions and norm through the workspace, and does not declare them: each
of them depends on this package, and a cycle is one `lerna version` does not survive.

## Adding an extension's definition

1. Put what the extension declares under `source/<package>/`, named after the package without its
   scope: `extensions.cadence`, `bindings.amqp`. Its `index.ts` exports what norm and operations
   read, and whatever the extension imports back.
2. Name it in `DEFINED` in `source/definition.ts`.
3. Where it contributes components, name it in `DIGESTED` in `source/digest/generate.ts`, and have
   its `components()` read the digest.
4. Nothing here imports the extension. It may depend on `@toa.io/generic`, `@toa.io/schemas` and
   `@toa.io/pointer`; a type of the runtime's is an `import type`.
