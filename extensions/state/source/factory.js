import { Aspect } from './aspect.js'

/**
 * @implements {import('@toa.io/core/types').extensions.Factory}
 */
export class Factory {
  aspect (_, __) {
    return new Aspect()
  }
}
