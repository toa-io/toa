'use strict'

async function observation (input, none, context) {
  return context.configuration.signal
}

exports.observation = observation
