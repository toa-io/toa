# Nested selectors

## Design concept

A query names a property inside an object by the path to it. `size.volume` is `volume` of the
object `size` holds, in a criteria, in a sort and in a projection, and it is held to what the
entity declares as a top-level name is.

### Guarantees

**What a path names**

1. A path is property names joined by `.`, each naming a property the one before it declares:
   `size.volume` where `size` is an object that declares `volume`.
2. An array is read as what it holds, on the way and at the end of a path: `leaves.grams` is
   `grams` of the objects in `leaves`, and `ranks` is compared as one of its elements.
3. A path that names no declared property is refused with `QuerySyntax`, as a name that is not
   declared is *(today)*. That includes a path into a string, into an object that declares no
   properties, and a name every object carries, such as `constructor`.
4. A name with a dot in it that the entity declares as it is written is that property.

**In a criteria**

5. A value is read as what the property at the end of the path holds, and one that cannot be
   read as that is refused, as it is for a top-level property *(today)*.
6. A comparison on an array is met by any element of it. Two comparisons on one array are met
   by any two elements, and not by one element for both.

**In a sort and in a projection**

7. A sort takes a path wherever it takes a name. A stream takes `id` and `CREATED` beside
   `limit` or `token`, as before *(today)*.
8. A projection that names a path reads that property and nothing else of the object it is in.

**In a storage**

9. An index is declared on a path as on a name: `keys: { size.volume: asc }` *(today)*.

**What is not promised**

10. Nothing selects the element of an array that meets several comparisons at once.
11. A path does not reach into what a schema does not declare by name: `additionalProperties`,
    `patternProperties`, `oneOf`, `anyOf`, a `$ref` left unresolved.
12. A property inside an object that declares `format: date-time` or `epoch-millis` is stored as
    it is written, and compared so.

### What a component author does differently

```yaml
# manifest.toa.yaml
entity:
  properties:
    size:
      type: object
      properties:
        volume: { type: number }

exposition:
  /:
    GET:
      endpoint: enumerate
      query:
        criteria: size.volume>1;
        sort: size.volume:desc
```

```javascript
await context.local.enumerate({ query: { criteria: 'size.volume>2', limit: 10 } })
```

```yaml
# migrations/0001-indexes.yaml
- index:
    name: volume
    keys: { size.volume: asc }
```

## The changes, by area

1. **The query.** `core/source/query/property.ts` finds what an entity declares for a name or a
   path. The criteria, the sort and the projection ask it instead of reading the top level.
2. **The request contract.** An item of `sort` is a name or a path of up to eight names.
3. **Documentation.** The query mapping of the exposition, the migrations of a component, and
   the published pages on queries and migrations.

## Decisions

- **Resolved against the schema, not passed through.** A path the entity does not declare is a
  mistyped filter, and one passed to the storage reads as an empty result.
- **An array is transparent.** The storage compares a value with every element, so the type to
  read a value as is the element's. The alternative, refusing a path through an array, would
  refuse what the storage answers correctly. That makes a value compared with a top-level array
  of numbers a number, where it was text that matched nothing.
- **No element matching.** RSQL has no form for it, and one invented here would be a dialect.
- **`@toa.io/rsql` is unchanged.** A selector is any word, dots included; what a selector means
  is the caller's.
- **A sort and a projection are held as a criteria is.** They read `properties[name]`, which
  admitted `constructor`; they now ask the same question the criteria does.

## What happens today

`size.volume>2` is refused: `Criteria selector 'size.volume' is not defined`. A sort by a path is
refused by the request contract, and a projection of one as not defined.

## Verification

1. Criteria select on a property inside an object.
2. A value is read as what the property inside holds, and one it cannot hold is refused.
3. A path that names no property is refused, in a criteria, a sort and a projection.
4. Criteria select on a property of the objects an array holds, and two comparisons on it are
   met by different objects.
5. A value is read as what an array holds.
6. Entries are ordered by a property inside an object.
7. An observation reads the property inside an object its projection names, and not the rest.
8. A migration indexes a property inside an object.

## Compatibility

A query that was accepted is accepted, with two exceptions. A value compared with an array of
numbers, integers or booleans is read as one, so `ranks==five` is refused where it matched
nothing. A sort or a projection that names what every object carries — `constructor`,
`toString` — is refused where it was passed to the storage.
