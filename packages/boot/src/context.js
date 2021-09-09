'use strict'

const { Context } = require('@kookaburra/runtime')

const boot = require('./index')

const context = (manifest) => {
  const remotes = manifest.remotes && manifest.remotes.map(boot.promise.promise)

  return new Context(remotes)
}

exports.context = context
