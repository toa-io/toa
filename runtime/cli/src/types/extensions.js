import { emit } from './schema.js'

/**
 * What each extension puts on a component's context, as the extension states it.
 *
 * An extension that contributes nothing exports nothing, and one that does is asked with the
 * declaration the component wrote — which is how `storages: [assets]` becomes a record of the
 * two it names, and a configuration schema becomes the type a component reads.
 *
 * @param {Record<string, object | null>} extensions a component's normalized extensions
 * @returns {Promise<{ types: Record<string, string>, imports: Record<string, Set<string>> }>}
 */
export async function contributions (extensions = {}) {
  const types = {}
  const imports = {}

  for (const [reference, declaration] of Object.entries(extensions)) {
    for (const contribution of await state(reference, declaration)) {
      types[contribution.name] = contribution.schema === undefined
        ? contribution.type ?? 'unknown'
        : emit(contribution.schema)

      for (const [module, names] of Object.entries(contribution.imports ?? {})) {
        imports[module] ??= new Set()
        names.forEach((name) => imports[module].add(name))
      }
    }
  }

  return { types, imports }
}

/**
 * @param {string} reference
 * @param {object | null} declaration
 * @returns {Promise<toa.core.extensions.Contribution[]>}
 */
async function state (reference, declaration) {
  let extension

  try {
    extension = await import(reference)
  } catch {
    // an extension that cannot be loaded is one this application does not install
    return []
  }

  if (typeof extension.context !== 'function') return []

  const contributed = extension.context(declaration)

  if (contributed === undefined || contributed === null) return []

  return Array.isArray(contributed) ? contributed : [contributed]
}
