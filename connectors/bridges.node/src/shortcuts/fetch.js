'use strict'

function fetch (context, aspect) {
  context.fetch = (...args) => aspect.invoke(context.operation, ...args)
}

exports.fetch = fetch
