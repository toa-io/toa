'use strict'

const operation = (path, endpoint, definition, context) => {
  const operation = resolve(definition.bridge).operation(path, endpoint, definition, context)

  operation.depends(context)

  return operation
}

const event = (label, definition) => resolve(definition.bridge).event(definition.path, label)

const factories = {}

const resolve = (bridge) => {
  if (factories[bridge] === undefined) {
    const { Factory } = require(bridge)

    factories[bridge] = new Factory()
  }

  return factories[bridge]
}

exports.operation = operation
exports.event = event
