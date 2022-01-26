'use strict'

const normalize = (context) => {
  if (context.runtime === '.') {
    const runtime = require('@toa.io/runtime')

    context.runtime = runtime.version
  }
}

exports.normalize = normalize
