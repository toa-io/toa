import { Storage } from './storage.js'

/**
 * @implements {import('@toa.io/core/types').storages.Factory}
 */
export class Factory {
  storage (_) {
    return new Storage()
  }
}
