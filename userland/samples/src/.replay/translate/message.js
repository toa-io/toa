'use strict'

const { schemas } = require('./schemas')

const schema = schemas.schema('message')

/**
 * @param {toa.samples.Message} declaration
 * @param {boolean} autonomous
 * @param {string} component
 * @returns {toa.sampling.Message}
 */
const message = (declaration, autonomous, component) => {
  schema.validate(declaration)

  const { payload, title, input, query } = declaration
  const request = { input, query }
  const sample = { title, autonomous, component, request }

  return { payload, sample }
}

exports.message = message
