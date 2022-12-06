'use strict'

const { empty } = require('@toa.io/libraries/generic')
const { ReplayException } = require('../exceptions')

/**
 * Published events matching the sample are being removed from the sample, therefore if there are any keys
 * remaining in the sample.events object, then it is a sample mismatch, that is, an exception.
 *
 * @param {toa.sampling.Sample} sample
 */
const verify = (sample) => {
  if (sample.events !== undefined && !empty(sample.events)) throw exception(sample)
}

/**
 * @param {toa.sampling.Sample} sample
 * @return {ReplayException}
 */
const exception = (sample) => {
  const keys = Object.keys(sample.events)
  const message = `Event${keys.length > 1 ? 's have' : ' has'} not been published: ${keys.join()}`

  return new ReplayException(message)
}

exports.verify = verify
