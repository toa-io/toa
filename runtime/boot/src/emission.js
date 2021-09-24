'use strict'

const { Emission, Event } = require('@kookaburra/core')

const boot = require('./index')

const emission = (manifest, locator) => {
  if (manifest.events === undefined) return

  const transmitter = boot.bindings.transmit(locator)

  const events = Object.entries(manifest.events).map(([label, definition]) => {
    const bridge = boot.bridge.event(label, definition)

    return new Event(label, definition, bridge)
  })

  return new Emission(transmitter, events)
}

exports.emission = emission
