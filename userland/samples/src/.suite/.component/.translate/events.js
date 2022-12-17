'use strict'

/**
 * @param {toa.samples.messages.Declaration} declaration
 * @returns {toa.samples.messages.Set}
 */
const events = (declaration) => {
  const set = {}

  for (const [label, sample] of Object.entries(declaration)) set[label] = { payload: sample }

  return set
}

exports.events = events
