'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function transition (input, object, context) {
  context.state[CACHE_KEY] = new Set([input.value1, input.value2, input.value3])
}

exports.transition = transition
