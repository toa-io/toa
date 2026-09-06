/**
 * A value read the way a schema is: what is in it, line by line, indented by what holds it.
 * Where the shape says what a property may be, this says what it is.
 */
import type { Line } from './shape'

export function read(value: unknown): Line[] {
  const lines: Line[] = []

  add(null, value, 0, lines)

  return lines
}

function add(key: string | null, value: unknown, depth: number, into: Line[]): void {
  if (Array.isArray(value)) {
    list(key, value, depth, into)

    return
  }

  if (typeof value === 'object' && value !== null) {
    object(key, value as Record<string, unknown>, depth, into)

    return
  }

  into.push(line(depth, key, scalar(value)))
}

function list(key: string | null, values: unknown[], depth: number, into: Line[]): void {
  if (values.length === 0) {
    into.push(line(depth, key, '[]'))

    return
  }

  const at = opened(key, depth, into)

  for (const value of values)
    if (typeof value === 'object' && value !== null) {
      into.push(line(at, null, ITEM))
      add(null, value, at + 1, into)
    } else into.push(line(at, null, `${ITEM} ${scalar(value)}`))
}

function object(
  key: string | null,
  value: Record<string, unknown>,
  depth: number,
  into: Line[],
): void {
  const names = Object.keys(value)

  if (names.length === 0) {
    into.push(line(depth, key, '{}'))

    return
  }

  const at = opened(key, depth, into)

  for (const name of names) add(name, value[name], at, into)
}

/**
 * The line what is inside is written under, and the depth it is written at. The whole of a
 * value needs no line of its own: it is everything that is shown.
 */
function opened(key: string | null, depth: number, into: Line[]): number {
  if (key === null) return depth

  into.push(line(depth, key, null))

  return depth + 1
}

function line(depth: number, key: string | null, type: string | null): Line {
  return { depth, key, type, optional: false }
}

/** What a list writes before each of its own. */
const ITEM = '-'

/** As it is, on one line: what it says of itself is what a reader is after, not its syntax. */
function scalar(value: unknown): string {
  if (typeof value !== 'string') return String(value)

  return value === '' ? "''" : value.replace(/\n/g, '\\n')
}
