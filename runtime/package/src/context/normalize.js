'use strict'

const normalize = (context) => {
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === '.') {
    const runtime = require('@toa.io/runtime')

    context.runtime.version = runtime.version
    context.runtime.registry = LOCAL_REGISTRY
  }
}

const LOCAL_REGISTRY = 'http://localhost:4873'

exports.normalize = normalize
