# Collection queries

Resources that represent collections have a uniform interface for
filtering and selection.

```http
GET /pots/?criteria=volume<300&sort=volume:desc&limit=10
```

`criteria` is an [RSQL](https://github.com/jirutka/rsql-parser) expression.
Each term names a property of the entity whose collection this resource
represents, or a property inside an object by the path to it:
`size.volume>2`.

An unquoted `null` or `undefined` is no value: `rank==null` matches what
holds no `rank`, and `rank!=null` what holds one. Quote it to mean the
text: `title=="null"`.

`sort` lists sort criteria, separated by `;`. Each is an entity property,
or the path to one, with an optional `:asc` or `:desc` suffix.

`omit` skips that many. `limit` caps how many come back.

`search` is a text query, where the resource takes one.

A resource MAY constrain the collection it exposes, disallow
additional `criteria` or `sort`, and bound `omit` and `limit`.


## Streams

Resources that respond with a stream yield `{"entry":…}` and
`{"removed":"<id>"}` parts, and end with `{"token":…}`. A stream that ends
without a token was cut: send the same request again, with the token it
carried.

```http
GET /pots/stream/?limit=100&token=eyJ2Ijox...
```

The last token continues the read: the rest of the collection, then
what changed. With `stop`, the first `limit` entries are followed straight
by what changed.

`sort` beside `limit` or `token` takes `id` and `CREATED` only. `omit` is
refused.
