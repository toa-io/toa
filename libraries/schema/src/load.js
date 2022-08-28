'use strict'

const { load: yaml } = require('@toa.io/libraries/yaml')
const { expand } = require('./expand')
const { Schema } = require('./schema')

/**
 * @param {string} path
 * @returns {toa.schema.Schema}
 */
const load = (path) => {
  const cons = yaml.sync(path)
  const schema = expand(cons)

  return new Schema(schema)
}

exports.load = load
