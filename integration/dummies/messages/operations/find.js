'use strict'

async function observation (_, entries) {
  return { messages: entries }
}

module.exports = observation
