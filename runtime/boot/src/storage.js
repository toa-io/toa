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
 * @param {boolean} inbox whether any of its operations declares `once`, and so needs a place to
 *   record the call it commits
 */
export const storage = async (manifest, outbox, inbox) => {
  if (manifest.entity === undefined) return

  const Factory = await load(manifest)

  /** @type {import('@toa.io/core/types').storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(manifest.locator, manifest.entity, { outbox, inbox })

  // a component whose structure nothing will make must not start with the structure it lacks;
  // what it inherits was written for descendants that store, and one that stores nothing has
  // nothing to convert
  const own = manifest.entity.migrations?.some(
    (migration) => migration.prototype === undefined
  )

  if (own === true && storage.migrates !== true)
    throw new Error(
      `Component '${manifest.locator.id}' declares migrations, ` +
        `which storage '${manifest.entity.storage}' does not apply`
    )

  /*
   * Refused here rather than degraded: a storage that cannot record a call would run every
   * duplicate of it, which is what declaring `once` asked not to happen. Whether the deployment
   * can commit one is the storage's own to refuse, once it is connected.
   */
  if (inbox && storage.claims !== true)
    throw new Error(
      `Component '${manifest.locator.id}' declares 'once', ` +
        `which storage '${manifest.entity.storage}' does not provide`
    )

  return extensions.storage(storage, manifest.locator)
}

async function load(component) {
  const reference = component.entity.storage
  const path = require.resolve(reference, {
    paths: [component.path, import.meta.dirname]
  })
  const { Factory } = await import(pathToFileURL(path).href)

  return Factory
}
