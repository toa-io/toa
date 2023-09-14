'use strict'

async function observation (_, object) {
  const { id, sender, text, timestamp } = object

  return { id, sender, text, timestamp }
}

exports.observation = observation
