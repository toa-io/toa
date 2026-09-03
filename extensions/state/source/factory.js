import { Aspect } from './aspect.js'

/**
 * @implements {toa.core.extensions.Factory}
 */
export class Factory {
  aspect (_, __) {
    return new Aspect()
  }
}
