import { BANNER, collector, imports } from './lib.js'

/**
 * The context's own module: what every component of it shares.
 *
 * @param {toa.norm.Context} context
 * @param {Array<{ manifest: toa.norm.Component, from: string }>} components every component
 *   the context resolves, the ones its extensions contribute included
 * @param {{ types: Record<string, string>, imports: Record<string, Set<string>> }} [shared]
 *   what every component of the Context has on its context
 * @returns {string}
 */
export function module(context, components, shared = { types: {}, imports: {} }) {
  const { importing, required } = collector()

  for (const [from, names] of Object.entries(shared.imports)) importing(from, ...names)

  for (const { manifest, from } of components)
    importing(from, `Component as ${alias(manifest.locator)}`)

  const common = Object.keys(shared.types)
    .map((key) => `  ${key}: ${shared.types[key]}`)
    .join('\n')

  const blocks = [
    `/**
 * What the replicas of this component decide together.
 */
export interface Atom {
  slots: (total: number) => number[] | null
  meter: (keys: string[], deltas: number[]) => Promise<number[]>
  lock: <T>(keys: string | string[], routine: (signal: AbortSignal & { error: Error }, context: unknown) => Promise<T>) => Promise<T>
}`,
    `/**
 * What every component of '${context.name}' is given.
 *
 * \`atom\` is there for all of them, declared in no manifest. What an extension puts here
 * rather than on one component is what every component of this Context declares —
 * telemetry and fetch, which are declared for all of them.
 */
export interface Context<Local> {
  env: string
  name: string
  instance: string
  atom: Atom
  local: Local
  remote: Remote
${common}
}`,
    remote(components)
  ]

  return BANNER + imports(required) + '\n' + blocks.join('\n\n') + '\n'
}

/**
 * Every component of the context, by the path a call takes to it. The bridge's underlay
 * unshifts `default` for a two-segment path, so a component of the default namespace is
 * reached both ways.
 */
function remote(components) {
  const namespaces = {}

  for (const { manifest } of components) {
    const { namespace, name } = manifest.locator

    namespaces[namespace] ??= {}
    namespaces[namespace][name] = alias(manifest.locator)
  }

  const lines = []

  for (const name of Object.keys(namespaces.default ?? {}).sort())
    lines.push(`  ${name}: ${namespaces.default[name]}`)

  for (const namespace of Object.keys(namespaces).sort()) {
    if (namespace === 'default') continue

    const members = Object.keys(namespaces[namespace])
      .sort()
      .map((name) => `    ${name}: ${namespaces[namespace][name]}`)

    lines.push(`  ${namespace}: {\n${members.join('\n')}\n  }`)
  }

  return `export interface Remote {\n${lines.join('\n')}\n}`
}

/** A component's name in this module, unique across namespaces. */
const alias = (locator) =>
  locator.id
    .split(/[.\-_]/)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
