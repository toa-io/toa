'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const formats = require('ajv-formats')

const { options } = require('./options')
const { definitions } = require('./definitions')
const { keywords } = require('./keywrods')

const validator = new Ajv(options)

formats(validator)
keywords(validator)
definitions(validator)

/**
 * @param {Object} schema
 * @returns {boolean}
 */
const valid = (schema) => {
  if (schema.default !== undefined) {
    schema = { ...schema }
    delete schema.default
  }

  try {
    validator.compile(schema)
    return true
  } catch (e) {
    return false
  }
}

exports.valid = valid
