export function to(entity) {
  const { id, ...rest } = entity

  return /** @type {toa.mongodb.Record} */ { _id: id, ...rest }
}

/**
 * Renamed in the object the driver decoded, which is a new one for every document; an entity
 * copies a state before an operation that writes changes it. A copy costs ten times the rename,
 * and what it would keep is only `id` in front, which a reply does not promise.
 */
export function from(record) {
  if (record === undefined || record === null) return null

  record.id = record._id
  delete record._id

  return record
}

/**
 * How this collection's records are written and read back.
 *
 * A property the entity declares as a moment is held as a BSON date rather than as what the
 * entity carries. It is what the TTL monitor reads — it skips a field that is not a date,
 * silently — and what sorts and compares as a moment rather than as text or as a number that
 * happens to be one. The entity keeps what it declared, so nothing outside this connector
 * learns a type only one storage has.
 *
 * Two ways to say it, because they differ in what userland holds rather than in what is
 * stored: `{ string, date-time }` for an application that carries ISO strings, and
 * `{ integer, epoch-millis }` for one that carries what `Date.now()` answers. The system
 * timestamps of every record are the second.
 *
 * Top-level properties only. One nested inside an object or an array is left as it is, and
 * `norm` refuses it, so that the declaration does not mean two things.
 *
 * A component that declares no moment holds the plain pair, and pays nothing for any of this.
 */
export function codec(properties) {
  /** @type {Array<[string, (value: Date) => unknown]>} */
  const read = []

  for (const [name, schema] of Object.entries(properties ?? {})) {
    const cast = READ[schema?.format]

    if (cast !== undefined && schema.type === TYPES[schema.format]) read.push([name, cast])
  }

  const dates = read.map(([name]) => name)

  if (dates.length === 0) return { to, from, dates }

  return {
    dates,

    // one way in for both: `Date` takes the milliseconds and the ISO string alike
    to: (entity) => convert(to(entity), dates.map((name) => [name, date])),

    from: (record) => {
      const state = from(record)

      return state === null ? null : convert(state, read)
    }
  }
}

/**
 * Writes into an object either `to` or `from` has just made, so nothing the caller holds is
 * touched.
 *
 * @private
 */
function convert(record, casts) {
  for (const [name, cast] of casts) {
    const value = record[name]

    // absent, or the null a property that has not been written to holds
    if (value === undefined || value === null) continue

    record[name] = cast(value)
  }

  return record
}

const date = (value) => new Date(value)

/*
 * What a record written before the property was declared a moment holds is what it was given,
 * and it is answered as it is: a collection is converted by a migration rather than by every
 * read that finds one.
 */
const READ = {
  'date-time': (value) => (value instanceof Date ? value.toISOString() : value),
  'epoch-millis': (value) => (value instanceof Date ? value.getTime() : value)
}

/** What each format is written on, so that one said of the wrong type is not acted on. */
const TYPES = { 'date-time': 'string', 'epoch-millis': 'integer' }
