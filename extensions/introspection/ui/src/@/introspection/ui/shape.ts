/**
 * A JSON schema read as a shape rather than as a contract: what a value is, and what the
 * things it holds are. Lengths, patterns, formats, defaults and the rest say how a value
 * is checked, not what it is, and are dropped — the schema itself is one button away.
 *
 * What comes out is not a schema and is not meant to parse back into one.
 */

/** One line of the shape, indented by its depth. */
export interface Line {
  depth: number
  /** The property this line is about; the shape's own line has none. */
  key: string | null
  /** What it is, or null where the line opens onto the lines beneath it. */
  type: string | null
  /** Not required by whatever holds it, and said more quietly for it. */
  optional: boolean
}

/** A schema, as far as this reads one. Everything else about it is somebody's business. */
interface Schema {
  type?: unknown
  nullable?: unknown
  properties?: unknown
  required?: unknown
  items?: unknown
  enum?: unknown
  const?: unknown
  oneOf?: unknown
  anyOf?: unknown
}

/** A schema that says nothing about its type says nothing at all. */
const ANY = 'any'

/** The property that names a thing; it reads first wherever it appears. */
const ID = 'id'

export function read(value: unknown): Line[] {
  const lines: Line[] = []

  add(null, value, 0, false, lines)

  return lines
}

function add(
  key: string | null,
  value: unknown,
  depth: number,
  optional: boolean,
  into: Line[],
): void {
  const schema = shape(value)
  const opened = open(schema)

  if (opened === null) {
    into.push({ depth, key, type: name(schema), optional })

    return
  }

  // the shape's own object needs no line of its own: it is the whole of what is shown
  const whole = key === null && opened.suffix === ''

  if (!whole) into.push({ depth, key: (key ?? '') + opened.suffix, type: null, optional })

  const required = new Set(listed(opened.of.required))
  const properties = record(opened.of.properties)
  const at = whole ? depth : depth + 1

  for (const field of order(opened.of, required))
    add(field, properties[field], at, !required.has(field), into)
}

/**
 * The object a line opens onto, and the brackets standing between the key and it. Only
 * an object is worth opening; a list of objects is opened as the object it lists, which
 * is the one thing about a list that cannot be said on one line.
 */
function open(schema: Schema | null): { of: Schema; suffix: string } | null {
  let at = schema
  let suffix = ''

  while (at !== null && only(at, 'array') && at.items !== undefined) {
    at = shape(at.items)
    suffix += '[]'
  }

  if (at === null || !only(at, 'object') || held(at).length === 0) return null

  return { of: at, suffix }
}

/** Required first and `id` before them, then the rest in the order they were declared. */
function order(schema: Schema, required: Set<string>): string[] {
  return held(schema).sort((a, b) => rank(a) - rank(b))

  function rank(name: string): number {
    return name === ID ? 0 : required.has(name) ? 1 : 2
  }
}

/**
 * The properties worth showing. What a component keeps for its own bookkeeping is named
 * with a leading underscore, and is not part of the shape anyone else deals with.
 */
function held(schema: Schema): string[] {
  return Object.keys(record(schema.properties)).filter((name) => !name.startsWith('_'))
}

/** How the type is written: `string`, `number | null`, `string[]`, `(string | number)[]`. */
function name(schema: Schema | null): string {
  const named = kinds(schema)

  if (named.length === 0) return ANY

  return named.map((kind) => (kind === 'array' ? list(schema) : kind)).join(' | ')
}

function list(schema: Schema | null): string {
  const item = name(shape(schema?.items))

  return (item.includes('|') ? `(${item})` : item) + '[]'
}

/** Whether the schema is that and nothing else — a nullable object is not an object. */
function only(schema: Schema, kind: string): boolean {
  const named = kinds(schema)

  return named.length === 1 && named[0] === kind
}

/** The JSON types a value may take, however the schema happens to say so. */
function kinds(schema: Schema | null): string[] {
  if (schema === null) return []

  const declared = stated(schema)
  const named = declared.length > 0 ? declared : inferred(schema)

  if (schema.nullable === true && !named.includes('null')) named.push('null')

  return named
}

function stated(schema: Schema): string[] {
  if (typeof schema.type === 'string') return [schema.type]

  if (Array.isArray(schema.type)) return schema.type.filter((name) => typeof name === 'string')

  return []
}

/** A schema without a type still gives itself away by what it says about its values. */
function inferred(schema: Schema): string[] {
  if (Array.isArray(schema.enum)) return distinct(schema.enum.map(literal))

  if (schema.const !== undefined) return [literal(schema.const)]

  if (schema.properties !== undefined) return ['object']

  if (schema.items !== undefined) return ['array']

  // a choice of shapes is the choice of their types; a branch that only constrains
  // something else — `{ required: [...] }` — names no type and adds none
  const branches = [schema.oneOf, schema.anyOf].filter((of) => Array.isArray(of)).flat()

  return distinct(branches.flatMap((branch) => kinds(shape(branch))))
}

function literal(value: unknown): string {
  if (value === null) return 'null'

  if (Array.isArray(value)) return 'array'

  return typeof value
}

function shape(value: unknown): Schema | null {
  return keyed(value) ? (value as Schema) : null
}

function record(value: unknown): Record<string, unknown> {
  return keyed(value) ? (value as Record<string, unknown>) : {}
}

function keyed(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function listed(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((name) => typeof name === 'string') : []
}

function distinct(names: string[]): string[] {
  return [...new Set(names)]
}
