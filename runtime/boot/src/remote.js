'use strict'

const { Remote, Locator } = require('@kookaburra/core')

const boot = require('./index')

const remote = async (fqn) => {
  const discovery = await boot.discovery()
  const manifest = await discovery.lookup(fqn)
  const locator = new Locator(manifest)

  const calls = Object.fromEntries(Object.entries(manifest.operations)
    .map(([endpoint, definition]) => [endpoint, boot.call(locator, manifest, endpoint, definition)]))

  return new Remote(locator, calls)
}

exports.remote = remote
