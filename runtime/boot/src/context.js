'use strict'

const { Context } = require('@kookaburra/core')

const boot = require('./index')

const context = async (manifest, discovery) => {
  let remotes = manifest.remotes?.map((remote) => boot.remote(remote, discovery))

  if (remotes) remotes = await Promise.all(remotes)

  return new Context(remotes)
}

exports.context = context
