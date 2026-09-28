# A stream ends with a token

## Design concept

A client that keeps a copy of a collection — every entry a route's criteria select — reads the collection once and
from then on only what changed in it. The `stream` scope answers both: a read of the collection, and a read
of its changes, each ending with a **token** that the next read starts from.

A token is a position in the storage's own history of committed writes. The storage forms it, and
nothing else knows the order writes committed in: a clock read by the process that made a write
says when the write was made, and a write made earlier commits later often enough. MongoDB keeps
that history for every write to a replica set, in the order the writes committed, transactions and
writes converged from another region included, and reads it from any position in it.

A stream yields **parts**:

```
{ "entry": { "id": "a1", "title": "milk", "VERSION": 4 } }
{ "removed": "a2" }
{ "token": "eyJ2IjoxLCJwIjoi..." }
```

- `entry` is an entry of the collection: one it has, or one that changed in it.
- `removed` is the id of an entry that left the collection: it was deleted, or it stopped matching the
  criteria.
- `token` is the last part, and the only one that carries neither.

A read without a token takes the position first, and reads the collection after. Everything committed
before the position is in what the read finds; everything committed after it is in the next read.
An entry committed in between is found by both, and the reader keeps the version it holds or the
later one, as it does with every entry.

A read with a token answers the writes committed after its position that touch the collection, in the
order they committed, then a new token.

`limit` splits either read into windows. A window that comes back full ends with a token that continues
the same read; a window that comes back short has reached the end. So one token means one thing to a
reader — what it has read so far — and asking again with it answers what is left to read: the rest
of the collection while the first read is still reading in windows, the changes once the collection has been read.

A stream that ends with a token is complete. One that ends without it — `FIN` with no token before
it — was cut, and the reader asks again with the token it had.

### Guarantees

**Reading the collection**

1. A reader that has read up to a token holds every entry of the collection as committed up to that
   position.
2. An entry may arrive twice, and arrives with the version it had when it was read. A reader keeps
   the higher `VERSION`.
3. The last part of a complete stream is `{ token }`. A stream that ends without one was cut, and
   what was read before is kept: asking again with the token that was held loses nothing.
4. A window is ordered by `id`, or by `CREATED` and `id`, which never change, so a window boundary stays
   where it is while entries change. An entry created behind the boundary during reading in windows arrives
   with the changes, because it committed after the position the read took first.
5. Every window is read from a member that holds the position, whichever member of the replica set
   serves it.
6. An `entry` is restricted by `io:output` as any object of a reply is *(today)*.

**Reading the changes**

7. A write arrives once it is committed, in the order writes committed. That holds for a
   transaction that committed after a later write began, for a write converged from another region,
   and for a write a primary made before it stepped down.
8. An entry that leaves the collection arrives as `removed`: one deleted — by `terminate`, or taken out of
   the collection — and one that stopped matching the criteria.
9. A change to an entry outside the collection sends nothing: a reader learns only ids it can read.
10. A route that declares `deleted: true` has its tombstones in the collection, and a deletion arrives as
    the `entry` with `DELETED` set.

**What is refused**

11. A token the storage cannot continue from is answered `410` before any part: one older than the
    history the storage keeps, one of a format the storage no longer reads, and one presented where
    the collection keeps no record of what an entry was before a change. The reader drops its copy
    and reads the collection again.
12. A token presented with criteria other than those it was issued for is answered `400`.
13. `sort` beside `token` or `limit` takes `id` and `CREATED` alone: a window is ordered by what never
    changes, and changes by when they committed.

**What is not promised**

- How long a token lasts. It lasts as long as the storage keeps the history it names — the oplog
  window of the replica set.
- A token of changes from a storage that keeps no history. On a standalone MongoDB and over a
  collection that keeps no images a window still ends with a token that continues the collection, and a
  complete stream ends with `{ "token": null }`: the read is complete, and there is nothing to
  continue from.
- An order of the collection. A reader that wants one sorts what it holds.

### What a component author does differently

A route that answers a collection to be kept in sync:

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

A migration that keeps what an entry was before each change, which is what tells `removed` from a
change outside the collection:

```yaml
# migrations/0003-images.yaml
- images: true
```

A client reads:

```http
GET /pots/green/?limit=100            100 entries, then {"token":"T1"}
GET /pots/green/?token=T1&limit=100   the next 100, then {"token":"T2"}
GET /pots/green/?token=T2&limit=100   42 entries: a short window, the collection is read, then {"token":"T3"}

GET /pots/green/?token=T3&limit=100   later: what changed since, then {"token":"T4"}
```

An operation of scope `stream` is handed the parts, and answers what it makes of them:

```javascript
export const observation = (_, stream) => stream
```

## The changes, by area

| #   | Change                                                              | Effort                                                    | Risk   | Stage |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------- | ------ | ----- |
| 1   | A storage's `stream` yields parts                                   | the storage interface, `State.stream`                     | low    | 1     |
| 2   | The MongoDB storage reads a position, windows and changes             | a module of about 250 lines beside `storage.js`           | high   | 1     |
| 3   | A migration step keeps images                                       | one step in `migrations.js`                                | low    | 1     |
| 4   | The request contract admits `token`, and `limit` on a stream        | `contract/request.ts`, the query schema                   | low    | 1     |
| 5   | The gateway reads `token`, admits `limit` on a stream, answers `410` | `Query.ts`, the querystring schema, `exceptions.ts`       | medium | 2     |
| 6   | Documentation                                                       | `documentation/collections.md`, `query.md`, the status list      | low    | 1     |

### 1. A storage's `stream` yields parts

`Storage.stream(query)` yields `{ entry } | { removed } | { token }`, and `query` carries `token` and
`limit`. `State.stream` hands the storage the query as it does today.

