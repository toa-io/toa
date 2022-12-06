'use strict'

const { Emission, Event } = require('@toa.io/core')

const boot = require('./index')

const emission = (definitions, locator) => {
  if (definitions === undefined) return

  const events = Object.entries(definitions).map(([label, definition]) => {
    const emitter = boot.bindings.emit(definition.binding, locator, label)
    const bridge = boot.bridge.event(definition.bridge, definition.path, label)

    return new Event(definition, emitter, bridge)
  })

  return new Emission(events)
}

exports.emission = emission
