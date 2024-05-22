'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const formats = /** @type {Function} */ require('ajv-formats')

/**
 * @param {object} schema
 */
function create (schema) {
  return ajv().compile(schema)
}

function is (schema) {
  return ajv().validateSchema(schema) === true
}

/**
 * @param {object[]} [schemas]
 */
function ajv (schemas) {
  const options = Object.assign({ schemas }, OPTIONS)
  const ajv = new Ajv(options)

  formats(ajv)

  return ajv
}

const OPTIONS = {
  useDefaults: true,
  coerceTypes: true,
  strictTypes: false // omit warning: missing type "object"
}

exports.create = create
exports.is = is
exports.ajv = ajv
