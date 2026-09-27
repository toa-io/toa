# Reading a set

An operation of scope `stream` is handed the entries its query selects as a `Readable`, and reads
them as the storage finds them. Nothing holds the set whole, so a set of any size is read at the
cost of the entry being read.

A reader that keeps a copy of the set reads it once, and from then on only what changed in it: a
stream ends with a **token**, and a read that starts from the token answers what happened after it.

```yaml
# manifest.toa.yaml
exposition:
  /todos:
    GET:
      endpoint: stream
      io:output: [id, title, VERSION]
      query:
        criteria: owner==${auth}
        limit: { value: 100, range: [1, 1000] }
```

```http
GET /todos/?limit=100              the first 100 entries, then {"token":"T1"}
GET /todos/?token=T1&limit=100     the next 100, while pages come back full
GET /todos/?token=T9&limit=100     later: what changed since T9, then a new token
```

## Parts

A stream yields parts, one of three:

```
{ "entry": { "id": "a1", "title": "milk", "VERSION": 4 } }
{ "removed": "a2" }
{ "token": "eyJ2IjoxLCJwIjoi..." }
```

- **`entry`** is an entry of the set: one it has, or one that changed in it.
- **`removed`** is the id of an entry that left the set: it was deleted, or it stopped matching the
  criteria. Drop it from the copy.
- **`token`** is the last part of a complete stream, and the only one without an entry.

An operation of scope `stream` is handed the parts and answers what it makes of them. The prototype
`stream` answers them as they are:

```javascript
// operations/export.js
export async function* effect(input, stream) {
  for await (const part of stream) if (part.entry !== undefined) yield toRow(part.entry)
}
```

## The token

A token is what a reader holds: ask again with it, and the answer is what is left to read.

- **While the set is being read**, that is the rest of the set. A page that comes back with `limit`
  entries ends with a token that continues it; a page that comes back short has reached the end of
  the set.
- **Once the set has been read**, that is what changed in it since the token, and a new token.

**A reader keeps the higher `VERSION`.** An entry may arrive twice — once in a page and once as a
change — and a reader holding a version keeps the later one.

**A stream that ends without a token was cut.** `FIN` ends a stream that failed as well as one that
completed, so the token is what says a stream is whole. Ask again with the token that was held:
nothing read before it is lost.

**A token that is refused with `410`** names a point the storage no longer remembers. Drop the copy
and read the set again, without a token.

**A token belongs to its query.** Presented with other criteria it is refused with `400`.

## The query

A stream reads what an `entries` observation reads — `criteria`, `projection` — and the whole of
what the criteria select, a page at a time where `limit` is given. A tombstone is left out, unless
the route declares `deleted: true`: then it is part of the set, and a deletion arrives as the
`entry` with `DELETED` set.

**Order.** Pages come ordered by `id`, and changes in the order they happened. `sort` is refused
beside `token` or `limit`; sort what the copy holds.

## What a token requires

A token is issued where the storage remembers the order its writes committed in:

- **MongoDB running as a replica set**, which it is wherever there is an outbox.
- **A collection that keeps images** of what an entry was before each change. They cost a copy of
  every changed entry for as long as MongoDB keeps its history, so a collection keeps them only by a
  [migration](/documentation/component/declaration.md#migrations):

  ```yaml
  # migrations/0003-images.yaml
  - images: true
  ```

Anywhere else a complete stream ends with `{ "token": null }` — the set is whole, and there is
nothing to continue from — and a read with a token is refused with `410`.

**How long a token lasts** is how long MongoDB keeps its history: the oplog window of the replica
set.

## Over HTTP

A client is answered a multipart reply, a part per part, between `ACK` and `FIN`. See the
[protocol](/extensions/exposition/documentation/protocol.md#multipart-types) and
[query](/extensions/exposition/documentation/query.md#token).
