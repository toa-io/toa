'use strict'

const { Cascade } = require('@kookaburra/core')

const boot = require('./index')

const cascade = (manifest, declaration, context) => {
  const bridges = []

  if (declaration.bridge) { bridges.unshift(boot.bridge.operation(manifest.path, declaration, context)) }

  let prototype = manifest

  while ((prototype = prototype.prototype) !== null) {
    const operation = prototype?.operations.find((operation) => operation.name === declaration.name)

    if (operation === undefined) continue

    const bridge = boot.bridge.operation(prototype.path, { ...declaration, bridge: operation.bridge }, context)

    bridges.unshift(bridge)
  }

  if (bridges.length > 1) return new Cascade(bridges)
  else return bridges[0]
}

exports.cascade = cascade
