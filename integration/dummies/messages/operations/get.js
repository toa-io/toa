'use strict'

async function observation (_, entry) {
  return { output: entry }
}

exports.observation = observation
