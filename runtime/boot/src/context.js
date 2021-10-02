'use strict'

const { Context } = require('@kookaburra/core')

const boot = require('./index')

const context = async (manifest) => {
  let remotes

  if (manifest.remotes) {
    remotes = await Promise.all(manifest.remotes.map((id) => boot.remote(id)))
  }

  return new Context(remotes)
}

exports.context = context
