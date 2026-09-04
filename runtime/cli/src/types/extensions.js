/**
 * What each extension puts on a component's context.
 *
 * A placeholder. An extension states this itself once it exports a contribution, at which
 * point this file is deleted rather than extended — it holds the same keys the bridge already
 * hardcodes in `bridges.node/src/shortcuts`.
 */

import { emit } from './schema.js'

/**
 * @param {Record<string, object | null>} extensions a component's normalized extensions
 * @returns {{ keys: string[], types: Record<string, string>, imports: Record<string, Set<string>> }}
 */
export function contributions (extensions = {}) {
  const types = {}
  const imports = {}

  const importing = (module, ...names) => {
    imports[module] ??= new Set()
    names.forEach((name) => imports[module].add(name))
  }

  for (const [reference, declaration] of Object.entries(extensions)) {
    const contribute = CONTRIBUTIONS[reference]

    if (contribute === undefined) continue

    const contribution = contribute(declaration, importing)

    if (contribution !== undefined) types[contribution.name] = contribution.type
  }

  return { keys: Object.keys(types), types, imports }
}

const CONTRIBUTIONS = {
  '@toa.io/extensions.configuration': (declaration, importing) => {
    if (declaration?.schema === undefined) return undefined

    // a secret is what the schema says it is, not what the deployed value happens to look like
    if (JSON.stringify(declaration.schema).includes('"secret"'))
      importing('@toa.io/userland/types', 'Secret')

    return { name: 'configuration', type: emit(declaration.schema) }
  },

  '@toa.io/extensions.storages': (declaration, importing) => {
    if (!Array.isArray(declaration) || declaration.length === 0) return undefined

    importing('@toa.io/extensions.storages', 'Storage')

    const names = declaration.map((name) => JSON.stringify(name)).join(' | ')

    return { name: 'storages', type: `Record<${names}, Storage>` }
  },

  '@toa.io/extensions.stash': (_, importing) => {
    importing('@toa.io/extensions.stash', 'Stash')

    return { name: 'stash', type: 'Stash' }
  },

  // telemetry and fetch are declared for every component, so `logs` and `fetch` are on the
  // Context every component shares rather than here

  '@toa.io/extensions.state': () =>
    // the shape is whatever the component keeps there, and nothing declares it
    ({ name: 'state', type: 'Record<string, any>' }),

}
