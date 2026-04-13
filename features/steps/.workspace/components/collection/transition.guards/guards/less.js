const assert = require('node:assert')

function guard (state, origin, context) {
  assert(state.id !== undefined && state._version !== undefined, 'state is required')
  assert(origin === null || origin._version !== undefined, 'origin is required')
  assert(context.remote !== undefined, 'context is required')

  return state.b > state.a
}

exports.guard = guard
