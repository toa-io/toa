'use strict'

const { Emission, Event } = require('@toa.io/core')

const boot = require('./index')
const extensions = require('./extensions')

const emission = (definitions, locator, context) => {
  if (definitions === undefined) return

  const events = Object.entries(definitions).map(([label, definition]) => {
    const emitter = boot.bindings.emit(definition.binding, locator, label)
    const decorator = extensions.emitter(emitter, label)
    const bridge = boot.bridge.event(definition.bridge, definition.path, label, context)

    return new Event(definition, decorator, bridge)
  })

  return new Emission(events)
}

exports.emission = emission
