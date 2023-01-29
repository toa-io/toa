'use strict'

const { add, defined } = require('@toa.io/libraries/generic')
const translate = require('../operation')

/**
 * @param {toa.samples.Message} declaration
 * @param {boolean} autonomous
 * @returns {toa.sampling.request.Sample}
 */
const request = (declaration, autonomous) => {
  const { title, input, query } = declaration

  /** @type {toa.sampling.request.Sample} */
  const sample = declaration.request === undefined
    ? {}
    : translate.operation(declaration.request, autonomous).sample

  const request = defined({ input, query })

  /** @type {Partial<toa.sampling.request.Sample>} */
  const patch = { title, autonomous, request }

  if (declaration.request === undefined) patch.terminate = true

  add(sample, patch)

  return sample
}

exports.request = request
