import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as boot from '@toa.io/boot'
import { shortcuts } from '@toa.io/norm'
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
export async function discover(paths) {
  const references = new Set()
  const services = []
  const pending = [...paths]

  while (pending.length > 0) {
    // read the way a booting process reads it: what a build normalised, or what the digest
    // holds for a component an extension ships, before the sources of either
    const manifest = await boot.manifest(pending.shift())

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
 * An extension that is off in this environment has no service. Where the names are exact, one
 * named that way is refused; otherwise it is left out, which is what a composition's list gets,
 * since it may name a service one environment does not run.
 *
 * @param {string[]} references
 * @param {boolean} [exact]
 * @return {Promise<import('@toa.io/core').Connector[]>}
 */
export async function create(references, exact = false) {
  const services = []
  const off = []

  // by what it resolves to, keeping the name it was given
  const named = new Map(references.map((reference) => [shortcuts.resolve(reference), reference]))

  for (const [reference, name] of named) {
    const { Factory } = await load(reference)

    if (typeof Factory?.prototype.service !== 'function')
      throw new Error(`Service is not implemented by '${reference}'`)

    const service = await new Factory(boot.host()).service()

    if (service === null) off.push(name)
    else services.push(service)
  }

  if (exact && off.length > 0) {
    const one = off.length === 1

    throw new Error(
      `${off.map((name) => `'${name}'`).join(', ')} ${one ? 'has' : 'have'} no service to run ` +
        `in this environment: ${one ? 'its' : 'their'} variables are absent. ` +
        'Regenerate the environment file with `toa env`.'
    )
  }

  return services
}

/**
 * @param {string} reference
 * @return {Promise<object>}
 */
async function load(reference) {
  // the runtime's own installation is searched too, so a reference resolves
  // inside the image as well as in a workspace
  const module = find(reference, process.cwd())

  return await import(pathToFileURL(require.resolve(module)).href)
}
