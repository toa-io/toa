# Collection queries

Resources that represent collections have a uniform interface for
filtering and selection.

```http
GET /pots/?criteria=volume<300&sort=volume:desc&limit=10
```

`criteria` is an [RSQL](https://github.com/jirutka/rsql-parser) expression.
Each term names a property of the entity whose collection this resource
represents.

`sort` lists sort criteria, separated by `;`. Each is an entity property
with an optional `:asc` or `:desc` suffix.

`omit` skips that many. `limit` caps how many come back.

`search` is a text query, where the resource takes one.

A resource MAY constrain the collection it exposes, disallow
additional `criteria` or `sort`, and bound `omit` and `limit`.

## Streams

A resource that answers a collection as a [multipart stream](/.discovery/multipart)
answers parts, and ends a complete stream with a token:

```
{"entry":{"id":"a1","title":"milk","VERSION":4}}
{"removed":"a2"}
{"token":"eyJ2IjoxLCJwIjoi..."}
```

`entry` is an entry of the collection. `removed` is the id of one that left
it: deleted, or no longer matching the criteria. A stream that ends without
a token was cut.

`limit` is the size of a page, and `omit` is refused. A request that carries
the last token received is answered what is left to read: the next page
while the collection is being read, and what changed in it since, once it
has been read.

```http
GET /pots/?limit=100
GET /pots/?limit=100&token=eyJ2IjoxLCJwIjoi...
```

Pages come ordered by `id` and changes in the order they happened, so `sort`
is refused beside `limit` or `token`. A token that is `null` continues
nothing: read the collection again to learn what changed.

A token the server can no longer continue from is answered `410`: read the
collection again, without it. A token presented with other criteria is
answered `400`.
