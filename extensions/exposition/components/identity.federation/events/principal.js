// @ts-check
/**
 * @param {{ state: import('../source/types/index.js').Entity }} event
 * @param {import('../source/types/index.js').Context} context
 * @returns boolean
 */
export const condition = function (event, context) {
  return (
    context.configuration.principal !== undefined &&
    event.state.sub === context.configuration.principal.sub &&
    event.state.iss === context.configuration.principal.iss
  )
}

/**
 * @param {{ state: import('../source/types/index.js').Entity }} event
 */
export const payload = function (event) {
  return { identity: event.state.identity }
}
