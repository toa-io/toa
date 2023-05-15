'use strict'

async function computation (key, context) {
  return context.state.values.get(key)
}

exports.computation = computation
