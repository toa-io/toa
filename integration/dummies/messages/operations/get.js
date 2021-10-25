'use strict'

async function observation (_, entity) {
  return { output: entity }
}

exports.observation = observation
