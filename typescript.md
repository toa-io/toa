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
  ]
}
```

> `extends` must be the path to the `tsconfig.json` file in the project root.

- Upsert these lines to the `package.json`:

```
  "main": "transpiled/index.js",
  "types": "transpiled/index.d.ts",
  "scripts": {
    "prepublishOnly": "npm run transpile",
    "transpile": "tsc"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
```
