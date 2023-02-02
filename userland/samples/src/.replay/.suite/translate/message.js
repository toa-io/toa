'use strict'

const { schemas } = require('./schemas')
const translate = require('./.message')

const schema = schemas.schema('message')

/**
 * @param {toa.samples.Message} declaration
 * @param {boolean} autonomous
 * @param {string} component
 * @returns {toa.sampling.Message}
 */
const message = (declaration, autonomous, component) => {
  schema.validate(declaration)

  const payload = declaration.payload
  const request = translate.request(declaration, autonomous)

  /** @type {toa.sampling.messages.Sample} */
  const sample = { component, request }

  return { payload, sample }
}

exports.message = message
