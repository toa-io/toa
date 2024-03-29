'use strict'

/**
 * @param {toa.norm.context.Declaration | Object} context
 */
const normalize = (context) => {
  const runtime = require('@toa.io/runtime')

  if (context.runtime === undefined) context.runtime = { version: runtime.version }
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === undefined || context.runtime.version === '.') {
    context.runtime.version = runtime.version
  }

  if (typeof context.registry === 'string') context.registry = { base: context.registry }
}

exports.normalize = normalize
