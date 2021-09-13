'use strict'

const { Remote, Locator } = require('@kookaburra/core')

const boot = require('./index')

const remote = async (fqn, bindings) => {
  const discovery = boot.discovery(fqn)
  await discovery.connect()

  const manifest = await discovery.discover()
  const locator = new Locator(manifest)

  const calls = Object.fromEntries(
    locator.operations.map((operation) => [operation.name, boot.call(locator, operation, bindings)]))

  return new Remote(locator, calls)
}

exports.remote = remote
