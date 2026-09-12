import { createHash } from 'node:crypto'
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
 * name-based uuid is exactly that function: version 5 of RFC 9562, the bytes `uuid.v5` produces,
 * hashed here with the namespace already parsed, since a call derives one on every call it makes.
 */
export function derive(...parts: Array<string | number>): string {
  const hash = createHash('sha1').update(NAMESPACE).update(name(parts), 'utf8').digest()

  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80

  return hash.toString('hex', 0, 16)
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

/**
 * Toa's own, `26bd9bc6-675c-4465-9b42-9e008b20befe`, so that a name derived here collides with
 * nothing derived elsewhere.
 */
const NAMESPACE = Buffer.from('26bd9bc6675c44659b429e008b20befe', 'hex')
