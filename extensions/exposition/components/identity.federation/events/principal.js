// @ts-check
'use strict'

/**
 * @param {{ state: import('../source/types').Entity }} event
 * @param {import('../source/types').Context} context
 * @returns boolean
 */
exports.condition = function (event, context) {
  return (
    context.configuration.principal !== undefined &&
    event.state.sub === context.configuration.principal
  )
}

/**
 * @param {{ state: import('../source/types').Entity & { id: string } }} event
 */
exports.payload = function (event) {
  return { id: event.state.id }
}
