import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as boot from '@toa.io/boot'
import { component, shortcuts } from '@toa.io/norm'
import { find } from '@toa.io/generic'

// an extension is named the way a package is, and a module is loaded by file
const require = createRequire(import.meta.url)

/**
 * The services of the extensions the given components reference. A service hosts components
 * of its own, and those reference extensions too — the identity components inside the gateway
 * wait for the values service — so what a running service hosts is looked into as well.
 *
 * @param {string[]} paths
 * @return {Promise<import('@toa.io/core').Connector[]>}
 */
export async function discover (paths) {
  const references = new Set()
  const services = []
  const pending = [...paths]

  while (pending.length > 0) {
    const manifest = await component(pending.shift())

    for (const reference of Object.keys(manifest.extensions ?? {})) {
      if (references.has(reference)) continue

      references.add(reference)

      const { Factory, components } = await load(reference)

      if (typeof Factory?.prototype.service !== 'function') continue

      const service = await new Factory(boot.host()).service()

      // an extension that is off in this environment hosts nothing here either
      if (service === null) continue

      services.push(service)

      if (components !== undefined) pending.push(...components().paths)
    }
  }

  return services
}

/**
 * The services of the named extensions, and only those. The list is exact: an extension the
 * components of a running service reference is reached over the network, the way any two
 * pods reach each other, rather than started here.
 *
 * @param {string[]} references
 * @return {Promise<import('@toa.io/core').Connector[]>}
 */
export async function create (references) {
  const services = []

  for (const reference of new Set(references.map(shortcuts.resolve))) {
    const { Factory } = await load(reference)

    if (typeof Factory?.prototype.service !== 'function')
      throw new Error(`Service is not implemented by '${reference}'`)

    const service = await new Factory(boot.host()).service()

    // an extension that is off in this environment has nothing to run here
    if (service === null) continue

    services.push(service)
  }

  return services
}

/**
 * @param {string} reference
 * @return {Promise<object>}
 */
async function load (reference) {
  // the runtime's own installation is searched too, so a reference resolves
  // inside the image as well as in a workspace
  const module = find(reference, process.cwd())

  return await import(pathToFileURL(require.resolve(module)).href)
}
