const assert = require('node:assert')

function guard (state, origin, context) {
  assert(origin.id !== undefined, 'origin is required')
  assert(context.remote !== undefined, 'context is required')

  return state.b > state.a
}

exports.guard = guard
