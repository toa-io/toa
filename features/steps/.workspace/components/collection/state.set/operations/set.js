'use strict'

const { CACHE_KEY } = require('./.common/constants')

async function effect (input, context) {
  context.state[CACHE_KEY] = new Set(input)
}

exports.effect = effect
