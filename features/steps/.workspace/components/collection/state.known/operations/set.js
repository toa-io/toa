'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function transition (input, object, context) {
  context.state[CACHE_KEY] = input
}

exports.transition = transition
