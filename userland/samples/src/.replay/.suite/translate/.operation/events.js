'use strict'

/**
 * @param {toa.samples.operations.Events} events
 * @returns {toa.sampling.request.Events}
 */
const events = (events) => {
  /** @type {toa.sampling.request.Events} */
  const set = {}

  for (const [label, sample] of Object.entries(events)) set[label] = { payload: sample }

  return set
}

exports.events = events
