import { instance } from './resolve.js'

/**
 * Where a committed state change of this component goes, beside its own events. An extension
 * that contributes one gives the component an outbox whether or not it declares an event, so
 * this is read before the storage is made.
 *
 * @param {toa.norm.Component} manifest
 * @returns {Promise<import('@toa.io/core/types').outbox.Destination[]>}
 */
export const destinations = async (manifest) => {
  const destinations = []

  if (manifest.extensions === undefined) return destinations

  for (const [name, declaration] of Object.entries(manifest.extensions)) {
    const factory = instance(name, manifest.path)

    if (factory.destination === undefined) continue

    const destination = await factory.destination(manifest.locator, declaration, manifest)

    if (destination !== undefined) destinations.push(destination)
  }

  return destinations
}
