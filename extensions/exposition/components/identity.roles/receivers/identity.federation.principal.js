'use strict'

/**
 * @param {{ identity: string }} payload
 */
exports.request = (payload) => ({ input: { id: payload.identity } })
