import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as extensions from './extensions/index.js'

// import.meta.resolve takes no paths, and the connector is resolved against the
// component that names it
const require = createRequire(import.meta.url)

/**
 * @param {toa.norm.Component} manifest
 * @param {boolean} outbox whether this component publishes anything, and so needs a place to
 *   commit it with the entity
 */
export const storage = async (manifest, outbox) => {
  if (manifest.entity === undefined) return

  const Factory = await load(manifest)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(manifest.locator, manifest.entity, { outbox })

  return extensions.storage(storage)
}

async function load (component) {
  const reference = component.entity.storage
  const path = require.resolve(reference, { paths: [component.path, import.meta.dirname] })
  const { Factory } = await import(pathToFileURL(path).href)

  return Factory
}
