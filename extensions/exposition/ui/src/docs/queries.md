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

A resource MAY constrain the set, and refuse further `criteria` or
`sort`.
