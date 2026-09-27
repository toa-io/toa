# Streaming a collection

An operation of scope `stream` is handed the entries its query selects as a `Readable`, and reads
them as the storage finds them. Nothing holds the collection whole, so a collection of any size is read at the
cost of the entry being read.

A reader that keeps a copy of the collection reads it once, and from then on only what changed in it: a
stream ends with a **token**, and a read that starts from the token answers what happened after it.

```yaml
# manifest.toa.yaml
exposition:
  /:type:
    GET:
      endpoint: stream
      io:output: [id, title, VERSION]
      query:
        criteria: archived==false
        limit: { value: 100, range: [1, 1000] }
```

```http
GET /pots/green/?limit=100            100 entries, then {"token":"T1"}
GET /pots/green/?token=T1&limit=100   the next 100, then {"token":"T2"}
GET /pots/green/?token=T2&limit=100   42 entries: a short page, the collection is read, then {"token":"T3"}

GET /pots/green/?token=T3&limit=100   later: what changed since, then {"token":"T4"}
```

Every response ends with a token, and the next request carries the last one received.

The collection is what the path and the route select together: `GET /pots/green/` reads
`(type=="green");(archived==false)`, and a token it ends with belongs to that collection.

## Parts

A stream yields parts, one of three:

```
{ "entry": { "id": "a1", "title": "milk", "VERSION": 4 } }
{ "removed": "a2" }
{ "token": "eyJ2IjoxLCJwIjoi..." }
```

- **`entry`** is an entry of the collection: one it has, or one that changed in it.
- **`removed`** is the id of an entry that left the collection: it was deleted, or it stopped matching the
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

- **While the collection is being read**, that is the rest of the collection. A page that comes back with `limit`
  entries ends with a token that continues it; a page that comes back short has reached the end of
  the collection.
- **Once the collection has been read**, that is what changed in it since the token, and a new token.

**A reader keeps the higher `VERSION`.** An entry may arrive twice — once in a page and once as a
change — and a reader holding a version keeps the later one.

**A stream that ends without a token was cut.** `FIN` ends a stream that failed as well as one that
completed, so the token is what says a stream is whole. Ask again with the token that was held:
nothing read before it is lost.

**A token that is refused with `410`** names a point the storage no longer remembers. Drop the copy
and read the collection again, without a token.

**A token belongs to its query.** Presented with other criteria it is refused with `400`.

## The query

A stream reads what an `entries` observation reads — `criteria`, `projection` — and the whole of
what the criteria select, a page at a time where `limit` is given. A tombstone is left out, unless
the route declares `deleted: true`: then it is part of the collection, and a deletion arrives as the
`entry` with `DELETED` set.

**Order.** Pages come ordered by `id`, and changes in the order they happened. `sort` is refused
beside `token` or `limit`; sort what the copy holds.

## What a token requires

A token of changes is issued by a storage that remembers the order its writes committed in. What
that takes of a deployment is the storage's to say, in its own documentation.

A storage that remembers no such order still ends a page with a token that continues the collection, and
ends a complete stream with `{ "token": null }`: the collection is whole, and there is nothing to continue
from. What changed in it is learned by reading it again.

**How long a token lasts** is how long the storage keeps that history. A token past it is refused
with `410`.

## Over HTTP

A client is answered a multipart reply, a part per part, between `ACK` and `FIN`. See the
[protocol](/extensions/exposition/documentation/protocol.md#multipart-types) and
[query](/extensions/exposition/documentation/query.md#token).
