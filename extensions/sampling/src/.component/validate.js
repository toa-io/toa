'use strict'

const { schemas } = require('../schemas')
const { SampleException } = require('../exceptions')

const schema = schemas.schema('request')

/**
 * @param {toa.sampling.request.Sample} sample
 */
const validate = (sample) => {
  const error = schema.fit(sample)

  if (error !== null) throw new SampleException(error.message)
}

exports.validate = validate
