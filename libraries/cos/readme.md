# Concise Object Schema

Concise Object Schema (COS) is a human-friendly object schema description language.
See [features](features).

## `expand(cos, validate): JSONSchema`

Expand function accepts COS-object as first argument and returns JSONSchema object.

One of the criteria to expand a node is if this node is a valid JSONSchema already. As validation
itself is out of the scope of this library, `expand`
requires [JSONSchema meta-schema](https://json-schema.org/specification.html#meta-schemas)
validation function conforming [`toa.cos.Validate`](./types/index.d.ts) type as second argument.

> To keep things simple, consider using `expand` of [`@toa.io/schemas`](/libraries/schemas).
