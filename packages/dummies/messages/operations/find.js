'use strict'

async function observation ({ output }, collection) {
  output.messages = collection
}

module.exports = observation
