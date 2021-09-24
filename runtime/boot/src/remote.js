'use strict'

const { Remote, Locator } = require('@kookaburra/core')

const boot = require('./index')

const remote = async (fqn, bindings) => {
  const discovery = boot.discovery(fqn, bindings)
  await discovery.connect()

  const manifest = await discovery.discover()
  const locator = new Locator(manifest)

  const calls = Object.fromEntries(Object.entries(locator.operations)
    .map(([endpoint, definition]) => [endpoint, boot.call(locator, endpoint, definition, bindings)]))

  return new Remote(locator, calls)
}

exports.remote = remote
