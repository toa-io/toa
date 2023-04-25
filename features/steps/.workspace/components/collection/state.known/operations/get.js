'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function computation (_, context) {
  return context.state[CACHE_KEY]
}

exports.computation = computation
