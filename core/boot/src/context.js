'use strict'

const { Context } = require('@kookaburra/runtime')

const boot = require('./index')

const context = (manifest) => {
  const remotes = manifest.remotes && manifest.remotes.map(boot.promise.promise)
  const context = new Context(remotes)

  if (remotes) Promise.all(remotes).then((remotes) => context.depends(remotes))

  return context
}

exports.context = context
