'use strict'

const { Cascade } = require('@toa.io/core')

const boot = require('./index')

const cascade = (manifest, endpoint, definition, context) => {
  const bridges = []

  if (definition.forward) endpoint = definition.forward

  if (definition.bridge) {
    const bridge = boot.bridge.algorithm(definition.bridge, manifest.path, endpoint, context)

    bridges.unshift(bridge)
  }

  let prototype = manifest

  while ((prototype = prototype.prototype) !== null) {
    const operation = prototype.operations[endpoint]

    if (operation === undefined) continue

    const bridge = boot.bridge.algorithm(operation.bridge, prototype.path, endpoint, context)

    bridges.unshift(bridge)
  }

  return new Cascade(bridges)
}

exports.cascade = cascade
