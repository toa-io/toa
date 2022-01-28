'use strict'

const normalize = (context) => {
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === '.') {
    const runtime = require('@toa.io/runtime')

    context.runtime.version = runtime.version
  }
}

exports.normalize = normalize
