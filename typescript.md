# TypeScript

Starting form version `0.20` new features are implemented using TypeScript.

To create a new package or migrate an existing one to TypeScript, follow these steps:

- Add `tsconfig.json` with the following contents:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./transpiled",
    "rootDir": "./source"
  },
  "include": [
    "source"
  ],
  "exclude": [
    "**/*.test.ts"
  ]
}
```

> `extends` must be the path to the `tsconfig.json` file in the project root. `rootDir` is stated
> because the compiler asks for it.

- Upsert these lines to the `package.json`:

```
  "type": "module",
  "main": "transpiled/index.js",
  "types": "transpiled/index.d.ts",
  "scripts": {
    "transpile": "tsc"
  }
```

- Name the package in the root `workspaces` before anything that builds against it, which is the
  order the workspaces are built in.

Every relative import carries the extension of the file it emits:

```typescript
import { Storage } from './Storage'
```

```typescript
import { Storage } from './Storage.js'
```

## Tests

A test is a `*.test.ts` beside what it tests, written on `node:test` and `node:assert/strict`, and
run from the root with `npm run test:unit`.

```typescript
import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Storage } from './Storage.js'

it('should be', async () => {
  assert.notStrictEqual(Storage, undefined)
})
```

## Cucumber with ts-flow

If the package is using `cucumber`, add the following `cucumber.mjs` to the package root:

```javascript
export default {
  paths: ['features/**/*.feature'],
  import: ['./features/**/*.ts'],
  failFast: true
}
```

> A configuration written as a module exports the profile itself, not a map of profiles.

and this `features` script, which registers the loader before node reads that configuration:

```
  "features": "TSX_TSCONFIG_PATH=features/steps/tsconfig.json NODE_OPTIONS=--import=tsx cucumber-js"
```

and the following `tsconfig.json` to the `features/steps` directory, which is what tells esbuild
the step definitions use the decorators `cucumber-tsflow` is built on:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "noEmit": true,
    "moduleResolution": "nodenext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

`cucumber-tsflow` is CommonJS, and Node cannot see its exports from the outside, so its
decorators come off the default export:

```typescript
import tsflow from 'cucumber-tsflow'

const { binding, given } = tsflow
```
