import { Storage } from './storage.js'

/**
 * @implements {toa.core.storages.Factory}
 */
class Factory {
  storage (_) {
    return new Storage()
  }
}

export { Factory }
