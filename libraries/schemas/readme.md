# Toa Schema Validator

Takes your [COS](/libraries/concise), transforms it to JSONSchema and feeds it
to [Ajv](https://ajv.js.org).

*Also, slightly transforms validation error objects for no obvious reason.*

## schema(schema: cos): Schema

Factory for [Schema class](./types/schema.d.ts).

### `.fit(value)`

Returns [error](./types/schema.d.ts) if given value doesn't match the schema, `null` otherwise.

## schema(path: string): Schema

Loads schema from a file.

## namespace(schemas: cos[]): Namespace

Factory for [Namespace class](./types/namespace.d.ts).

## namespace(path: string): Namespace

Loads schemas from `.cos.yaml` files within given directory, setting their missing `$id` to the file
relative path and basename and returns `Namespace`.

> "up" schema references (`../`) are not supported.
