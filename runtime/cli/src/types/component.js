import { emit, stated } from './schema.js'
import { BANNER, capitalize, collector, comment, imports } from './lib.js'

/**
 * A component's types, as its `types.ts`.
 *
 * @param {toa.norm.Component} manifest
 * @param {string} [module] what the Context is imported from. A component an extension
 *   contributes gets none: it is only ever called, never written against, and its sources are
 *   not ours to write beside.
 * @param {{ types: Record<string, string>, imports: Record<string, Set<string>> }} [contributed]
 *   what this component's extensions put on its context, and what is left of it once the
 *   Context every component shares has taken what they all have
 * @returns {string}
 */
export function component (manifest, module, contributed = { types: {}, imports: {} }) {
  const { importing, required } = collector()
  const blocks = []
  const entity = manifest.entity === undefined ? 'unknown' : 'Entity'

  // the prototype's own fields are merged into the schema by then, so it stands alone
  if (manifest.entity !== undefined)
    blocks.push(`export interface Entity ${emit(manifest.entity.schema)}`)

  const endpoints = Object.entries(manifest.operations ?? {})
    .map(([endpoint, operation]) => ({
      endpoint,
      operation,
      name: capitalize(endpoint),
      output: returns(endpoint, operation, manifest, importing)
    }))

  for (const { operation, name, output } of endpoints) {
    if (stated(operation.input)) blocks.push(`export type ${name}Input = ${emit(operation.input)}`)
    if (output.declared) blocks.push(`export type ${name}Output = ${output.type}`)
  }

  blocks.push(calls(endpoints, entity, importing))
  blocks.push(...context(contributed, module, importing))

  if (module !== undefined) {
    if (manifest.guards !== undefined) {
      importing('@toa.io/core', 'Guard as GuardOf')
      blocks.push(`export type Guard = GuardOf<${entity}, Context>`)
    }
  }

  return BANNER + imports(required) + '\n' + blocks.join('\n\n') + '\n'
}

/** One call signature per endpoint, as the call actually resolves. */
function calls (endpoints, entity, importing) {
  const lines = []

  for (const { endpoint, operation, name, output } of endpoints) {
    const request = [stated(operation.input) ? `input: ${name}Input` : 'input?: null']

    if (operation.query !== false) {
      importing('@toa.io/core', 'Query')

      // required only where the operation states it is: the contract asks for one
      // when `query: true`, and otherwise takes it or does without
      request.push(`query${operation.query === true ? '' : '?'}: Query<${entity}>`)
    }

    // whether the call is awaited or left to run
    request.push('task?: boolean')

    const type = output.declared ? `${name}Output` : output.type
    const described = comment(operation.description, '  ')

    if (described !== null)
      lines.push(described)

    lines.push(`  ${endpoint}: (request: { ${request.join(', ')} }) => ` +
      `Promise<${resolves(type, operation, importing)}>`)
  }

  return `export interface Component {\n${lines.join('\n')}\n}`
}

/** The Context this component's own code is given: the base, plus what its extensions add. */
function context (contributed, module, importing) {
  const { types, imports: needed } = contributed

  const blocks = []

  // what a component states of its own configuration is a type it is written against,
  // so it is named rather than left inside the Context
  if (types.configuration !== undefined) {
    for (const [from, names] of Object.entries(needed)) importing(from, ...names)

    blocks.push(`export interface Configuration ${types.configuration}`)
    types.configuration = 'Configuration'
  }

  // a component of no Context of its own has no `remote` that is knowable here, so it
  // writes its own Context beside these
  if (module === undefined) return blocks

  for (const [from, names] of Object.entries(needed)) importing(from, ...names)

  importing(module, 'Context as Base')

  const keys = Object.keys(types)

  if (keys.length === 0) blocks.push('export type Context = Base<Component>')
  else {
    const lines = keys.map((key) => `  ${key}: ${types[key]}`)

    blocks.push(`export interface Context extends Base<Component> {\n${lines.join('\n')}\n}`)
  }

  return blocks
}

/**
 * What an operation returns.
 *
 * Every operation carries `output: {}` after normalization — the schema's default, not a
 * declaration. Where nothing is declared, only an operation Toa itself provides has a knowable
 * result: the prototype's algorithms return the scope they were given.
 */
function returns (endpoint, operation, manifest, importing) {
  if (stated(operation.output)) return { declared: true, type: emit(operation.output) }

  if (manifest.prototype?.operations?.[endpoint] === undefined)
    return { declared: false, type: 'unknown' }

  const entity = manifest.entity === undefined ? 'unknown' : 'Entity'

  switch (operation.scope) {
    case 'object': return { declared: false, type: entity }
    case 'objects': return { declared: false, type: `${entity}[]` }
    // an assignment hands back the new state unless the algorithm returned one
    case 'changeset': return { declared: false, type: entity }
    case 'stream':
      importing('node:stream', 'Readable')

      return { declared: false, type: 'Readable' }
    default: return { declared: false, type: 'unknown' }
  }
}

/**
 * What the caller gets. An operation that declares no `errors` returns none: an error a caller
 * is meant to handle is one the operation states. An exception is thrown rather than returned,
 * so it is in no return type either way.
 */
function resolves (type, operation, importing) {
  // an observation of one object finds nothing as often as it finds something
  const empty = operation.type === 'observation' && operation.scope === 'object' ? ' | null' : ''

  if (operation.errors === undefined) return `${type}${empty}`

  importing('@toa.io/core', 'RemoteError')

  const codes = operation.errors.map((code) => JSON.stringify(code))

  return `${type}${empty} | RemoteError<${codes.join(' | ')}>`
}
