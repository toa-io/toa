'use strict'

async function transition (input, object, context) {
  const foo = context.configuration.foo
  
  return { foo }
}

exports.transition = transition
