'use strict'

const { expand } = require('@toa.io/libraries/schemas')

const { load: yaml } = require('@toa.io/libraries/yaml')
const { Schema } = require('./schema')

/**
 * @param {string} path
 * @returns {toa.schema.Schema}
 */
const load = (path) => {
  const cos = yaml.sync(path)
  const schema = expand(cos)

  return new Schema(schema)
}

exports.load = load
