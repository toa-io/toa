import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core/types').storages.Storage} storage
 * @param {import('@toa.io/core').Locator} locator whose storage it is
 * @returns {import('@toa.io/core/types').storages.Storage}
 */
export const storage = (storage, locator) => {
  let decorated = storage

  for (const factory of Object.values(instances)) {
    if (factory.storage !== undefined) decorated = factory.storage(decorated, locator)
  }

  return decorated
}