### 2. The MongoDB storage

- **The position** is the `postBatchResumeToken` of a change stream opened with a batch of none and
  closed at once. The pipeline is the read's own, so the position is the collection's.
- **A window** is a `find` ordered by `_id`, after the last `_id` of the window before, with
  `readConcern: majority` and `afterClusterTime` of the position. A member behind the position waits
  until it has replicated it, and answers then.
- **Changes** are a change stream opened `startAfter` the token, with `fullDocument: required` and
  `fullDocumentBeforeChange: required`, matched on the read's criteria against either image. It is
  read until a batch comes back empty or `limit` parts are read. A change whose after-image matches
  is an `entry`; one whose before-image alone matches is `removed`; a deletion is `removed`.
- **The token** is `base64url(JSON.stringify({ v, p, id?, h }))`: the format version, the position
  as MongoDB wrote it, the last `_id` while the collection is read in windows, and a hash of the translated criteria.
- **Whether a collection keeps images** the storage reads when it connects. Where it keeps none, or
  MongoDB runs standalone, a window token carries no position, a complete read ends with
  `{ token: null }`, and a token that carries a position is answered as one the storage cannot
  continue from.
- `ChangeStreamHistoryLost`, a missing image, and a token of another version are a new core
  exception, `StateHistory`.

### 3. The `images` migration step

`- images: true` enables `changeStreamPreAndPostImages` on the collection, and `false` disables it.
Images are a copy of every changed record, kept for the length of the oplog, so a collection keeps
them where a route reads its changes.

### 4. The request contract

`query.token` is admitted where the scope is `stream`, and so is `query.limit`, which a stream may
leave out. `sort` beside either is refused as a request contract exception.

### 5. The gateway

- The querystring admits `token`.
- A stream route admits `limit` and `omit` stays refused: `paged` is true for a stream.
- `StateHistory` is answered `410 Gone`, which joins the status list of the exposition UI.

### 6. Documentation

- `documentation/collections.md`: reading a collection and its changes — the parts, the token, the guarantees, the
  requirements.
- `extensions/exposition/documentation/query.md`: `token`, and `limit` on a stream.
- `extensions/exposition/ui/src/docs/status.md`: `410`.
- A migration note: every `stream` yields parts.

## Decisions

**One token.** A token says what a reader holds. Reading the collection in windows and reading its changes are the same
question — what is left to read — so a second token would give a reader a choice it never makes: a
change token taken while reading in windows skips the rest of the collection, and a window token once the collection is read
is the change token.

**The token is the last part.** Its presence is what tells a complete stream from a cut one. `FIN`
ends a stream that failed as well as one that completed (#1183), and a part the storage writes
after the collection is the one signal a proxy cannot fake.

**Windows are ordered by `id`.** An `id` never changes, so an entry is on one side of a window boundary
for the whole read. An order by a property that changes can move an entry from the unread part to
the read part mid-read.

**The position comes first.** A position taken before the read makes every write either found by the
read or answered by the next one; a position taken after it leaves the writes committed during the
read to neither.

**Windows ordered by what never changes.** `CREATED` never changes either, so a window may be ordered
by it — `id` after it, where entries share a time — in either direction, and a token holds the last
pair. An order by a property that changes stays refused beside `limit` and `token`. The token's hash
covers the order as well as the criteria.

**`stop`: the first window, then changes.** A read with `stop` ends its first window with the position
the read took first, where the rest of the collection would have been. What changed after it —
deeper entries included — arrives with the changes; ordered by `CREATED`, an entry older than the
window's last one is one of those deeper entries.

**Images tell `removed`.** A change is matched against the criteria before and after it. Without the
image before, a change that moves an entry out of the collection is indistinguishable from a change to an
entry that was never in it, and sending `removed` for both would hand a reader the ids of entries it
cannot read.

**Unsigned.** The route's criteria apply on the server to every read, whatever a token says, so a
forged token reaches only what its bearer can read.

**`410` for every token that cannot be continued.** The reader does one thing about all of them —
reads the collection again — so they share a status.

## Context

- #1183 made a multipart reply that fails end with `FIN`, because a body cut short reached the
  browser through a proxy as a protocol error.
- `io:output` restricts a stream since the change before this one.
- The scopes were renamed `entry` and `entries` in the change before that.

## What happens today

A `stream` is a live cursor over the collection. It yields entries, has no `limit`, and ends the
same way whether it completed or failed. A reader that keeps a copy reads the whole collection again to
learn what changed.

## Stages

1. The storage, the contract, the migration step and the documentation.
2. The gateway.

## Verification

Features against the replica set:

1. **A late commit.** A transaction is held open, a later write commits, and a read takes a token
   between them. The next read answers both.
2. **A converged write** arrives in the next read.
3. **Leaving the collection.** A reassignment, a `terminate` and a `deleteOne` each arrive as `removed`, and
   a change to another owner's entry sends nothing.
4. **A cut stream.** The component stops mid-stream. The stream ends without a token, and asking
   again with the token that was held completes the collection.
5. **Windows.** Windows with `limit` yield every entry, each once or twice with the same `VERSION`,
   while writes run.
6. **Refusals.** A token past the oplog is answered `410` before any part; a token under other
   criteria `400`; `sort` beside `token` `400`.
7. **Without history.** A standalone MongoDB and a collection without images read the collection in windows, and end
   it with `{ token: null }`.

## Compatibility

- **In behaviour.** Every `stream` yields parts. An operation that transforms a stream reads
  `part.entry`, and a client reads the parts.
- **On the wire.** The multipart framing is unchanged: `ACK`, the parts, `FIN`.
- **In types.** `Storage.stream` answers a `Readable` of parts.
