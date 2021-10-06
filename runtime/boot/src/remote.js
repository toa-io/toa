'use strict'

const { Remote, Locator } = require('@kookaburra/core')

const boot = require('./index')

const remote = async (id) => {
  const explorer = await boot.discovery.explore(id)
  const manifest = await explorer.lookup()
  const locator = new Locator(manifest)

  const calls = Object.fromEntries(Object.entries(manifest.operations)
    .map(([endpoint, definition]) => [endpoint, boot.call(locator, endpoint, definition)]))

  return new Remote(locator, calls)
}

exports.remote = remote
