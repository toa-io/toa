# A set is bounded, and a page of it is ordered

## Design concept

Every operation over `entries` reads its set the way an observation does: the query takes `limit`
and `omit`, and has to say how large the set may be. A query that skips entries has to say in what
order.

### Guarantees

**The size of a set**

1. An observation over `entries` takes `limit` and `omit`. _(today)_
2. A transition and an effect over `entries` take them too.
3. A query over `entries` names its set by `ids`, or bounds it by `limit`. One that does neither is
   refused with `RequestContractException`, whatever the type of the operation.
4. A `limit` is at least one: zero is refused, where a storage would read it as no limit.
5. A transition over `entries` commits the entries its query selected, and no other: a `limit` of
   two changes two.

**The order of a page**

6. A query that carries `omit` carries `sort`, or is refused with `RequestContractException`.

**Over HTTP**

7. A route to any operation over `entries` is paged: it takes `omit` and `limit` within the ranges
   it declares, and calls with its default `limit` where a request has none.
8. A request with `omit` to a route that neither declares nor receives a `sort` is answered `400`.

**What is not promised**

9. A `limit` without `sort` selects any entries the criteria match, not the same ones twice.
10. An assignment has no set: its changeset is written to whatever its query matches, unbounded.

### What a component author does differently

Bounds every set a transition or an effect reads:

```javascript
await context.local.expire({ query: { criteria: 'due<1700000000000', limit: 256 } })
```

and orders what is paged:

```javascript
await context.local.enumerate({ query: { sort: ['title:asc'], omit: 20, limit: 10 } })
```

A set named by `ids` needs no `limit`.

## The changes, by area

1. **Request contract** (`runtime/core`). The query of an operation whose scope is `entries` keeps
   `omit` and `limit`, requires `limit` or `ids`, and requires `sort` beside `omit`.
2. **Exposition** (`definitions`). A method is `paged` where its operation's scope is `entries`.
3. **Continuity.** The journal pages what a run has kept in the order of `id`.
4. **Documentation.** `documentation/design.md`, the exposition's `query.md`, and the note for the
   version this breaks.

## Decisions

1. **By scope, not by type.** The three types acquire a set with the same read, so what a query may
   say about it is the same.
2. **Required, not admitted.** A set is loaded whole, and a transition commits it in one
   transaction. An unbounded one works until the collection grows, so the runtime refuses it where
   it is written rather than where it fails.
3. **`ids` is a bound.** The caller has listed the set, and a `limit` beside the list says nothing
   more. This relaxes what an observation required.
4. **`omit` requires `sort`, `limit` does not.** Skipping is paging, and pages of an unordered set
   repeat and miss entries. "Any ten" is a question with an answer.
5. **Refused by the contract over HTTP.** A route that pages without an order is a mistake in its
   declaration; a default order would hide it.

## What happens today

`omit` and `limit` are admitted on an observation over `entries` alone, where `limit` is required
even beside `ids`. A transition or an effect over `entries` is refused a `limit`, and reads all its
criteria match. `omit` is taken without `sort`, and the pages come in whatever order the storage
reads.

## Verification

1. A transition over `entries` called with `criteria` and a `limit` of one changes one entry.
2. A transition over `entries` called with `criteria` and no `limit` is refused.
3. A transition over `entries` called with `ids` and no `limit` changes them all.
4. An effect over `entries` called with a `limit` reads that many, and is refused without one.
5. An observation over `entries` called with `ids` and no `limit` answers them.
6. An observation called with `omit` and no `sort` is refused; with `sort` it skips.
7. A route to a transition over `entries` calls it with the route's default `limit`.
8. A route that declares no `sort` answers `400` to a request with `omit`.

## Compatibility

- **Behaviour.** A call to a transition or an effect over `entries` without `limit` or `ids` is
  refused. A call with `omit` and no `sort` is refused. A `limit` of zero is refused.
- **HTTP.** A route to a transition or an effect over `entries` reads its default `limit` of
  entries, ten unless declared, where it read every match.
