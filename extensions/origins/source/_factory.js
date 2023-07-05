'use strict'

const protocols = require('./protocols')
const env = require('./env')

class _factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.origins.Manifest} manifest
   * @return {toa.core.extensions.Aspect[]}
   */
  aspect (locator, manifest) {
    env.apply(locator, manifest)

    return protocols.map((protocol) => this.#createAspect(protocol, manifest))
  }

  /**
   * @param {object} protocol
   * @param {toa.origins.Manifest} manifest
   * @return {toa.core.extensions.Aspect}
   */
  #createAspect (protocol, manifest) {
    const protocolManifest = {}

    let properties

    for (const [origin, reference] of Object.entries(manifest)) {
      if (origin[0] === '.') {
        if (origin.substring(1) === protocol.id) properties = reference

        continue
      }

      const url = new URL(reference)

      if (protocol.protocols.includes(url.protocol)) protocolManifest[origin] = reference
    }

    return protocol.create(protocolManifest, properties)
  }
}

exports.Factory = _factory
