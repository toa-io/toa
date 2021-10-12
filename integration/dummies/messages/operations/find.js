'use strict'

async function observation (_, entries) {
  return { output: entries }
}

exports.observation = observation
