'use strict'

const { reduce } = require('@toa.io/generic')
const { expand } = require('@toa.io/concise')

const { Schema } = require('./schema')
const { create, is } = require('./validator')
const { readDirectory } = require('./directory')

class Namespace {
  /** @type {Record<string, toa.schemas.Schema>} */
  #schemas

  /**
   * @param {toa.schemas.Schema[]} schemas
   */
  constructor (schemas) {
    this.#schemas = reduce(schemas, (schemas, schema) => (schemas[schema.id] = schema))
  }

  schema (id) {
    if (!(id in this.#schemas)) {
      throw new Error(`Namespace doesn't contain schema '${id}'`)
    }

    return this.#schemas[id]
  }
}

const namespace = (path) => {
  const entries = typeof path === 'string' ? readDirectory(path) : path.map((schema) => ({ schema }))
  const schemas = entries.map(transform)
  const validator = create(schemas)
  const extract = (schema) => validator.getSchema(schema.$id)
  const instantiate = (validate) => new Schema(validate)
  const instances = schemas.map(extract).map(instantiate)

  return new Namespace(instances)
}

function transform (entry) {
  const schema = expand(entry.schema, is)

  schema.$id ??= entry.id

  return schema
}

exports.namespace = namespace
