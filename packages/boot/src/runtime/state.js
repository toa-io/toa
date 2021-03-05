'use strict'

const { entity: { Factory: EntityFactory }, state: { Object, Collection }, Connector, Schema } = require('@kookaburra/runtime')

const state = (state) => {
  if (state === undefined) { return { connector: undefined, operations: (algorithm) => ({ algorithm }) } }

  const connector = storage(state.storage)
  const schema = state.schema && new Schema(state.schema)
  const entity = new EntityFactory(schema)

  const operations = (algorithm) => {
    let target

    if (algorithm.target === 'object') { target = new Object(connector, entity) }
    if (algorithm.target === 'collection') { target = new Collection(connector, entity) }

    if (!target) { throw new Error(`Unresolved target type '${algorithm.target}'`) }

    return { algorithm, target }
  }

  return { connector, operations }
}

const storage = (name) => {
  if (!name) name = DEFAULT_STORAGE

  const path = ['@kookaburra/storage-', ''].reduce(prefix =>
    require.resolve(`${prefix}${name}`, { paths: [__dirname, process.cwd()] }))

  if (!path) { throw new Error(`Unresolved storage connector '${name}'`) }

  const { Storage } = require(path, REQUIRE_OPTIONS)

  if (!Storage) { throw new Error(`Module '${path}' does not export Storage class`) }
  if (!(Storage.prototype instanceof Connector)) { throw new Error(`Storage '${name}' is not instance of Connector`) }

  return new Storage()
}

const DEFAULT_STORAGE = 'mongodb'
const REQUIRE_OPTIONS = { paths: [process.cwd()] }

exports.state = state
