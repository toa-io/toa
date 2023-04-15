'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function observation (_, none, context) {
  return context.state[CACHE_KEY]
}

exports.observation = observation
