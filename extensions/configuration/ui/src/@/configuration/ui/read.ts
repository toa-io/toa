/**
 * A configuration read as lines: what each value is, and what the things it hold are.
 * The sibling of introspection's `shape.ts` — that one reads a schema, this one reads
 * the value the schema describes.
 *
 * A secret never reaches the page: what is stored in its place is a reference to the
 * variable the component substitutes, and a reference is all there is to show.
 */

/** One line of the value, indented by its depth. */
export interface Line {
  depth: number
  /** The property this line is about; `-` marks an item of a list. */
  key: string
  /** What is written after the key, or null where the line opens onto the lines beneath. */
  value: string | null
  /** Stored as a reference, and shown as one. */
  secret: boolean
}

/**
 * A secret is an uppercase name prefixed with `$`. Mirrors `SECRET_RX` in
 * `extensions/configuration/source/const.ts`; the two must say the same thing.
 */
const SECRET = /^\$([A-Z0-9_]{1,32})$/

/** The marker a list item is written with, in place of a key. */
export const ITEM = '-'

export function read(value: unknown): Line[] {
  const lines: Line[] = []

  add(null, value, 0, lines)

  return lines
}

function add(key: string | null, value: unknown, depth: number, into: Line[]): void {
  const held = open(value)

  // the whole of what is shown needs no line of its own; its children are the shape
  if (key === null) {
    if (held === null) into.push(line(ITEM, value, depth))
    else for (const [name, child] of held) add(name, child, depth, into)

    return
  }

  if (held === null) {
    into.push(line(key, value, depth))

    return
  }

  into.push({ depth, key, value: null, secret: false })

  for (const [name, child] of held) add(name, child, depth + 1, into)
}

/**
 * The pairs a line opens onto, or `null` when the value is written on the line itself.
 * An empty object or list opens onto nothing, so it is written rather than opened.
 */
function open(value: unknown): Array<[string, unknown]> | null {
  if (Array.isArray(value))
    return value.length === 0 ? null : value.map((item) => [ITEM, item])

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)

    return entries.length === 0 ? null : entries
  }

  return null
}

function line(key: string, value: unknown, depth: number): Line {
  const secret = typeof value === 'string' && SECRET.test(value)

  return { depth, key, value: secret ? null : write(value), secret }
}

/** How a value is written: a string as it reads, everything else as JSON says. */
function write(value: unknown): string {
  if (typeof value === 'string') return value

  if (Array.isArray(value)) return '[]'

  if (typeof value === 'object' && value !== null) return '{}'

  return JSON.stringify(value) ?? 'null'
}

/** Whether a value is a secret reference, for anything that asks outside a line. */
export function secret(value: unknown): boolean {
  return typeof value === 'string' && SECRET.test(value)
}
