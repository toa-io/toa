import type { Binding, Exports } from './exports.ts'

/**
 * What an algorithm module declares, by the conventions the bridge reads a module by: the
 * exported name is the type, the second parameter's name is the scope. `null` where the module
 * exports no algorithm.
 */
export function algorithm(exported: Exports, path: string): Definition | null {
  const entry = find(exported, path)

  if (entry === null) return null

  const [name, bound] = entry

  if (FACTORY.test(name)) return factory(name, bound, path)
  if (CLASSES.has(name)) return klass(name, bound, path)
  if (TYPES.has(name)) return func(name, bound)

  throw new Error(`${path}: exported '${name}' does not match conventions`)
}

export interface Definition {
  type: string
  scope?: string
  input?: null
}

/**
 * A module names its algorithm by exporting it, and it exports one. What a value is cannot
 * always be read from its source — `export const computation = wrap(fn)` — so a name written the
 * way an algorithm's is counts, whatever it is bound to.
 */
function find(exported: Exports, path: string): [string, Binding] | null {
  const candidates = [...exported].filter(
    ([name, bound]) => name !== '__esModule' && (bound.kind !== 'other' || conventional(name))
  )

  if (candidates.length === 0) return null

  if (candidates.length === 1) return resolve(candidates[0])

  const named = candidates.filter(([name]) => name !== 'default')

  if (named.length === 1) return named[0]

  throw new Error(
    `${path}: a module must export one algorithm, and this one exports ` +
      named.map(([name]) => `'${name}'`).join(', ')
  )
}

/** `export default function transition` says its name in the function itself. */
function resolve([name, bound]: [string, Binding]): [string, Binding] {
  return name === 'default' ? [bound.declared ?? '', bound] : [name, bound]
}

function conventional(name: string): boolean {
  return TYPES.has(name) || CLASSES.has(name) || FACTORY.test(name)
}

function func(type: string, bound: Binding): Definition {
  const definition: Definition = { type }

  // computed rather than written: the scope is the manifest's to declare
  if (bound.kind === 'other') return definition

  if (bound.kind !== 'function' || bound.params === undefined)
    throw new Error(`Exported '${type}' does not match conventions`)

  return signature(definition, bound.params)
}

function klass(name: string, bound: Binding, path: string): Definition {
  if (bound.kind !== 'class') throw new Error(`${path}: '${name}' does not match conventions`)

  const params = bound.methods?.execute

  if (params === undefined) throw new Error(`${path}: Method 'execute' not found in '${name}'`)

  return signature({ type: name.toLowerCase() }, params)
}

function factory(name: string, bound: Binding, path: string): Definition {
  if (bound.kind !== 'class') throw new Error(`${path}: '${name}' does not match conventions`)

  const match = name.match(FACTORY)!
  const definition: Definition = { type: match.groups!.type.toLowerCase() }
  const scope = match.groups!.scope?.toLowerCase()

  if (scope !== undefined) definition.scope = scope

  return definition
}

function signature(definition: Definition, params: Array<string | undefined>): Definition {
  definition.scope = params.length > 1 ? scope(params[1]) : 'none'

  if (params.length === 0) definition.input = null

  return definition
}

function scope(name: string | undefined): string | undefined {
  if (name === undefined) return undefined
  if (SCOPES.has(name)) return name
  if (name === 'context') return 'none'

  return undefined
}

export const TYPES: ReadonlySet<string> = new Set([
  'transition',
  'observation',
  'assignment',
  'computation',
  'effect',
  'unmanaged'
])

const SCOPES: ReadonlySet<string> = new Set(['object', 'objects', 'changeset', 'stream'])

const CLASSES: ReadonlySet<string> = new Set(
  [...TYPES].map((type) => type[0].toUpperCase() + type.slice(1))
)

const FACTORY =
  /^(?<scope>Objects?|Changeset)?(?<type>Transition|Observation|Assignment|Computation|Effect)Factory$/
