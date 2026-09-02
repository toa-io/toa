# Developing a provider

1. Add an implementation of the [Provider](../Provider.ts) interface under this directory.
2. Add an entry to the provider map in [`index.ts`](./index.ts).
3. Add a variant to [`Declaration.ts`](./Declaration.ts).
4. Add a schema to [`schemas`](../../schemas), reference it from `annotation.cos.yaml`, and export it
   from [`schemas.ts`](../schemas.ts).
5. Add a suite to `suites` in [`util.ts`](../test/util.ts).
6. Run `$ npm test` in the [`storages` directory](../..).

Provider's constructor must have the following signature:
`constructor(options: Options, secrets?: Secrets)`

## Secrets

Provider class may have a static `SECRETS` property of type `readonly Secret[]` that lists the
secrets it requires. An entry with `optional: true` may be absent.
The secrets are passed to the constructor as the second argument.

See [`Test` provider](./Test.ts) for an example.

## Testing against a live service

The `s3`, `spaces` and `cloudinary` suites are skipped unless their `RUN_*` variable is set.
Copy [`.env.example`](../test/.env.example) to `.env` and fill it in.

`s3` runs against localstack: `docker compose up localstack` in the [root](../../../../).
