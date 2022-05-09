'use strict'

/**
 * @param context {toa.formation.context.Declaration}
 * @returns {toa.formation.context.Context}
 */
const normalize = (context) => {
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === undefined || context.runtime.version === '.') {
    const runtime = require('@toa.io/runtime')

    context.runtime.version = runtime.version
  }

  if (typeof context.registry === 'string') {
    context.registry = { base: context.registry }
  }
}

exports.normalize = normalize
