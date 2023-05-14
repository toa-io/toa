'use strict'

const { plain } = require('@toa.io/generic')
const types = require('./types')

/**
 * @param {toa.sampling.request.Extensions} extensions
 */
function cast (extensions) {
  for (const calls of Object.values(extensions)) calls.map(resolve)
}

/**
 * @param {toa.sampling.request.extensions.Call} call
 */
function resolve (call) {
  if (plain(call.result)) call.result = types.cast(call.result)
}

exports.cast = cast
