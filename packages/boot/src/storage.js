'use strict'

const { Connector } = require('@kookaburra/runtime')

const storage = (name) => {
  if (!name) name = DEFAULT_STORAGE

  const path = ['@kookaburra/storages.', ''].reduce(prefix =>
    require.resolve(`${prefix}${name}`, REQUIRE_OPTIONS))

  if (!path) { throw new Error(`Unresolved storage connector '${name}'`) }

  const storage = require(path, REQUIRE_OPTIONS)

  if (!storage.Connector) { throw new Error(`Module '${path}' does not export Storage class`) }

  if (!(storage.Connector.prototype instanceof Connector)) {
    throw new Error(`Storage '${name}' is not instance of Connector`)
  }

  return new storage.Connector()
}

const DEFAULT_STORAGE = 'mongodb'
const REQUIRE_OPTIONS = { paths: [process.cwd()] }

if (process.env.NODE_ENV === 'test') { REQUIRE_OPTIONS.paths.push(__dirname) }

exports.storage = storage
