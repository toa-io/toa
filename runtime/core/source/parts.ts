import type { Record } from './types/storages.ts'

/** What marks a part a storage made, in every copy of this package: see `Encoded.is`. */
const KEY = Symbol.for('toa.core.part')

/**
 * What a stream yields: an entry of the collection, the id of one that left it, or — last — the token
 * the next read starts from. `null` where the storage keeps no history to continue from.
 */
export type Part = { entry: Record } | { removed: string } | { token: string | null }

export function entry(value: Record): Part {
  return mark({ entry: value })
}

export function removed(id: string): Part {
  return mark({ removed: id })
}

export function token(value: string | null): Part {
  return mark({ token: value })
}

/**
 * Whether a value is a part a storage made, whichever copy of this package made it. An object an
 * operation built in the shape of one is its own output, and is answered as any object is.
 */
export function is(value: unknown): value is Part {
  return typeof value === 'object' && value !== null && KEY in value
}

// not enumerable, so that encoding a part writes what it holds and nothing else
function mark(part: Part): Part {
  return Object.defineProperty(part, KEY, { value: true })
}
