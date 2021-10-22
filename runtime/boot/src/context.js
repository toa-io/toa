'use strict'

const { Context, Locator } = require('@toa.io/core')

const boot = require('./index')

const context = async (manifest) => {
  const local = await boot.remote(manifest.locator)

  const connect = async (domain, name) => {
    const locator = new Locator({ domain, name })
    const remote = await boot.remote(locator.id)

    await remote.connect()

    return remote
  }

  return new Context(local, connect)
}

exports.context = context
