'use strict'

const { Emission, Event } = require('@kookaburra/core')

const boot = require('./index')

const emission = (manifest, locator) => {
  if (manifest.events === undefined) return

  const promises = boot.promise.promise('producers', locator.fqn)

  const events = manifest.events.map((declaration) => {
    const bridge = boot.bridge.event(manifest.path, declaration)

    return new Event(declaration, bridge)
  })

  return new Emission(promises, events)
}

exports.emission = emission
