import { Storage } from './storage.js'

/**
 * @implements {toa.core.storages.Factory}
 */
export class Factory {
  storage (_) {
    return new Storage()
  }
}
