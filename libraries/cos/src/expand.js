'use strict'

const { primitive } = require('./primitive')
const { object } = require('./object')

/** @type {toa.cos.expand} */
const expand = (schema, validate) => {
  return typeof schema === 'object' ? object(schema, validate) : primitive(/** @type {string} */ schema)
}

exports.expand = expand
