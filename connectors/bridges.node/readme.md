# Node.js Bridge

> A component may be written as an ES module or a CommonJS one. A component that is a module
> states so in a `package.json` beside its manifest, or names its files `.mjs`.

> A module may be written in JavaScript or in [TypeScript](#typescript). Node reads a `.ts` as it
> is, so a component runs from what it was written as.

## Algorithm Definition

Operation's algorithms are defined as modules under the `operations` directory in the component
root. An algorithm module must export one function, which is an Algorithm Function, Class or
Factory. Module file name without extension is an operation name (endpoint).

### Function

```javascript
// operations/create.js

export function transition(input, object, context) {
  // ...

  return { foo: 'bar' }
}
```

Exported function's name defines operation `type` property, thus must be one of:
`transition`, `observation`, or `assignment`. Second (state) argument name must be `object`,
`objects`, or `changeset` as it defines operation's `scope`.

Following function signature defines operation of `observation` type with `objects` scope.

```javascript
// operations/set.js

export function observation(input, objects) {
  // ...
}
```

See [Operation properties](#).

### Class

#### Example

```javascript
// operations/transit.js

export class Transition {
  #context

  async mount(context) {
    this.#context = context
  }

  execute(input, object) {
    // ...

    return { foo: 'bar' }
  }
}
```

Exported class name must be one of: `Transition`, `Observation`, or `Assignment`, as it defines
operation's `type`. Class must implement [Algorithm interface](./types/operations.d.ts).
Second (state) argument name of the `execute` method must be `object`, `objects`, or `changeset` as
it defines operation's `scope`.

### Factory

```javascript
export class ObjectTransitionFactory {
  async create() {
    // ...
  }
}
```

Exported class name must follow the pattern: `{Subject}{Type}Factory`, where `Subject` and `Type`
defines operation's `scope` and `type` respectively. Class must
implement [Algorithm Factory interface](#).

> Factory class name examples: `ObjectTransitionFactory`, `ObjectsObservationFactory`,
> `ChangesetAssignmentFactory`.

### Storing Context

> Algorithm definition should store reference to the `context` object without copying its value
> type variables as they may change over operation lifetime.

## Run Commands

Modules in the `rc` directory of the component root run once per component lifetime, outside any
operation. A module must export at least one of three phases, and may export several.

```javascript
// rc/providers.js

export async function preflight(context) {
  context.state.providers = await connect(context)
}

export async function dispose(context) {
  await release(context.state.providers)
}
```

| Phase       | When                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| `preflight` | on connection, before operations are served                                     |
| `settle`    | on connection, once the component can call its own operations (`context.local`) |
| `dispose`   | on disconnection, after the component has stopped serving                       |

`dispose` is the counterpart of `preflight`: what a component opened there is released here. It runs
before the context it is given is disconnected, so a component can still reach its remotes while
releasing — but nothing calls it into the component any more, so it must not expect its own
operations to answer.

Anything a component leaves open holds the process: a `toa compose` exits when the last handle is
released, and a feature suite that boots a composition in its own process does the same. Background
work a component starts and does not await — a stream it drives, a client it keeps — belongs in
`dispose`.

## What is read without running

A manifest says what an operation is — its `type`, its `scope` — and the bridge supplies what the
manifest leaves out by reading the module's source: the exported name is the type, the second
parameter's name is the scope, a class named after a type says the same through its `execute`,
and a `…Factory` class says both in its name. Nothing is imported to read it, so a component is
read where its dependencies are not installed — by `toa deploy`, by `toa types` — and a booting
process reads it the same way.

What is read is what is written. A name is read from `export function`, `export class`,
`export const`, `export { meter as computation }`, `export default function transition`, and
from `module.exports = { … }`, `exports.name = …` in a CommonJS module. A value that is computed
rather than written says its type by its name and nothing more:

```javascript
// operations/create.js

export const transition = withRetries(async (input, object) => {
  // ...
})
```

The parameters of what `withRetries` returns are not in this file, so the manifest declares the
scope:

```yaml
# manifest.toa.yaml

operations:
  create:
    scope: object
```

A `computation` and an `unmanaged` have no scope to declare, and an `effect` defaults to none.

## TypeScript

An operation, an event, a receiver, a guard or a run command may be a `.ts`. Node erases the types
and compiles nothing else, so there is no build step, no output directory and no loader — the file
beside the manifest is the file that runs.

```typescript
// operations/create.ts

import type { Context, CreateInput } from '../types/index.d.ts'

export function transition(input: CreateInput, object: Entity, context: Context) {
  // ...

  return { foo: 'bar' }
}
```

The name a module exports still says what it is, and the second parameter still says the scope;
both are read through the annotations. What Node refuses to erase — an enum, a namespace, a
parameter property — is refused when the module is loaded to run, not when it is read.

### A relative import carries the extension of the file that exists

Node rewrites no specifier. What is imported is what is on disk:

```typescript
import { credentials } from './lib/credentials.js'
```

```typescript
import { credentials } from './lib/credentials.ts'
```

This is the opposite of the rule for a package that is transpiled, where an import names the file
the compiler will emit.

### A type is imported with `import type`

Node keeps an import that is not marked as one, and then resolves it at runtime — so
`import { type Context }` leaves an import behind and fails on a module that only ever had types.
`import type` is erased whole, which is also what keeps a component's own types off its runtime
graph: nothing under `@toa.io/*` is loaded by a component.

```typescript
import { type Context } from '../types/index.d.ts'
```

```typescript
import type { Context } from '../types/index.d.ts'
```

`toa types` writes those types: `types/toa.d.ts` from the manifest, rewritten every run, and
`types/index.d.ts`, written once and left alone, which is where what no manifest states belongs.

### The syntax has to be erasable

An `enum`, a `namespace` and a parameter property are not annotations — they emit code, and Node
refuses them:

```
operations/create.ts: TypeScript enum is not supported in strip-only mode. Types are erased,
never compiled, so a component is written in erasable syntax only — no enum, no namespace, no
parameter property.
```

A component that is typechecked can be told to refuse them first, which is what these three
options are for — one per rule above:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "esnext",
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true
  },
  "include": ["operations", "events", "receivers", "guards", "rc", "types"]
}
```

### One name is one module

A directory the bridge reads is a namespace, and the file name is the endpoint. Two files that
resolve to one name are refused rather than ranked:

```
Component at '/app/components/orders' has more than one operations/create: create.js and create.ts
```

A file in `operations` is an operation, so shared code lives somewhere the bridge does not read —
a `lib` beside them, not among them.

`migrations` is not one of those directories: it holds what a component's storage is to make of
its structure, read by the runtime rather than by a bridge, and written as YAML or JSON. See
[Migrations](/documentation/component/declaration.md#migrations).

### What a package ships is transpiled

Node does not erase types under `node_modules`. A component an application writes is read from
where the application put it, and may be TypeScript; a component a package ships is read from
inside the installed package, and is transpiled before it is published.
