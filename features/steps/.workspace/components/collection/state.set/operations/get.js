'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function computation (_, context) {
  return Array.from(context.state[CACHE_KEY])
}

exports.computation = computation
