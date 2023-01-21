'use strict'

const { resolve } = require('node:path')
const { load } = require('@toa.io/libraries/schema')
const { SampleException } = require('../exceptions')

const path = resolve(__dirname, 'sample.cos.yaml')
const schema = load(path)

/**
 * @param {toa.sampling.request.Sample} sample
 */
const validate = (sample) => {
  const error = schema.fit(sample)

  if (error !== null) throw new SampleException(error.message)
}

exports.validate = validate
