'use strict'

/**
 * @param {any} input
 * @returns {toa.queues.Properties}
 */
const normalize = (input) => {
  if (typeof input === 'string') return { exchange: input }
  else return input
}

exports.normalize = normalize
