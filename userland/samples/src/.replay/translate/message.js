'use strict'

const { add } = require('@toa.io/libraries/generic')

const translate = require('./operation')
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

  const payload = declaration.payload
  const request = req(declaration, autonomous)

  /** @type {toa.sampling.messages.Sample} */
  const sample = { component, request }

  return { payload, sample }
}

/**
 * @param {toa.samples.Message} declaration
 * @param {boolean} autonomous
 * @returns {toa.sampling.request.Sample}
 */
const req = (declaration, autonomous) => {
  const { title, input, query } = declaration

  /** @type {toa.sampling.request.Sample} */
  const sample = declaration.request === undefined
    ? {}
    : translate.operation(declaration.request, autonomous).sample

  /** @type {Partial<toa.sampling.request.Sample>} */
  const patch = { title, autonomous, request: { input, query } }

  if (declaration.request === undefined) patch.terminate = true

  add(sample, patch)

  return sample
}

exports.message = message
