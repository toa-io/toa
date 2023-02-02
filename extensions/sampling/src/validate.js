'use strict'

const { schemas } = require('./schemas')
const { SampleException } = require('./exceptions')

const compiled = {}

/**
 * @param {toa.sampling.request.Sample | toa.sampling.messages.Sample} sample
 * @param {string} id
 */
const validate = (sample, id) => {
  if (sample.authentic === true) return true

  if (!(id in compiled)) compiled[id] = schemas.schema(id)

  const error = compiled[id].fit(sample)

  if (error !== null) throw new SampleException(error.message)
}

exports.validate = validate
