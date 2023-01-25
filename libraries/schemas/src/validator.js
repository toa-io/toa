'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const { add } = require('@toa.io/libraries/generic')

/**
 * @param {object[]} [schemas]
 */
const create = (schemas) => {
  const options = add({ schemas }, OPTIONS)

  return new Ajv(options)
}

/** @type {toa.schemas.is} */
const is = (schema) => {
  const validator = new Ajv()

  return validator.validateSchema(schema) === true
}

const OPTIONS = {
  useDefaults: true,
  coerceTypes: true,
  strictTypes: false // omit warning: missing type "object"
}

exports.create = create
exports.is = is
