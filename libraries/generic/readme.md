# Toa Generic Tools

Library is for internal use only. Barely documented. If you really need to understand something,
see [tests](test).

# Range

`range(input: string): number[]`

Transforms:

- `1-3` into `[1, 2, 3]`
- `1..3` into `[1, 2, 3]`
- `1-3, 5, 10..12` into `[1, 2, 3, 5, 10, 11, 12]`

See [tests](test/range.test.js).

# Shards

`shards(input: string): string[]`

Transforms `amqp://shard{0-2}.domain.com` into:

```javascript
[
  'amqp://shard0.domain.com',
  'amqp://shard1.domain.com',
  'amqp://shard2.domain.com'
]
```

Uses [`range`](#range).

See [tests](test/shards.test.js).

# Entries

`entries(object: object): [key, value][]`

`Object.entries` including Symbols.

# Generate

`generate(generate: function): object`

`generate` function's signature is `(segments: string[], value?: any): any | void`

`segments` are nested property names, used to access the generated object and optional `value` is
passed if property was assigned with a value.

## Example

```javascript
const generator = (segments, [key, value]) => {} // any property is an object
const object = generate(generator)

const _0 = object.a // will call callback with (['a'])
const _1 = object.a.b // (['a', 'b'])

object.a.b.c = 1 // (['a', 'b', 'c'], 1)
```
