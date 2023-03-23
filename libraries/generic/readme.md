# Toa Generic Tools

Library is for internal use only. Barely documented. If you really need to understand something,
see [tests](test).

# Range

`range(input: string): number[]`

Transforms:

- `1-3` into `[1, 2, 3]`
- `1..3` into `[1, 2, 3]`
- `1-3, 5, 10..12` into `[1, 2, 3, 5, 10, 11, 12]`

# Shards

`shards(input: string): string[]`

Transforms string `amqp://shard{0-2}.domain.com` into array:

```javascript
[
  'amqp://shard0.domain.com',
  'amqp://shard1.domain.com',
  'amqp://shard2.domain.com'
]
```

Uses [`range`](#range).
