'use strict'

async function observation ({ output }, object) {
  output.id = object._id
  output.text = object.text
}

module.exports = observation
