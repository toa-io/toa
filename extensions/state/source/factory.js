import { Aspect } from './aspect.js'

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  aspect (_, __) {
    return new Aspect()
  }
}

export { Factory }
