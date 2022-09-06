'use strict'

const { Context, Locator } = require('@toa.io/core')

const boot = require('./index')

const context = async (manifest) => {
  const local = await boot.remote(manifest.locator, manifest)
  const annexes = boot.extensions.annexes(manifest)

  const lookup = async (namespace, name) => {
    const locator = new Locator(name, namespace)
    const remote = await boot.remote(locator)

    await remote.connect()

    return remote
  }

  return new Context(local, lookup, annexes)
}

exports.context = context
