'use strict'

const { Cascade } = require('@kookaburra/core')

const boot = require('./index')

const cascade = (manifest, declaration, path) => {
  const bridges = []

  if (declaration.bridge) bridges.unshift(boot.bridge(declaration, path, manifest.remotes))

  let prototype = manifest

  while ((prototype = prototype.prototype) !== null) {
    const operation = prototype?.operations.find((operation) => operation.name === declaration.name)

    if (operation === undefined) continue

    const bridge = boot.bridge({ ...declaration, bridge: operation.bridge }, prototype.path, prototype.remotes)

    bridges.unshift(bridge)
  }

  if (bridges.length > 1) return new Cascade(bridges)
  else return bridges[0]
}

exports.cascade = cascade
