'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const { options } = require('./options')

const validator = new Ajv(options)

/**
 * @param {Object} schema
 * @returns {boolean}
 */
const valid = (schema) => {
  try {
    validator.compile(schema)
    return true
  } catch {
    return false
  }
}

exports.valid = valid
