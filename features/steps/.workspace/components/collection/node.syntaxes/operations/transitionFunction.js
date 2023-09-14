'use strict'

async function transition (input, object, context) {
  return context.configuration.foo
}

exports.transition = transition
