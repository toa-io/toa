'use strict'

const { Context, Locator } = require('@toa.io/core')

const boot = require('./index')

const context = async (manifest) => {
  const local = await boot.remote(manifest.locator, manifest)
  const aspects = boot.extensions.aspects(manifest)

  const lookup = async (namespace, name) => {
    const locator = new Locator(name, namespace)
    const remote = await boot.remote(locator)

    await remote.connect()

    return remote
  }

  const context = new Context(local, lookup, aspects)

  return boot.extensions.context(context)
}

exports.context = context
