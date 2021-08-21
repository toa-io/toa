'use strict'

async function observation ({ output }, object) {
  output.id = object.id
  output.text = object.text
}

module.exports = observation
