'use strict'

const operation = (path, declaration, context) => {
  const operation = resolve(declaration.bridge).operation(path, declaration, context)

  operation.depends(context)

  return operation
}

const event = (path, declaration) => resolve(declaration.bridge).event(path, declaration)

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
