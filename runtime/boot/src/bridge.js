'use strict'

const operation = (bridge, path, endpoint, context) => {
  const operation = resolve(bridge).operation(path, endpoint, context)

  operation.depends(context)

  return operation
}

const event = (bridge, path, label) => resolve(bridge).event(path, label)
const receiver = (bridge, path, label) => resolve(bridge).receiver(path, label)

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
exports.receiver = receiver
