'use strict'

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.messages.Set}
 */
const messages = (context) => {
  return {
    [context.message.label]: context.message.samples
  }
}

exports.messages = messages
