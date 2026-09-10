import * as uuid from 'uuid'

export function newid(): string {
  const buf = Buffer.alloc(16)

  uuid.v7(undefined, buf)

  return buf.toString('hex')
}

/**
 * An id that is a function of what it is made of, in the shape `newid` produces, so that an `_id`
 * is one kind of thing wherever it came from.
 *
 * What it is for is a call whose identity must be the same on every run that makes it: the same
 * duplicate then produces the same identity, and whatever it reaches refuses its own copy. A
 * name-based uuid is exactly that function, and `uuid` is here already.
 */
export function derive(...parts: Array<string | number>): string {
  const buf = Buffer.alloc(16)

  uuid.v5(name(parts), NAMESPACE, buf)

  return buf.toString('hex')
}

/**
 * Each part behind its own length, so that no two different sets of parts read as one name
 * whatever a part happens to contain — a separator alone would have `a` and `b:c` name what
 * `a:b` and `c` do, and this decides whether two calls are one call.
 */
function name(parts: Array<string | number>): string {
  let name = ''

  for (const part of parts) {
    const value = String(part)

    name += value.length + ':' + value
  }

  return name
}

/** Toa's own, so that a name derived here collides with nothing derived elsewhere. */
const NAMESPACE = '26bd9bc6-675c-4465-9b42-9e008b20befe'
