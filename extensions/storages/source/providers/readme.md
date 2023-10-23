# Developing a provider

1. Add an implementaion of the [Provider](../Provider.ts) interface under this directory.
2. Add an entry to the provider map in [`index.ts`](./index.ts).
3. Add a suite to the `suites` object in [`util.ts`](../.test/util.ts).
4. Run `$ npm test` in the [`storages` directory](../..).

Provider's constructor must have the following signature: `constructor(url: URL)`
