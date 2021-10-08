'use strict'

const { Cascade } = require('@kookaburra/core')

const boot = require('./index')

const cascade = (manifest, endpoint, definition, context) => {
  const bridges = []

  if (definition.forward) endpoint = definition.forward

  if (definition.bridge) {
    const bridge = boot.bridge.operation(definition.bridge, manifest.path, endpoint, context)

    bridges.unshift(bridge)
  }

  let prototype = manifest

  while ((prototype = prototype.prototype) !== null) {
    const operation = prototype.operations[endpoint]

    if (operation === undefined) continue

    const bridge = boot.bridge.operation(operation.bridge, prototype.path, endpoint, context)

    bridges.unshift(bridge)
  }

  if (bridges.length > 1) return new Cascade(bridges)
  else return bridges[0]
}

exports.cascade = cascade
