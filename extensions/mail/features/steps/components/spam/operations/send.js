'use strict'

/**
 * @param {toa.extensions.mail.Message} input
 * @param context
 * @return {Promise<void>}
 */
async function effect (input, context) {
  await context.mail.send(input)
}

exports.effect = effect
