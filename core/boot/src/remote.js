'use strict'

const { Remote, Locator } = require('@kookaburra/runtime')

const boot = require('./index')

const remote = async (fqn) => {
  const discovery = boot.discovery(fqn)
  await discovery.connect()

  const manifest = await discovery.discover()
  const locator = new Locator(manifest)

  const calls = Object.fromEntries(
    locator.operations.map((operation) => [operation.name, boot.call(locator, operation)]))

  return new Remote(locator, calls)
}

exports.remote = remote
