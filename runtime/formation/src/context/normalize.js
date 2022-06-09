'use strict'

const { convolve } = require('@toa.io/gears')

/**
 * @param {toa.formation.context.Declaration} context
 * @param {string} [environment]
 */
const normalize = (context, environment) => {
  convolve(context, environment)

  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === undefined || context.runtime.version === '.') {
    const runtime = require('@toa.io/runtime')

    context.runtime.version = runtime.version
  }

  if (typeof context.registry === 'string') context.registry = { base: context.registry }
}

exports.normalize = normalize
