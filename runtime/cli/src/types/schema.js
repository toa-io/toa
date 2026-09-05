/**
 * A JSON Schema as a TypeScript type expression.
 *
 * Schemas arrive normalized: `norm` has resolved the `default: .id` shorthand and the loader
 * has resolved YAML merge keys, so neither is seen here. Validation keywords — `maxLength`,
 * `pattern`, `minimum` — shape nothing and are ignored.
 */

import { comment } from './lib.js'

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * @param {object | boolean} [schema]
 * @param {object} [root] what a local `$ref` is resolved against, the schema itself by default
 * @param {number} [depth] indentation of the object this expression is written into
 * @returns {string}
 */
export function emit (schema, root = schema, depth = 0) {
  if (schema === undefined || schema === true) return 'unknown'
  if (schema === false) return 'never'

  if (schema.$ref !== undefined) return emit(dereference(schema.$ref, root), root, depth)

  const type = shape(schema, root, depth)

  // `nullable` is not JSON Schema, but Toa's schemas are written with it
  return schema.nullable === true ? union([type, 'null']) : type
}

/**
 * A schema states its own shape and composes others at the same time — `properties` beside an
 * `allOf` of `anyOf`s, which is how a manifest says "these fields, and one of these is
 * required". So each is read and what they say together is the intersection.
 */
function shape (schema, root, depth) {
  if (schema.const !== undefined) return literal(schema.const)
  if (schema.enum !== undefined) return union(schema.enum.map(literal))

  const parts = [own(schema, root, depth)]
  const variants = schema.oneOf ?? schema.anyOf

  if (variants !== undefined)
    parts.push(union(variants.map((variant) => emit(variant, root, depth))))

  if (schema.allOf !== undefined)
    parts.push(...schema.allOf.map((member) => emit(member, root, depth)))

  // `unknown` says nothing, and an intersection with it is what the rest already says
  const stated = parts.filter((part) => part !== 'unknown')

  if (stated.length === 0) return 'unknown'
  if (stated.length === 1) return stated[0]

  // a union binds looser than an intersection, so it is the one that needs the brackets
  return stated.map((part) => part.includes(' | ') ? `(${part})` : part).join(' & ')
}

/** What a schema states of itself, before what it composes. */
function own (schema, root, depth) {
  if (Array.isArray(schema.type))
    return union(schema.type.map((type) => emit({ ...schema, type }, root, depth)))

  switch (schema.type) {
    case 'string': return schema.format === 'secret' ? 'Secret' : 'string'
    case 'number': case 'integer': return 'number'
    case 'boolean': return 'boolean'
    case 'null': return 'null'
    case 'array': return array(schema, root, depth)
    case 'object': return object(schema, root, depth)

    // a schema stating nothing accepts anything; one that only lists properties is an object
    default: return schema.properties === undefined ? 'unknown' : object(schema, root, depth)
  }
}

function array (schema, root, depth) {
  const item = emit(schema.items, root, depth)

  return IDENTIFIER.test(item) ? `${item}[]` : `Array<${item}>`
}

function object (schema, root, depth) {
  const entries = Object.entries(schema.properties ?? {})
  const rest = index(schema, root, depth)

  // `{}` in TypeScript is anything but null, which is not what an unconstrained object means
  if (entries.length === 0) return rest ?? 'Record<string, unknown>'

  const required = new Set(schema.required ?? [])
  const padding = '  '.repeat(depth + 1)
  const lines = []

  for (const [name, property] of entries) {
    const key = IDENTIFIER.test(name) ? name : JSON.stringify(name)
    const optional = required.has(name) ? '' : '?'

    const described = comment(property?.description, padding)

    if (described !== null)
      lines.push(described)

    lines.push(`${padding}${key}${optional}: ${emit(property, root, depth + 1)}`)
  }

  if (rest !== undefined) lines.push(`${padding}[key: string]: unknown`)

  return `{\n${lines.join('\n')}\n${'  '.repeat(depth)}}`
}

/** What a schema says about the properties it does not name. */
function index (schema, root, depth) {
  const patterns = Object.values(schema.patternProperties ?? {})

  if (patterns.length > 0)
    return `Record<string, ${union(patterns.map((s) => emit(s, root, depth)))}>`

  const additional = schema.additionalProperties

  if (additional === undefined || additional === false) return undefined
  if (additional === true) return 'Record<string, unknown>'

  return `Record<string, ${emit(additional, root, depth)}>`
}

function dereference (ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`Cannot resolve '${ref}': only local pointers`)

  let node = root

  for (const segment of ref.slice(2).split('/'))
    node = node?.[segment.replace(/~1/g, '/').replace(/~0/g, '~')]

  if (node === undefined) throw new Error(`Cannot resolve '${ref}'`)

  return node
}

/** Whether a schema constrains anything at all: `output` defaults to `{}`, which does not. */
export function stated (schema) {
  return schema !== undefined && schema !== null && Object.keys(schema).length > 0
}

const union = (types) => [...new Set(types)].join(' | ')
const literal = (value) => JSON.stringify(value) ?? 'null'
