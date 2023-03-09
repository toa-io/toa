'use strict'

const { empty } = require('@toa.io/generic')
const { ReplayException } = require('../exceptions')

/**
 * Published events matching the sample are being removed from the sample,
 * therefore if there are any keys remaining in the sample.events object,
 * then it is a sample mismatch, that is, an exception.
 *
 * @param {toa.sampling.request.Events} samples
 */
const verify = (samples) => {
  if (!empty(samples)) throw exception(samples)
}

/**
 * @param {toa.sampling.request.Events} samples
 * @return {ReplayException}
 */
const exception = (samples) => {
  const keys = Object.keys(samples)
  const message = `event${keys.length > 1 ? 's have' : ' has'} not been published: ${keys.join()}`

  return new ReplayException(message)
}

exports.verify = verify
