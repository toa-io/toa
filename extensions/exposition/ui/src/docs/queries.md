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

A stream yields `{"entry":…}` and
`{"removed":"<id>"}` parts, and ends with `{"token":…}`. No token means it
was cut.

```http
GET /pots/?limit=100&token=eyJ2Ijox...
```

The last token continues the read: the rest of the collection, then
what changed. `omit`, and `sort` beside `limit` or `token`, are refused.

`410` means the token has expired: read again without it.
