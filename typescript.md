# TypeScript migration

Starting form version `0.20` new features are implemented using TypeScript.

To create a new package or migrate an existing one to TypeScript, follow these steps:

- Add `tsconfig.json` with the following contents:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./transpiled"
  },
  "include": [
    "source"
  ],
  "exclude": [
    "**/*.test.ts"
  ]
}
```

> `extends` must be the path to the `tsconfig.json` file in the project root.

- Upsert these lines to the `package.json`:

```
  "main": "transpiled/index.js",
  "types": "transpiled/index.d.ts",
  "scripts": {
    "transpile": "tsc"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
```

## Cucumber with ts-flow

If the package is using `cucumber`, add the following `cucumber.js` to the package root:

```javascript
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['./features/**/*.ts'],
    publishQuiet: true,
    failFast: true
  }
}
```

and the following `tsconfig.json` to the `features/steps` directory:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "outDir": "/dev/null",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
