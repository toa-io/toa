# Developing a provider

1. Add an implementaion of the [Provider](../Provider.ts) interface under this directory.
2. Add an entry to the provider map in [`index.ts`](./index.ts).
3. Add a suite to the `suites` object in [`util.ts`](../.test/util.ts).
4. Run `$ npm test` in the [`storages` directory](../..).
5. (optional) To test S3 provider, add `.env` file into [`.test'](../.test) folder.
6. (optional) To test S3 provider with localstack, run `docker compose up localstack` in [`root`](../../../../)

Provider's constructor must have the following signature:
`constructor(url: URL)`

## Secrets

Provider class may have static `SECRETS` property of type `string[]` that lists the names of the secrets that it
requires.
The secrets are passed to the constructor as the second argument.

`constructor(url: URL, secrets: Record<string, string>)`

See [`Test` provider](./Test.ts) for an example.

## Testing S3 provider

Copy [`.env.example`](../test/.env.example) to `.env`.
