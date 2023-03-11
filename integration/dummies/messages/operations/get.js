'use strict'

async function observation (_, object) {
  const { id, sender, text, timestamp } = object
  const output = { id, sender, text, timestamp }

  return { output }
}

exports.observation = observation
