'use strict'

const { Storage } = require('@kookaburra/storage')

const storage = (name, locator) => {
  if (!name) name = DEFAULT_STORAGE

  const path = ['@kookaburra/storages.', ''].reduce(prefix =>
    require.resolve(`${prefix}${name}`, REQUIRE_OPTIONS))

  if (!path) { throw new Error(`Unresolved storage connector '${name}'`) }

  const storage = require(path, REQUIRE_OPTIONS)

  if (!storage.Connector) { throw new Error(`Module '${path}' does not export Connector class`) }

  if (!(storage.Connector.prototype instanceof Storage)) {
    throw new Error(`Storage '${name}' Connector is not instance of Storage class from @kookaburra/storage`)
  }

  return new storage.Connector(locator)
}

const DEFAULT_STORAGE = 'mongodb'
const REQUIRE_OPTIONS = { paths: [process.cwd()] }

if (process.env.NODE_ENV === 'test') { REQUIRE_OPTIONS.paths.push(__dirname) }

exports.storage = storage
