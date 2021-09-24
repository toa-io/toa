'use strict'

const { Emission, Event } = require('@kookaburra/core')

const boot = require('./index')

const emission = (manifest, locator) => {
  if (manifest.events === undefined) return

  const transmitter = boot.bindings.transmit(locator)

  const events = []

  for (const [label, definition] of Object.entries(manifest.events)) {
    const bridge = boot.bridge.event(label, definition)

    events.push(new Event(label, definition, bridge))
  }

  return new Emission(transmitter, events)
}

exports.emission = emission
