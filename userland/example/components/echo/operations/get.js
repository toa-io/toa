'use strict'

async function computation (_, context) {
  return context.state.value
}

exports.computation = computation
