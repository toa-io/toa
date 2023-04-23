'use strict'

const protocols = require('./protocols')
const env = require('./env')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  aspect (locator, manifest) {
    env.apply(locator, /** @type {toa.origins.Manifest} */ manifest)

    return protocols.map((protocol) => this.#createAspect(protocol, manifest))
  }

  /**
   * @param {object} protocol
   * @param {toa.origins.Manifest} manifest
   * @return {toa.core.extensions.Aspect}
   */
  #createAspect (protocol, manifest) {
    const protocolManifest = {}

    for (const [origin, reference] of Object.entries(manifest)) {
      const url = new URL(reference)

      if (protocol.protocols.includes(url.protocol)) protocolManifest[origin] = reference
    }

    return new protocol.create(protocolManifest)
  }
}

exports.Factory = Factory
