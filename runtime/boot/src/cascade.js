'use strict'

const { Cascade } = require('@kookaburra/core')

const boot = require('./index')

const cascade = (manifest, endpoint, definition, context) => {
  const bridges = []

  if (definition.bridge) { bridges.unshift(boot.bridge.operation(manifest.path, endpoint, definition, context)) }

  let prototype = manifest

  while ((prototype = prototype.prototype) !== null) {
    const operation = prototype.operations[endpoint]

    if (operation === undefined) continue

    const bridge = boot.bridge.operation(
      prototype.path,
      endpoint,
      { ...definition, bridge: operation.bridge },
      context
    )

    bridges.unshift(bridge)
  }

  if (bridges.length > 1) return new Cascade(bridges)
  else return bridges[0]
}

exports.cascade = cascade
