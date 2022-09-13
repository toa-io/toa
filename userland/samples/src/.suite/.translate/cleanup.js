'use strict'

const { defined, empty } = require('@toa.io/libraries/generic')

/**
 * @param {toa.samples.Sample} sample
 */
const cleanup = (sample) => {
  for (const [key, value] of Object.entries(sample)) {
    if (value === undefined || (empty(defined(value)) && key !== 'request')) delete sample[key]
  }
}

exports.cleanup = cleanup
