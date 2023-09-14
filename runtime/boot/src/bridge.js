'use strict'

const algorithm = (bridge, path, endpoint, context) => {
  const algorithm = resolve(bridge).algorithm(path, endpoint, context)

  algorithm.depends(context)

  return algorithm
}

const event = (bridge, path, label, context) => resolve(bridge).event(path, label, context)
const receiver = (bridge, path, label) => resolve(bridge).receiver(path, label)

const factories = {}

const resolve = (bridge) => {
  if (factories[bridge] === undefined) {
    const { Factory } = require(bridge)

    factories[bridge] = new Factory()
  }

  return factories[bridge]
}

exports.algorithm = algorithm
exports.event = event
exports.receiver = receiver
