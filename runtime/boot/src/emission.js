'use strict'

const { Emission, Event } = require('@kookaburra/core')

const boot = require('./index')

const emission = (definitions, locator) => {
  if (definitions === undefined) return

  const events = Object.entries(definitions).map(([label, definition]) => {
    const transmitter = boot.bindings.emit(definition.binding, locator, label)
    const bridge = boot.bridge.event(label, definition)

    return new Event(definition, transmitter, bridge)
  })

  return new Emission(events)
}

exports.emission = emission
