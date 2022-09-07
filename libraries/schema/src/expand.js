'use strict'

const { primitive, object } = require('./.expand')

/** @type {toa.schema.Expand} */
const expand = (schema) => {
  return typeof schema === 'object' ? object(schema, expand) : primitive(schema)
}

exports.expand = expand
