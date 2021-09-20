'use strict'

const boot = require('./index')

const bridge = (declaration, path, remotes) => {
  const { Bridge } = require(declaration.bridge)
  const context = boot.context(remotes)

  const bridge = new Bridge(declaration, path, context)

  bridge.depends(context)

  return bridge
}

exports.bridge = bridge
