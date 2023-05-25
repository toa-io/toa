# Toa Generic Tools

Library is for internal use only. Barely documented. If you really need to understand something,
see [tests](test).

## Range

`range(input: string): number[]`

Transforms:

- `1-3` into `[1, 2, 3]`
- `1..3` into `[1, 2, 3]`
- `1-3, 5, 10..12` into `[1, 2, 3, 5, 10, 11, 12]`

See [tests](test/range.test.js).

## Shards

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

## Entries

`entries(object: object): [key, value][]`

`Object.entries` including Symbols.

## Generate

`generate(generate: function): object`

`generate` function's signature is `(segments: string[], value?: any): any | void`

`segments` are nested property names, used to access the generated object and optional `value` is
passed if property was assigned with a value.

### Example

```javascript
const generator = (segments, [key, value]) => {} // any property is an object
const object = generate(generator)

const _0 = object.a // will call callback with (['a'])
const _1 = object.a.b // (['a', 'b'])

object.a.b.c = 1 // (['a', 'b', 'c'], 1)
```

## Echo

`echo(input: string, variables?: Record<string, string>): string`

Returns the input string.
Substitutes variables to a placeholders following `${NAME}` syntax.
If no variables are passed, then environment variables are used.

### Example

#### Environment variables

```javascript
process.env['FOO'] = 'bar'

const output = echo('foo: ${FOO}')

console.log(output) // foo: bar
```

#### Custom variables

```javascript
const variables = { foo: 'world' }
const output = echo('hello ${foo}', variables)

console.log(output) // hello world
```

### Index substitutions

`echo(input: string, values: string[]): string`

When the second argument is an `Array`, its values are substituted to a placeholders following `{N}` syntax.

```javascript
echo('make {0} not {1}', ['love', 'war'])
```

### Arguments substitution

When the second argument is a `string`, it and next arguments are substituted as an [array](#index-substitutions).

```javascript
echo('make {0} not {1}', 'love', 'war')
```

# Map

`map(object: object, transformation: Function): object`

Traverse through a given plain object replacing its values (or key-value pairs) with a given transformation function.
If the transformation function returns `undefined` then the current key-value pair will remain unchanged.

Transformation function signature is:

`(value: any) => any | void`

or

`(key: string, value: any) => [string, any] | void`

# Plain

`plain(candidate: any): boolean`

Returns `true` if an argument is a POJO, `false` otherwise.
