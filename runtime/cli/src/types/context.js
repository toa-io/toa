import { BANNER, collector, imports } from './lib.js'

/**
 * The context's own module: what every component of it shares.
 *
 * @param {toa.norm.Context} context
 * @param {Array<{ manifest: toa.norm.Component, from: string }>} components every component
 *   the context resolves, the ones its extensions contribute included
 * @returns {string}
 */
export function module (context, components) {
  const { importing, required } = collector()

  importing('@toa.io/extensions.telemetry', 'Logs')
  importing('@toa.io/extensions.fetch', 'FetchInit')

  for (const { manifest, from } of components)
    importing(from, `Component as ${alias(manifest.locator)}`)

  const blocks = [
    `/**
 * What every component of '${context.name}' is given.
 *
 * \`logs\` and \`fetch\` are here rather than per component: telemetry and fetch are declared
 * for every component whether or not it asks for them.
 */
export interface Context<Local> {
  env: string
  name: string
  local: Local
  remote: Remote
  logs: Logs
  fetch: (input: string | URL | Request, init?: FetchInit) => Promise<Response>
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
function remote (components) {
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

    const members = Object.keys(namespaces[namespace]).sort()
      .map((name) => `    ${name}: ${namespaces[namespace][name]}`)

    lines.push(`  ${namespace}: {\n${members.join('\n')}\n  }`)
  }

  return `export interface Remote {\n${lines.join('\n')}\n}`
}

/** A component's name in this module, unique across namespaces. */
const alias = (locator) =>
  locator.id.split(/[.\-_]/).map((part) => part[0].toUpperCase() + part.slice(1)).join('')
