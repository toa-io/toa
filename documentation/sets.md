# Reading a set

An operation of scope `stream` is handed the entries its query selects as a `Readable`, and reads
them as the storage finds them. Nothing holds the set whole, so a set of any size is read at the
cost of the entry being read.

```javascript
// operations/export.js
export async function* effect(input, stream) {
  for await (const entry of stream) yield toRow(entry)
}
```

The prototype declares `stream`, an observation that answers the entries as they are:

```yaml
# manifest.toa.yaml
exposition:
  /todos:
    GET:
      endpoint: stream
      io:output: [id, title]
      query:
        criteria: owner==${auth}
```

## The query

A stream reads what an `entries` observation reads — `criteria`, `sort`, `projection` — with no
`limit`: it reads the whole of what the criteria select. A tombstone is left out, unless the route
declares `deleted: true`.

## Over HTTP

A client is answered a multipart reply, a part per entry, between `ACK` and `FIN`. See the
[protocol](/extensions/exposition/documentation/protocol.md#multipart-types).

**A reply that fails ends with `FIN` as well.** What was received is then only the beginning of the
set, and nothing in the reply says so.
