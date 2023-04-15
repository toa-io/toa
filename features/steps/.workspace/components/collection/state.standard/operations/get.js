'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function observation (_, none, context) {
  return context.aspects.state()[CACHE_KEY]
}

exports.observation = observation
