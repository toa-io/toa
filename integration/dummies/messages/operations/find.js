'use strict'

async function observation (_, entries) {
  return { messages: entries }
}

exports.observation = observation
