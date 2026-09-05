import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core/types').storages.Storage} storage
 * @returns {import('@toa.io/core/types').storages.Storage}
 */
export const storage = (storage) => {
  let decorated = storage

  for (const factory of Object.values(instances)) {
    if (factory.storage !== undefined) decorated = factory.storage(decorated)
  }

  return decorated
}
