# ClickHouse

Queries are ClickHouse SQL, one statement, without `FORMAT`.

- Read `events`, `states` and `encounters` with `FINAL`: a row delivered twice is two until
  ClickHouse merges them. The views of what is declared read with `FINAL` themselves.
- `payload` is a `JSON` column. A path is `payload.total`, `payload.shipping.country`; its type is
  whatever was written, so cast it: `payload.total::Int64`, `toString(payload.path)`.
  `JSONAllPaths(payload)` lists the paths of a row, `JSONAllPathsWithTypes(payload)` with types.
- In a view, a declared object is a named `Tuple`, read as `shipping.country`, and an array of
  objects is an `Array(Tuple(...))`, read with `ARRAY JOIN items AS item` and `item.sku`. Every
  declared field is `Nullable`, and `NULL` where a row's value was not of its type: `sum`, `avg`
  and `count(field)` skip `NULL`, `arraySum` refuses a `Nullable` array — use `ARRAY JOIN` instead.
- `time` and `received` are `DateTime64(3, 'UTC')`: `toDate(time)`, `toStartOfHour(time)`,
  `time >= now() - INTERVAL 7 DAY`.
- A query runs at most 30 seconds and answers at most 10000 rows and 64 MiB; past the rows it is
  `truncated`. Aggregate rather than read rows.
- A view with `refresh` is computed on that cycle: `refreshed` says when it last was.
